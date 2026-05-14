'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, AlertTriangle, CheckCircle, Loader2, ArrowDownRight, ArrowUpRight, X, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface CashMovement {
  id: string; type: string; amount: number; reason: string; notes?: string; approvedBy: string; createdAt: string
}

interface RegisterSession {
  id: string; staffName: string; openingActual: number; openingExpected: number; openingVariance: number; openingFlagged: boolean;
  movements: CashMovement[]
}

const OVERRIDE_REASONS = [
  { value: 'bank-deposit', label: 'Bank Deposit' },
  { value: 'authorized-payout', label: 'Authorized Payout' },
  { value: 'tip-payout', label: 'Tip Payout' },
  { value: 'counting-error', label: 'Counting Error' },
  { value: 'missing-receipt', label: 'Missing Receipt' },
  { value: 'unexplained-shortage', label: 'Unexplained Shortage' },
  { value: 'other', label: 'Other' },
]

function ManagerOverridePanel({ variance, sessionId, onApproved }: { variance: number; sessionId: string; onApproved: (override: object) => void }) {
  const [pin, setPin] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [notes, setNotes] = useState('')
  const [validating, setValidating] = useState(false)
  const [managerName, setManagerName] = useState<string | null>(null)
  const [pinError, setPinError] = useState('')

  async function validatePin() {
    setValidating(true)
    setPinError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, requiredRole: 'manager' })
      })
      const data = await res.json()
      if (!data.valid) {
        setPinError(data.error || 'Invalid PIN or insufficient role')
      } else {
        setManagerName(data.staff.name)
      }
    } catch {
      setPinError('Failed to validate PIN')
    } finally {
      setValidating(false)
    }
  }

  function handleApprove() {
    if (!reasonCode || !managerName) return
    onApproved({ reasonCode, notes, approvedBy: managerName })
  }

  return (
    <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-red-400" />
        <div>
          <p className="text-white font-semibold">Manager Override Required</p>
          <p className="text-red-400 text-sm">Variance: {variance > 0 ? '+' : ''}{formatCurrency(variance)}</p>
        </div>
      </div>

      {!managerName ? (
        <div className="space-y-3">
          <Label className="text-zinc-300">Manager PIN</Label>
          <div className="flex gap-2">
            <Input
              type="password"
              className="bg-zinc-700/50 border-zinc-600 text-white"
              placeholder="Enter manager PIN"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError('') }}
            />
            <Button onClick={validatePin} disabled={validating || !pin} className="bg-red-700 hover:bg-red-600 text-white">
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
            </Button>
          </div>
          {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" /> Manager: <span className="font-semibold">{managerName}</span>
          </div>
          <div>
            <Label className="text-zinc-300 mb-2 block">Reason Code *</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-white">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {OVERRIDE_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-300 mb-2 block">Notes (optional)</Label>
            <Input className="bg-zinc-700/50 border-zinc-600 text-white" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." />
          </div>
          <Button className="w-full bg-red-700 hover:bg-red-600 text-white" disabled={!reasonCode} onClick={handleApprove}>
            Approve Override & Close Register
          </Button>
        </div>
      )}
    </div>
  )
}

export function RegisterCloseScreen({ session, onClosed }: { session: RegisterSession; onClosed: () => void }) {
  const [closingActual, setClosingActual] = useState('')
  const [step, setStep] = useState<'summary' | 'count' | 'override'>('summary')
  const [requiresOverride, setRequiresOverride] = useState(false)
  const [closingExpected, setClosingExpected] = useState(0)
  const [closingVariance, setClosingVariance] = useState(0)
  const queryClient = useQueryClient()

  const cashMovementsTotal = session.movements.reduce((sum, m) => {
    if (m.type === 'deposit' || m.type === 'payout' || m.type === 'tip-payout') return sum - m.amount
    if (m.type === 'adjustment') return sum + m.amount
    return sum
  }, 0)

  const closeSession = useMutation({
    mutationFn: async (override?: object) => {
      const res = await fetch('/api/register/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id, action: 'close', closingActual, override })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requiresOverride) {
          setRequiresOverride(true)
          setClosingExpected(data.closingExpected)
          setClosingVariance(data.closingVariance)
          setStep('override')
          return null
        }
        throw new Error(data.error || 'Failed')
      }
      return data
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['register-sessions'] })
      toast.success('Register closed successfully')
      onClosed()
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const actual = parseFloat(closingActual) || 0
  const closingExpectedAmount = session.openingActual + cashMovementsTotal
  const closingVariancePreview = actual - closingExpectedAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-red-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Close Register</h2>
          <p className="text-zinc-400">Operator: {session.staffName}</p>
        </div>

        {step === 'summary' && (
          <div className="space-y-4">
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700 p-5 space-y-3">
              <h3 className="text-white font-semibold mb-3">Cash Summary</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Opening Cash</span>
                <span className="text-white font-medium">{formatCurrency(session.openingActual)}</span>
              </div>
              {session.movements.length > 0 && (
                <>
                  <div className="border-t border-zinc-700 pt-3 mt-2">
                    <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wide">Cash Movements</p>
                    {session.movements.map(m => (
                      <div key={m.id} className="flex justify-between items-center text-sm mb-1">
                        <span className="text-zinc-400 flex items-center gap-1">
                          {(m.type === 'deposit' || m.type === 'payout' || m.type === 'tip-payout')
                            ? <ArrowUpRight className="h-3 w-3 text-red-400" />
                            : <ArrowDownRight className="h-3 w-3 text-emerald-400" />
                          }
                          {m.type} — {m.reason}
                        </span>
                        <span className={`font-medium ${m.type === 'deposit' || m.type === 'payout' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {(m.type === 'deposit' || m.type === 'payout' || m.type === 'tip-payout') ? '-' : '+'}{formatCurrency(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="border-t border-zinc-700 pt-3 mt-2 flex justify-between items-center">
                <span className="text-zinc-300 font-semibold">System Expected in Drawer</span>
                <span className="text-white font-bold text-lg">{formatCurrency(closingExpectedAmount)}</span>
              </div>
            </div>

            {session.openingFlagged && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-amber-300 text-sm">Opening variance was flagged: {formatCurrency(session.openingVariance)}</p>
              </div>
            )}

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-12" onClick={() => setStep('count')}>
              Count Drawer & Close Register
            </Button>
          </div>
        )}

        {step === 'count' && (
          <div className="space-y-4">
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700 p-6 space-y-4">
              <div className="bg-zinc-700/40 rounded-xl p-4">
                <p className="text-zinc-400 text-sm mb-1">System Expected Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(closingExpectedAmount)}</p>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Count Cash Drawer — Enter Actual Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                  <Input
                    className="bg-zinc-700/50 border-zinc-600 text-white pl-7 text-lg font-semibold focus:border-red-500"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingActual}
                    onChange={e => setClosingActual(e.target.value)}
                  />
                </div>
              </div>

              {closingActual && (
                <div className={`rounded-xl p-3 border flex items-center gap-3 ${closingVariancePreview === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  {closingVariancePreview === 0 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
                  <div>
                    <p className={`text-sm font-semibold ${closingVariancePreview === 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {closingVariancePreview === 0 ? 'Balanced — no variance' : `Variance: ${closingVariancePreview > 0 ? '+' : ''}${formatCurrency(closingVariancePreview)}`}
                    </p>
                    {closingVariancePreview !== 0 && <p className="text-xs text-red-400/70 mt-0.5">Manager override required to close</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700" onClick={() => setStep('summary')}>Back</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!closingActual || closeSession.isPending}
                onClick={() => closeSession.mutate(undefined)}
              >
                {closeSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Close Register'}
              </Button>
            </div>
          </div>
        )}

        {step === 'override' && (
          <div className="space-y-4">
            <ManagerOverridePanel
              variance={closingVariance}
              sessionId={session.id}
              onApproved={(override) => closeSession.mutate(override)}
            />
            <Button variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700" onClick={() => setStep('count')}>
              Back to Count
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
