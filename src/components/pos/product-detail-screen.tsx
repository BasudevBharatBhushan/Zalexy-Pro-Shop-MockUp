'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package, Plus, Pencil, SlidersHorizontal, Image as ImageIcon, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { AdjustmentDialog } from './adjustment-dialog'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function ProductDetailScreen() {
  const { detailProductId, setActiveScreen, productsVersion, inventoryLogVersion } = useAppStore()

  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', size: '', color: '', price: '', costPrice: '', stockCount: '' })
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<{ productId: string; productName: string; variantId?: string; variantName?: string } | null>(null)

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product-detail', detailProductId, productsVersion],
    queryFn: async () => {
      if (!detailProductId) return null
      // We can fetch from the products API with searchParams id, or create a specific /api/products/[id]
      const res = await fetch(`/api/products?search=${detailProductId}`) // Wait, search might not return exact match. Let's just fetch all and find, or we can use the existing API properly.
      // Wait, actually our API doesn't support fetching by ID directly except returning a list. Let's fetch all and find, it's a small dataset anyway, or we can add ID to the search params in the API. 
      // Let's assume we can fetch all and find.
      const productsRes = await fetch('/api/products')
      const products = await productsRes.json()
      return products.find((p: any) => p.id === detailProductId) || null
    },
    enabled: !!detailProductId,
  })

  // Fetch inventory logs for this product
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['product-inventory-logs', detailProductId, inventoryLogVersion],
    queryFn: async () => {
      if (!detailProductId) return []
      const res = await fetch(`/api/inventory-log?productId=${detailProductId}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    enabled: !!detailProductId,
  })

  const queryClient = useQueryClient()
  async function handleAddVariant() {
    if (!variantForm.name) {
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: detailProductId,
          ...variantForm,
          price: variantForm.price ? parseFloat(variantForm.price) : undefined,
          costPrice: variantForm.costPrice ? parseFloat(variantForm.costPrice) : undefined,
          stockCount: parseInt(variantForm.stockCount) || 0
        })
      })
      if (res.ok) {
        setVariantDialogOpen(false)
        setVariantForm({ name: '', sku: '', size: '', color: '', price: '', costPrice: '', stockCount: '' })
        setSkuManuallyEdited(false)
        queryClient.invalidateQueries({ queryKey: ['product-detail'] })
      }
    } catch(e) {}
    finally { setSubmitting(false) }
  }

  if (!detailProductId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Package className="h-12 w-12 text-zinc-300 mb-4" />
        <p className="text-zinc-500">No product selected</p>
        <Button className="mt-4" onClick={() => setActiveScreen('inventory')}>
          Back to Inventory
        </Button>
      </div>
    )
  }

  if (productLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Package className="h-12 w-12 text-zinc-300 mb-4" />
        <p className="text-zinc-500">Product not found</p>
        <Button className="mt-4" onClick={() => setActiveScreen('inventory')}>
          Back to Inventory
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveScreen('inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{product.name}</h1>
            <p className="text-sm text-zinc-500">SKU: {product.sku || 'N/A'} • {product.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Product
          </Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              setAdjustTarget({ productId: product.id, productName: product.name })
              setAdjustmentOpen(true)
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Adjust Stock
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-50 rounded-xl p-8 border border-zinc-100 flex flex-col items-center justify-center min-h-[300px]">
              {product.image ? (
                <img src={product.image} alt={product.name} className="max-w-full max-h-64 object-contain" />
              ) : (
                <>
                  <ImageIcon className="h-16 w-16 text-zinc-300 mb-4" />
                  <p className="text-zinc-500">No images available</p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" /> Add Image
                  </Button>
                </>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 p-4 rounded-lg border">
                  <p className="text-xs text-zinc-500 mb-1">Standard Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
                  {product.costPrice > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Margin: {Math.round(((product.price - product.costPrice) / product.price) * 100)}%
                    </p>
                  )}
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">Member Price</p>
                  <p className="text-lg font-semibold text-emerald-700">
                    {product.memberPrice ? formatCurrency(product.memberPrice) : '—'}
                  </p>
                  {product.memberPrice && product.costPrice > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Margin: {Math.round(((product.memberPrice - product.costPrice) / product.memberPrice) * 100)}%
                    </p>
                  )}
                </div>
                <div className="bg-zinc-50 p-4 rounded-lg border">
                  <p className="text-xs text-zinc-500 mb-1">Cost Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(product.costPrice)}</p>
                  {product.costPrice > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Markup: {Math.round(((product.price - product.costPrice) / product.costPrice) * 100)}%
                    </p>
                  )}
                </div>
                <div className="bg-zinc-50 p-4 rounded-lg border">
                  <p className="text-xs text-zinc-500 mb-1">Barcode</p>
                  <p className="text-sm font-medium">{product.barcode || '—'}</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-lg border">
                  <p className="text-xs text-zinc-500 mb-1">Unit Type</p>
                  <p className="text-sm font-medium">{product.unitType}</p>
                </div>
              </div>
            </div>
            {/* Variants Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5" /> Product Variants</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setVariantDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Variant
                </Button>
              </div>
              
              {product.variants && product.variants.length > 0 ? (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 border-b text-xs uppercase text-zinc-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Size / Color</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Cost</th>
                        <th className="px-4 py-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {product.variants.map((v: any) => (
                        <tr key={v.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{v.name}</td>
                          <td className="px-4 py-3 text-zinc-500">{v.sku || '—'}</td>
                          <td className="px-4 py-3 text-zinc-500">{v.size || '—'} / {v.color || '—'}</td>
                          <td className="px-4 py-3">{v.price ? formatCurrency(v.price) : 'Default'}</td>
                          <td className="px-4 py-3">{v.costPrice ? formatCurrency(v.costPrice) : 'Default'}</td>
                          <td className="px-4 py-3 font-semibold">{v.stockCount}</td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => {
                                setAdjustTarget({ 
                                  productId: product.id, 
                                  productName: product.name,
                                  variantId: v.id,
                                  variantName: v.name
                                })
                                setAdjustmentOpen(true)
                              }}
                            >
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm p-4 border rounded-xl bg-zinc-50 text-center">
                  No variants added yet. Add variants for different sizes or colors.
                </div>
              )}
            </div>
            {product.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-zinc-600 text-sm">{product.description}</p>
              </div>
            )}
          </div>

          {/* Right Column: Inventory & Logs */}
          <div className="space-y-6">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-zinc-50">
                <h3 className="font-semibold text-zinc-900">Current Inventory</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">In Stock</span>
                  <span className={`text-2xl font-bold ${product.stockCount === 0 ? 'text-red-600' : product.stockCount <= product.reorderPoint ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {product.stockCount} <span className="text-sm font-normal text-zinc-500">{product.unitType}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Reorder Point</span>
                  <span className="font-medium">{product.reorderPoint}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge variant={product.inStock && product.stockCount > 0 ? 'default' : 'destructive'}>
                    {product.inStock && product.stockCount > 0 ? 'Active' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="p-4 border-b bg-zinc-50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-zinc-900">Recent Activity</h3>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setActiveScreen('inventory-logs')}>
                  View All
                </Button>
              </div>
              <div className="p-0 overflow-y-auto flex-1">
                {logsLoading ? (
                  <div className="p-4 text-sm text-zinc-500">Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-500 text-center py-8">No activity yet</div>
                ) : (
                  <div className="divide-y">
                    {logs.map((log: any) => (
                      <div key={log.id} className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{log.type}</span>
                          <span className={log.quantity > 0 ? 'text-emerald-600 font-medium' : 'text-zinc-600'}>
                            {log.quantity > 0 ? '+' : ''}{log.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                          {log.staffName && <span>{log.staffName}</span>}
                        </div>
                        {log.note && <p className="text-xs text-zinc-600 mt-1 truncate">{log.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Variant Name</Label>
              <Input placeholder="e.g. Large / Red" value={variantForm.name} onChange={e => setVariantForm({...variantForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Input placeholder="e.g. L" value={variantForm.size} onChange={e => {
                  const newSize = e.target.value
                  const newSku = !skuManuallyEdited ? `${product?.sku || ''}-${newSize}-${variantForm.color}`.replace(/^-|-$/g, '').toUpperCase() : variantForm.sku
                  setVariantForm({...variantForm, size: newSize, sku: newSku})
                }} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input placeholder="e.g. Red" value={variantForm.color} onChange={e => {
                  const newColor = e.target.value
                  const newSku = !skuManuallyEdited ? `${product?.sku || ''}-${variantForm.size}-${newColor}`.replace(/^-|-$/g, '').toUpperCase() : variantForm.sku
                  setVariantForm({...variantForm, color: newColor, sku: newSku})
                }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU Override</Label>
                <Input value={variantForm.sku} onChange={e => {
                  setSkuManuallyEdited(true)
                  setVariantForm({...variantForm, sku: e.target.value})
                }} />
              </div>
              <div className="space-y-2">
                <Label>Initial Stock</Label>
                <Input type="number" placeholder="0" value={variantForm.stockCount} onChange={e => setVariantForm({...variantForm, stockCount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Override</Label>
                <Input type="number" placeholder="Leave empty for default" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price Override</Label>
                <Input type="number" placeholder="Leave empty for default" value={variantForm.costPrice} onChange={e => setVariantForm({...variantForm, costPrice: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVariant} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Saving...' : 'Add Variant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Adjustment Dialog */}
      {adjustTarget && (
        <AdjustmentDialog
          open={adjustmentOpen}
          onOpenChange={setAdjustmentOpen}
          productId={adjustTarget.productId}
          productName={adjustTarget.productName}
          variantId={adjustTarget.variantId}
          variantName={adjustTarget.variantName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['product-detail'] })
            queryClient.invalidateQueries({ queryKey: ['product-inventory-logs'] })
          }}
        />
      )}
    </div>
  )
}
