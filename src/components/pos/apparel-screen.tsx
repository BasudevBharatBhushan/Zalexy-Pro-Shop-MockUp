'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Shirt, Layers } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function ApparelScreen() {
  const { productsVersion, refreshProducts, setActiveScreen, setDetailProductId } = useAppStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', costPrice: '', sku: '' })
  const [submitting, setSubmitting] = useState(false)

  // Fetch products that are "Apparel"
  const { data: apparel = [], isLoading } = useQuery({
    queryKey: ['products', 'Apparel', search, productsVersion],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('category', 'Apparel') // Or just use all products and filter locally if API doesn't support exact match
      // Wait, our API does support exact category filtering if we send category=Apparel!
      const res = await fetch(`/api/products?category=Apparel`)
      if (!res.ok) throw new Error('Failed to fetch apparel')
      return res.json()
    },
  })

  // Filtered apparel (client-side search)
  const filteredApparel = useMemo(() => {
    if (!search.trim()) return apparel
    const q = search.toLowerCase()
    return apparel.filter(
      (a: any) =>
        a.name.toLowerCase().includes(q) ||
        a.sku?.toLowerCase().includes(q)
    )
  }, [apparel, search])

  async function handleSubmit() {
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
          category: 'Apparel',
          unitType: 'pcs',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Apparel group created! You can now add size/color variants.')
      setDialogOpen(false)
      setForm({ name: '', description: '', price: '', costPrice: '', sku: '' })
      refreshProducts()
    } catch {
      toast.error('Failed to create apparel')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Apparel & Merchandise</h1>
            <p className="text-sm text-zinc-500">
              {isLoading ? '...' : `${filteredApparel.length} apparel group${filteredApparel.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4" />
            Add Apparel Group
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search apparel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : filteredApparel.length === 0 ? (
            <div className="text-center py-16">
              <Shirt className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No apparel items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApparel.map((item: any) => {
                const variantCount = item.variants?.length || 0;
                const totalStock = item.stockCount + (item.variants?.reduce((acc: number, v: any) => acc + v.stockCount, 0) || 0)

                return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border p-4 space-y-3 hover:shadow-sm transition-shadow cursor-pointer hover:border-emerald-200 group"
                  onClick={() => {
                    setDetailProductId(item.id)
                    setActiveScreen('product-detail')
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{item.sku || 'No SKU'} • {formatCurrency(item.price)}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Apparel
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                      <Layers className="h-4 w-4 text-emerald-600" />
                      {variantCount} Variants
                    </div>
                    <div className="text-sm font-medium text-zinc-700">
                      Total Stock: <span className={totalStock > 0 ? "text-emerald-600" : "text-red-500"}>{totalStock}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Apparel Group</DialogTitle>
            <DialogDescription>Create a base product. You can add color/size variants afterwards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Apparel Name *</Label>
              <Input placeholder="e.g. Premium Logo Tee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Base Cost Price</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base SKU</Label>
              <Input placeholder="e.g. TEE-01" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Creating...' : 'Create Apparel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
