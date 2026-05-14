'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, DollarSign, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const MOVEMENT_TYPES = [
  { value: 'deposit', label: 'Bank Deposit', icon: '⬆️', color: 'text-red-400' },
  { value: 'payout', label: 'Payout', icon: '💸', color: 'text-red-400' },
  { value: 'tip-payout', label: 'Tip Payout', icon: '🎁', color: 'text-orange-400' },
  { value: 'adjustment', label: 'Manual Adjustment', icon: '⚙️', color: 'text-blue-400' },
]

const REASONS_BY_TYPE: Record<string, string[]> = {
  deposit: ['End of shift deposit', 'Bank run', 'Safe drop', 'Other'],
  payout: ['Vendor payment', 'Supplies', 'Petty cash', 'Emergency expense', 'Other'],
  'tip-payout': ['End of shift tip distribution', 'Pool distribution', 'Other'],
  adjustment: ['Overage correction', 'Shortage correction', 'Initial count correction', 'Other'],
}

export function CashMovementScreen({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [type, setType] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [managerPin, setManagerPin] = useState('')
  const [managerName, setManagerName] = useState<string | null>(null)
  const [pinError, setPinError] = useState('')
  const [validating, setValidating] = useState(false)
  const queryClient = useQueryClient()

  async function validateManagerPin() {
    setValidating(true)
    setPinError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: managerPin, requiredRole: 'manager' })
      })
      const data = await res.json()
      if (!data.valid) {
        setPinError(data.error || 'Invalid PIN or insufficient role')
      } else {
        setManagerName(data.staff.name)
      }
    } catch {
      setPinError('Failed to validate')
    } finally {
      setValidating(false)
    }
  }

  const createMovement = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/register/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type, amount: parseFloat(amount), reason, notes, approvedBy: managerName! })
      })
      if (!res.ok) throw new Error('Failed to save movement')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Cash movement recorded')
      queryClient.invalidateQueries({ queryKey: ['register-sessions'] })
      // Reset form
      setType(''); setAmount(''); setReason(''); setNotes(''); setManagerName(null); setManagerPin('')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const selectedType = MOVEMENT_TYPES.find(t => t.value === type)

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-blue-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Cash Movement</h2>
          <p className="text-zinc-400">Record a cash event during this session</p>
        </div>

        <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700 p-6 space-y-5">
          {/* Movement Type */}
          <div>
            <Label className="text-zinc-300 mb-3 block">Movement Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {MOVEMENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setReason('') }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    type === t.value
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-zinc-700/30 border-zinc-600 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {type && (
            <>
              <div>
                <Label className="text-zinc-300 mb-2 block">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                  <Input
                    className="bg-zinc-700/50 border-zinc-600 text-white pl-7 text-lg font-semibold focus:border-blue-500"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-white">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(REASONS_BY_TYPE[type] || []).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Notes (optional)</Label>
                <Textarea
                  className="bg-zinc-700/50 border-zinc-600 text-white resize-none"
                  placeholder="Additional details..."
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Manager approval */}
              <div className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/50">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <p className="text-zinc-300 text-sm font-medium">Manager Approval Required</p>
                </div>
                {!managerName ? (
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      className="bg-zinc-700/50 border-zinc-600 text-white"
                      placeholder="Manager PIN"
                      value={managerPin}
                      onChange={e => { setManagerPin(e.target.value); setPinError('') }}
                    />
                    <Button onClick={validateManagerPin} disabled={validating || !managerPin} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">
                      {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Approved by: <span className="font-semibold">{managerName}</span>
                  </div>
                )}
                {pinError && <p className="text-red-400 text-xs mt-1">{pinError}</p>}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!type || !amount || !reason || !managerName || createMovement.isPending}
            onClick={() => createMovement.mutate()}
          >
            {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Movement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
