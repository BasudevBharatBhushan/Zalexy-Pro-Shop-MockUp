'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, History, ArrowLeft, SlidersHorizontal, Package } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const LOG_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  initial: { label: 'Initial', color: 'text-zinc-600', bg: 'bg-zinc-100' },
  restock: { label: 'Restock', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  sale: { label: 'Sale', color: 'text-orange-700', bg: 'bg-orange-50' },
  adjustment: { label: 'Adjustment', color: 'text-amber-700', bg: 'bg-amber-50' },
  void: { label: 'Void', color: 'text-red-700', bg: 'bg-red-50' },
  return: { label: 'Return', color: 'text-sky-700', bg: 'bg-sky-50' },
}

export function InventoryLogsScreen() {
  const { setActiveScreen, inventoryLogVersion } = useAppStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['all-inventory-logs', inventoryLogVersion],
    queryFn: async () => {
      const res = await fetch('/api/inventory-log?limit=200')
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
  })

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      if (typeFilter !== 'all' && log.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = log.product?.name?.toLowerCase().includes(q)
        const matchSku = log.product?.sku?.toLowerCase().includes(q)
        const matchPo = log.poNumber?.toLowerCase().includes(q)
        return matchName || matchSku || matchPo
      }
      return true
    })
  }, [logs, search, typeFilter])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveScreen('inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              Inventory Logs
            </h1>
            <p className="text-sm text-zinc-500">Track all stock movements and adjustments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Note: In a real implementation, this button would open the universal adjustment dialog */}
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setActiveScreen('inventory')}>
            <SlidersHorizontal className="h-4 w-4" />
            Make Adjustment
          </Button>
        </div>
      </div>

      <div className="px-6 py-3 border-b bg-zinc-50/50 flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search by product name, SKU, or PO No..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(LOG_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>PO No</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Staff / Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-zinc-500">Loading logs...</TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-zinc-500">
                      <Package className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                      No inventory logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => {
                    const config = LOG_TYPE_CONFIG[log.type] || { label: log.type, color: 'text-zinc-700', bg: 'bg-zinc-100' }
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm text-zinc-500">
                          {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-zinc-900">{log.product?.name || 'Unknown'}</div>
                          <div className="text-xs text-zinc-500">{log.product?.sku}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${log.quantity > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          {log.quantity > 0 ? '+' : ''}{log.quantity}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-zinc-600">
                          {log.poNumber || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {log.unitCost !== null ? formatCurrency(log.unitCost) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {log.totalCost !== null ? formatCurrency(log.totalCost) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-zinc-900">{log.staffName || 'System'}</div>
                          {log.note && <div className="text-xs text-zinc-500 truncate max-w-[200px]" title={log.note}>{log.note}</div>}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
