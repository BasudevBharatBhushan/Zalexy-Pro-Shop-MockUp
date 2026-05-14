'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, DollarSign, Calendar, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function StatCard({ label, value, icon, className = '' }: { label: string; value: string; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  )
}

function SessionRow({ session }: { session: any }) {
  const [expanded, setExpanded] = useState(false)
  const variance = session.closingVariance ?? session.openingVariance
  const hasVariance = Math.abs(variance || 0) > 0.01

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-zinc-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900">{session.device?.name || 'Unknown Device'}</span>
              <Badge className={session.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'} variant="outline">
                {session.status}
              </Badge>
              {hasVariance && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">
                  <AlertTriangle className="h-3 w-3 mr-1" />Variance
                </Badge>
              )}
              {session.override && (
                <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">Override</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              {session.staffName} • Opened {format(new Date(session.openedAt), 'MMM d, h:mm a')}
              {session.closedAt && ` • Closed ${format(new Date(session.closedAt), 'h:mm a')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm text-zinc-500">Opening</p>
            <p className="font-semibold">{formatCurrency(session.openingActual)}</p>
          </div>
          {session.closingActual != null && (
            <div>
              <p className="text-sm text-zinc-500">Closing</p>
              <p className="font-semibold">{formatCurrency(session.closingActual)}</p>
            </div>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-zinc-50 p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-zinc-500 text-xs mb-1">Expected Opening</p>
              <p className="font-semibold">{formatCurrency(session.openingExpected)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-zinc-500 text-xs mb-1">Actual Opening</p>
              <p className="font-semibold">{formatCurrency(session.openingActual)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-zinc-500 text-xs mb-1">Opening Variance</p>
              <p className={`font-semibold ${session.openingVariance !== 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
                {session.openingVariance > 0 ? '+' : ''}{formatCurrency(session.openingVariance)}
              </p>
            </div>
            {session.closingVariance != null && (
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-zinc-500 text-xs mb-1">Closing Variance</p>
                <p className={`font-semibold ${Math.abs(session.closingVariance) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {session.closingVariance > 0 ? '+' : ''}{formatCurrency(session.closingVariance)}
                </p>
              </div>
            )}
          </div>

          {session.movements?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">Cash Movements</p>
              <div className="space-y-1">
                {session.movements.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border">
                    <span className="text-zinc-600">{m.type} — {m.reason} <span className="text-zinc-400">(by {m.approvedBy})</span></span>
                    <span className={`font-medium ${m.type === 'adjustment' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.type === 'adjustment' ? '+' : '-'}{formatCurrency(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.override && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs text-red-600 uppercase font-semibold mb-1">Manager Override</p>
              <p className="text-sm text-zinc-700">
                <span className="font-medium">{session.override.approvedBy}</span> approved override for {formatCurrency(Math.abs(session.override.varianceAmount))} variance.
                Reason: <span className="font-medium">{session.override.reasonCode}</span>
                {session.override.notes && ` — ${session.override.notes}`}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{format(new Date(session.override.approvedAt), 'MMM d, h:mm a')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ReportsScreen() {
  const [reportTab, setReportTab] = useState<'daily' | 'sessions'>('daily')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report', reportDate],
    queryFn: () => fetch(`/api/reports?type=daily-sales&date=${reportDate}`).then(r => r.json()),
    enabled: reportTab === 'daily',
  })

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ['sessions-report'],
    queryFn: () => fetch('/api/reports?type=session-summary').then(r => r.json()),
    enabled: reportTab === 'sessions',
  })

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50">
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Reports
          </h1>
          <p className="text-sm text-zinc-500">Sales analytics and register session history</p>
        </div>
        <div className="flex gap-2">
          {['daily', 'sessions'].map(tab => (
            <Button
              key={tab}
              variant={reportTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReportTab(tab as 'daily' | 'sessions')}
              className={reportTab === tab ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {tab === 'daily' ? 'Daily Sales' : 'Register Sessions'}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {reportTab === 'daily' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {dailyLoading ? (
              <div className="flex justify-center p-12"><div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" /></div>
            ) : dailyReport && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Orders" value={String(dailyReport.totalOrders)} icon={<FileText className="h-4 w-4 text-zinc-500" />} />
                  <StatCard label="Total Sales" value={formatCurrency(dailyReport.totalSales)} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
                  <StatCard label="Tips Collected" value={formatCurrency(dailyReport.totalTips)} icon={<TrendingUp className="h-4 w-4 text-blue-500" />} />
                  <StatCard label="Discounts Applied" value={formatCurrency(dailyReport.totalDiscounts)} icon={<TrendingDown className="h-4 w-4 text-orange-500" />} />
                </div>

                {dailyReport.orders?.length > 0 && (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="p-4 border-b bg-zinc-50">
                      <h3 className="font-semibold text-zinc-900">Order Breakdown</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-semibold border-b">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Discount</th>
                          <th className="px-4 py-3 text-right">Tip</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {dailyReport.orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 font-mono text-zinc-500">#{o.orderNumber}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">{o.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600">{o.discount > 0 ? `-${formatCurrency(o.discount)}` : '—'}</td>
                            <td className="px-4 py-3 text-right text-blue-600">{o.tip > 0 ? `+${formatCurrency(o.tip)}` : '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(o.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {reportTab === 'sessions' && (
          <div className="space-y-3">
            {sessionsLoading ? (
              <div className="flex justify-center p-12"><div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" /></div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <BarChart3 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500">No register sessions recorded yet</p>
              </div>
            ) : (
              sessions.map(s => <SessionRow key={s.id} session={s} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
