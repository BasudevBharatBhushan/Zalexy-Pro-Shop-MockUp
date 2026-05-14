'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Trash2, PackagePlus, ArrowDownToLine, Receipt } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  costPrice: number
  stockCount: number
}

interface ReceivingItem {
  product: Product
  quantity: number
  unitCost: number
}

export function ReceivingScreen() {
  const { productsVersion, refreshProducts, refreshInventoryLog } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ReceivingItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch products for searching
  const { data: products = [] } = useQuery({
    queryKey: ['products-receiving', search, productsVersion],
    queryFn: async () => {
      if (!search.trim()) return []
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json() as Promise<Product[]>
    },
    enabled: search.trim().length > 1
  })

  function handleAdd(product: Product) {
    if (items.find(i => i.product.id === product.id)) {
      toast.error('Product already in receiving list')
      return
    }
    setItems([...items, { product, quantity: 1, unitCost: product.costPrice || 0 }])
    setSearch('')
  }

  function updateItem(productId: string, updates: Partial<ReceivingItem>) {
    setItems(items.map(i => i.product.id === productId ? { ...i, ...updates } : i))
  }

  function removeItem(productId: string) {
    setItems(items.filter(i => i.product.id !== productId))
  }

  async function handleReceive() {
    if (items.length === 0) {
      toast.error('Add products to receive')
      return
    }
    if (items.some(i => i.quantity <= 0)) {
      toast.error('Quantities must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      // Loop over items and create inventory logs (which will trigger product stock update via Prisma trigger or we do it here)
      // Actually /api/inventory-log POST does it per item. We can just loop.
      for (const item of items) {
        const res = await fetch('/api/inventory-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.product.id,
            type: 'receiving',
            quantity: item.quantity,
            note: note || 'Bulk receive',
            staffName: 'Staff',
            poNumber: poNumber || undefined,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.quantity
          })
        })
        if (!res.ok) throw new Error('Failed to log receiving')
        
        // Also update the product's costPrice if it changed
        if (item.unitCost !== item.product.costPrice) {
          await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.product.id,
              costPrice: item.unitCost
            })
          })
        }
      }
      
      toast.success(`Successfully received ${items.length} items`)
      setItems([])
      setPoNumber('')
      setNote('')
      refreshProducts()
      refreshInventoryLog()
    } catch {
      toast.error('Error during receiving')
    } finally {
      setSubmitting(false)
    }
  }

  const batchTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
            Receiving
          </h1>
          <p className="text-sm text-zinc-500">Bulk add stock from supplier</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase font-semibold">Batch Total</p>
            <p className="text-xl font-bold text-zinc-900 tabular-nums">
              ${batchTotal.toFixed(2)}
            </p>
          </div>
          <Button 
            onClick={handleReceive} 
            disabled={submitting || items.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? 'Processing...' : 'Receive Stock'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Search & Batch Info */}
        <div className="w-[320px] bg-white border-r flex flex-col shrink-0">
          <div className="p-4 space-y-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Batch Details
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">PO Number</Label>
                <Input 
                  placeholder="e.g. PO-2026-001" 
                  value={poNumber} 
                  onChange={e => setPoNumber(e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Note</Label>
                <Input 
                  placeholder="Optional notes" 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                />
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="space-y-1 mb-4">
              <Label className="text-xs">Find Product to Add</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search name, SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {products.length === 0 && search.trim().length > 1 ? (
                  <p className="text-xs text-center text-zinc-500 py-4">No products found</p>
                ) : (
                  products.map(p => (
                    <div key={p.id} className="p-2 border rounded-lg hover:border-emerald-300 transition-colors flex items-center justify-between bg-zinc-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.sku || 'No SKU'} · Stock: {p.stockCount}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleAdd(p)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main - Items List */}
        <div className="flex-1 p-6 overflow-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <PackagePlus className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-medium text-zinc-500">No items added to receiving batch</p>
              <p className="text-sm">Search and add products from the left panel.</p>
            </div>
          ) : (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b text-xs uppercase text-zinc-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-1/2">Product</th>
                    <th className="px-4 py-3 w-32">Qty to Add</th>
                    <th className="px-4 py-3 w-32">Unit Cost ($)</th>
                    <th className="px-4 py-3 w-32">Total Cost</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(item => (
                    <tr key={item.product.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{item.product.name}</p>
                        <p className="text-xs text-zinc-500">{item.product.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min="1" 
                          className="h-8 w-20 text-right"
                          value={item.quantity || ''} 
                          onChange={e => updateItem(item.product.id, { quantity: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          className="h-8 w-24 text-right"
                          value={item.unitCost || ''} 
                          onChange={e => updateItem(item.product.id, { unitCost: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900">
                        ${(item.quantity * item.unitCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
