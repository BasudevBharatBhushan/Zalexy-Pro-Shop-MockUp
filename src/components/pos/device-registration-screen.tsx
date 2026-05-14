'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Plus, Trash2, Loader2, CheckCircle, XCircle, MapPin, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Device {
  id: string; name: string; deviceKey: string; location: string; isActive: boolean; registeredBy?: string; createdAt: string
}
interface Staff {
  id: string; name: string; role: string; isActive: boolean; createdAt: string; pin?: string
}

export function DeviceRegistrationScreen() {
  const queryClient = useQueryClient()
  const [deviceDialog, setDeviceDialog] = useState(false)
  const [staffDialog, setStaffDialog] = useState(false)
  const [deviceForm, setDeviceForm] = useState({ name: '', location: 'Main', registeredBy: '' })
  const [staffForm, setStaffForm] = useState({ name: '', pin: '', role: 'cashier' })

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => fetch('/api/devices').then(r => r.json()),
  })

  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: () => fetch('/api/staff').then(r => r.json()),
  })

  const addDevice = useMutation({
    mutationFn: () => fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceForm)
    }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Device registered')
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setDeviceDialog(false)
      setDeviceForm({ name: '', location: 'Main', registeredBy: '' })
    },
    onError: () => toast.error('Failed to register device')
  })

  const toggleDevice = useMutation({
    mutationFn: (device: Device) => fetch('/api/devices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: device.id, isActive: !device.isActive })
    }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Device updated')
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    }
  })

  const addStaff = useMutation({
    mutationFn: () => fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffForm)
    }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Staff member added')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setStaffDialog(false)
      setStaffForm({ name: '', pin: '', role: 'cashier' })
    },
    onError: () => toast.error('Failed to add staff')
  })

  const roleBadge: Record<string, { label: string; className: string }> = {
    cashier: { label: 'Cashier', className: 'bg-zinc-700 text-zinc-300' },
    manager: { label: 'Manager', className: 'bg-blue-900/60 text-blue-300 border-blue-700' },
    executive: { label: 'Executive', className: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50">
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Devices & Staff</h1>
          <p className="text-sm text-zinc-500">Manage registered POS devices and staff access</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Devices Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-600" />
              Registered Devices
            </h2>
            <Button onClick={() => setDeviceDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Register Device
            </Button>
          </div>

          {devicesLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-zinc-200">
              <Monitor className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500">No devices registered yet</p>
              <p className="text-zinc-400 text-sm mt-1">Register a device to allow POS access</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {devices.map(device => (
                <div key={device.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isActive ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                      <Monitor className={`h-5 w-5 ${device.isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-900">{device.name}</p>
                        <Badge className={device.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{device.location}</span>
                        <span className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Key className="h-3 w-3" />{device.deviceKey}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{format(new Date(device.createdAt), 'MMM d, yyyy')}</span>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => toggleDevice.mutate(device)}
                      className={device.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}
                    >
                      {device.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      {device.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Staff & Access</h2>
            <Button onClick={() => setStaffDialog(true)} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </div>

          {staffLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-zinc-200">
              <p className="text-zinc-500 text-sm">No staff added yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">PIN</th>
                    <th className="px-4 py-3 text-left">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge className={roleBadge[s.role]?.className || ''} variant="outline">
                          {roleBadge[s.role]?.label || s.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{'●'.repeat((s.pin || '1234').length)}</td>
                      <td className="px-4 py-3 text-zinc-400">{format(new Date(s.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Device Dialog */}
      <Dialog open={deviceDialog} onOpenChange={setDeviceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register New Device</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Device Name *</Label>
              <Input className="mt-1" placeholder="e.g. Main Counter iPad" value={deviceForm.name} onChange={e => setDeviceForm({ ...deviceForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input className="mt-1" placeholder="e.g. Main, Front Desk" value={deviceForm.location} onChange={e => setDeviceForm({ ...deviceForm, location: e.target.value })} />
            </div>
            <div>
              <Label>Registered By</Label>
              <Input className="mt-1" placeholder="Your name (Executive)" value={deviceForm.registeredBy} onChange={e => setDeviceForm({ ...deviceForm, registeredBy: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceDialog(false)}>Cancel</Button>
            <Button onClick={() => addDevice.mutate()} disabled={!deviceForm.name || addDevice.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {addDevice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Dialog */}
      <Dialog open={staffDialog} onOpenChange={setStaffDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input className="mt-1" placeholder="Full name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
            </div>
            <div>
              <Label>PIN *</Label>
              <Input className="mt-1" type="text" inputMode="numeric" maxLength={6} placeholder="4–6 digit PIN" value={staffForm.pin} onChange={e => setStaffForm({ ...staffForm, pin: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2"
                value={staffForm.role}
                onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialog(false)}>Cancel</Button>
            <Button onClick={() => addStaff.mutate()} disabled={!staffForm.name || !staffForm.pin || addStaff.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {addStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
