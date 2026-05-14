'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, AlertTriangle, CheckCircle, Loader2, Monitor, ChevronRight, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface Device {
  id: string
  name: string
  deviceKey: string
  location: string
  isActive: boolean
}

interface RegisterSession {
  id: string
  deviceId: string
  staffName: string
  status: string
  openingExpected: number
  openingActual: number
  openingVariance: number
  openingFlagged: boolean
  device?: Device
}

export function RegisterOpenScreen({ onSessionOpened, onGoToDevices }: {
  onSessionOpened: (session: RegisterSession) => void
  onGoToDevices?: () => void
}) {
  const { activeRegisterDevice, currentStaff } = useAppStore()
  const [staffName, setStaffName] = useState(currentStaff?.name || '')
  const [actualAmount, setActualAmount] = useState('')
  const [step, setStep] = useState<'device' | 'count' | 'confirm'>('device')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [registerDialog, setRegisterDialog] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', location: 'Main', registeredBy: '' })
  const queryClient = useQueryClient()

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => fetch('/api/devices').then(r => r.json()),
  })

  // Check if this device already has an open session
  const { data: openSessions = [] } = useQuery<RegisterSession[]>({
    queryKey: ['register-sessions-open', selectedDevice?.id],
    queryFn: () => fetch(`/api/register/sessions?deviceId=${selectedDevice?.id}&status=open`).then(r => r.json()),
    enabled: !!selectedDevice?.id,
  })

  // Get last closed session for carry-forward
  const { data: lastClosedSessions = [] } = useQuery<RegisterSession[]>({
    queryKey: ['register-sessions-closed', selectedDevice?.id],
    queryFn: () => fetch(`/api/register/sessions?deviceId=${selectedDevice?.id}&status=closed`).then(r => r.json()),
    enabled: !!selectedDevice?.id,
  })

  const lastClosed = lastClosedSessions[0]
  const openingExpected = lastClosed?.openingActual ?? 0 // carry-forward from last session's actual close
  const actual = parseFloat(actualAmount) || 0
  const variance = actual - openingExpected

  const openSession = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/register/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice!.id,
          staffName,
          openingActual: actual,
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['register-sessions'] })
      toast.success('Register opened successfully')
      onSessionOpened(session)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const hasOpenSession = openSessions.length > 0

  // Inline device registration from lock screen
  const registerDevice = useMutation({
    mutationFn: () => fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm)
    }).then(r => r.json()),
    onSuccess: (device) => {
      toast.success(`Device "${device.name}" registered`)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setRegisterDialog(false)
      setRegForm({ name: '', location: 'Main', registeredBy: '' })
      // Auto-select the newly registered device
      setSelectedDevice(device)
      setStep('count')
    },
    onError: () => toast.error('Failed to register device')
  })

  if (step === 'device') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">StrikePOS</h1>
            <p className="text-zinc-400">Select this register to continue</p>
          </div>

          {devicesLoading ? (
            <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
          ) : devices.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-zinc-800/60 rounded-2xl p-6 text-center border border-zinc-700">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">No Registered Devices</p>
                <p className="text-zinc-400 text-sm mb-5">This device hasn't been set up yet. A manager can register it now.</p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => setRegisterDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  Register This Device
                </Button>
                {onGoToDevices && (
                  <button
                    onClick={onGoToDevices}
                    className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 w-full"
                  >
                    <Settings className="h-3 w-3" />
                    Manage all devices
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.filter(d => d.isActive).map(device => (
                <button
                  key={device.id}
                  onClick={() => { setSelectedDevice(device); setStep('count') }}
                  className="w-full flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700 hover:border-emerald-500/50 rounded-2xl p-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-600/40 transition-colors">
                      <Monitor className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{device.name}</p>
                      <p className="text-zinc-400 text-sm">{device.location}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          )}

        {/* Also show "manage devices" link when devices exist but manager wants to add more */}
        {devices.length > 0 && onGoToDevices && (
          <button
            onClick={onGoToDevices}
            className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 w-full"
          >
            <Settings className="h-3 w-3" />
            Manage devices
          </button>
        )}
      </div>

      {/* Inline Device Registration Dialog */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register This Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Device Name *</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Main Counter iPad"
                value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Main, Front Desk"
                value={regForm.location}
                onChange={e => setRegForm({ ...regForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Registered By (your name)</Label>
              <Input
                className="mt-1"
                placeholder="Manager or Executive name"
                value={regForm.registeredBy}
                onChange={e => setRegForm({ ...regForm, registeredBy: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialog(false)}>Cancel</Button>
            <Button
              disabled={!regForm.name || registerDevice.isPending}
              onClick={() => registerDevice.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {registerDevice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register & Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    )
  }

  if (step === 'count') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Open Register</h2>
            <p className="text-zinc-400">{selectedDevice?.name} — {selectedDevice?.location}</p>
          </div>

          {hasOpenSession && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-300 font-semibold text-sm">Session Already Open</p>
                <p className="text-amber-400/80 text-xs mt-1">This device has an active session. Use the close register option or contact a manager to force-close it.</p>
              </div>
            </div>
          )}

          <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700 p-6 space-y-5">
            <div>
              <Label className="text-zinc-300 mb-2 block">Your Name</Label>
              <Input
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                placeholder="Enter your name"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
              />
            </div>

            <div className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/50">
              <p className="text-zinc-400 text-sm mb-1">Expected Opening Amount</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(openingExpected)}</p>
              {lastClosed ? (
                <p className="text-zinc-500 text-xs mt-1">Carry-forward from last session</p>
              ) : (
                <p className="text-zinc-500 text-xs mt-1">First time opening — expected $0.00</p>
              )}
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Count Cash Drawer — Enter Actual Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                <Input
                  className="bg-zinc-700/50 border-zinc-600 text-white pl-7 text-lg font-semibold focus:border-emerald-500"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualAmount}
                  onChange={e => setActualAmount(e.target.value)}
                />
              </div>
            </div>

            {actualAmount && (
              <div className={`rounded-xl p-3 border flex items-center gap-3 ${variance === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                {variance === 0 ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${variance === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {variance === 0 ? 'No variance' : `Variance: ${variance > 0 ? '+' : ''}${formatCurrency(variance)}`}
                  </p>
                  {variance !== 0 && (
                    <p className="text-xs text-amber-400/70 mt-0.5">Will be logged and flagged for manager review</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700" onClick={() => setStep('device')}>
              Back
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!staffName || !actualAmount || hasOpenSession || openSession.isPending}
              onClick={() => openSession.mutate()}
            >
              {openSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Open Register'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
