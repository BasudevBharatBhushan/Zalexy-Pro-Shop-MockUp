'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  History,
  ArrowUpDown,
  RotateCcw,
  Layers,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { TimeAgo } from './time-ago'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
  inStock: boolean
  stockCount: number
  reorderPoint: number
  sku: string | null
  barcode: string | null
  unitType: string
  costPrice: number
  variants?: any[]
  isVariant?: boolean
  parentId?: string
  parentName?: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  category: string
  sku: string
  barcode: string
  inStock: boolean
  stockCount: string
  reorderPoint: string
  unitType: string
  costPrice: string
  memberPrice: string
}

interface InventoryLog {
  id: string
  productId: string
  type: string
  quantity: number
  note: string | null
  staffName: string | null
  createdAt: string
  product: { id: string; name: string; sku: string | null }
}

interface AdjustmentFormData {
  productId: string
  productName: string
  type: string
  quantity: string
  note: string
  poNumber: string
  unitCost: string
  totalCost: string
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category: 'General',
  sku: '',
  barcode: '',
  inStock: true,
  stockCount: '0',
  reorderPoint: '10',
  unitType: 'pcs',
  costPrice: '0',
  memberPrice: '',
}

const EMPTY_ADJUSTMENT: AdjustmentFormData = {
  productId: '',
  productName: '',
  type: 'restock',
  quantity: '',
  note: '',
  poNumber: '',
  unitCost: '',
  totalCost: '',
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ['Bowling', 'Beverages', 'Food', 'Arcade', 'Packages', 'General']

type StockFilterKey = 'all' | 'active' | 'inactive' | 'in-stock' | 'out-of-stock' | 'reorder'

const STOCK_FILTERS: { key: StockFilterKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Items', icon: <Package className="h-3.5 w-3.5" /> },
  { key: 'active', label: 'Active', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: 'inactive', label: 'Inactive', icon: <XCircle className="h-3.5 w-3.5" /> },
  { key: 'in-stock', label: 'In Stock', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: 'out-of-stock', label: 'Out of Stock', icon: <XCircle className="h-3.5 w-3.5" /> },
  { key: 'reorder', label: 'Reorder', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
]

const LOG_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  initial: { label: 'Initial', color: 'text-zinc-600', bg: 'bg-zinc-100' },
  restock: { label: 'Restock', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  sale: { label: 'Sale', color: 'text-orange-700', bg: 'bg-orange-50' },
  adjustment: { label: 'Adjustment', color: 'text-amber-700', bg: 'bg-amber-50' },
  void: { label: 'Void', color: 'text-red-700', bg: 'bg-red-50' },
  return: { label: 'Return', color: 'text-sky-700', bg: 'bg-sky-50' },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getStockStatus(inStock: boolean, stockCount: number, reorderPoint: number): {
  label: string
  className: string
} {
  if (!inStock || stockCount === 0) {
    return { label: 'Out of Stock', className: 'bg-red-50 text-red-700 border-red-200' }
  }
  if (stockCount <= reorderPoint) {
    return { label: 'Reorder', className: 'bg-orange-50 text-orange-700 border-orange-200' }
  }
  return { label: 'In Stock', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

// ── Component ──────────────────────────────────────────────────────────────

export function InventoryScreen() {
  const { productsVersion, refreshProducts, inventoryLogVersion, refreshInventoryLog, setActiveScreen, setDetailProductId } = useAppStore()

  // State
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState<StockFilterKey>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  const [logProductId, setLogProductId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormData>(EMPTY_ADJUSTMENT)
  const [submitting, setSubmitting] = useState(false)
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)

  // ── Fetch products ──
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-inventory', categoryFilter, search, productsVersion],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter !== 'All') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json() as Promise<Product[]>
    },
  })

  // Filter and flatten products
  const flatItems = useMemo(() => {
    return products.flatMap(p => {
      const items: Product[] = []
      items.push(p)

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          items.push({
            ...p,
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price ?? p.price,
            costPrice: v.costPrice ?? p.costPrice,
            stockCount: v.stockCount,
            isVariant: true,
            parentId: p.id,
            parentName: p.name,
          })
        })
      }
      return items
    })
  }, [products])

  // ── Fetch inventory logs ──
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['inventory-logs', logProductId, inventoryLogVersion],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' })
      if (logProductId) params.set('productId', logProductId)
      const res = await fetch(`/api/inventory-log?${params}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json() as Promise<InventoryLog[]>
    },
  })

  // ── Filter products ──
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      switch (stockFilter) {
        case 'active': return p.inStock
        case 'inactive': return !p.inStock
        case 'in-stock': return p.inStock && p.stockCount > 0
        case 'out-of-stock': return !p.inStock || p.stockCount === 0
        case 'reorder': return p.inStock && p.stockCount > 0 && p.stockCount <= p.reorderPoint
        default: return true
      }
    })
  }, [products, stockFilter])

  // ── Quick stats ──
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => p.inStock).length
    const inactive = products.filter((p) => !p.inStock).length
    const outOfStock = products.filter((p) => !p.inStock || p.stockCount === 0).length
    const reorder = products.filter((p) => p.inStock && p.stockCount > 0 && p.stockCount <= p.reorderPoint).length
    return { total, active, inactive, outOfStock, reorder }
  }, [products])

  // ── Form helpers ──
  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      sku: product.sku || '',
      barcode: product.barcode || '',
      inStock: product.inStock,
      stockCount: String(product.stockCount),
      reorderPoint: String(product.reorderPoint),
      unitType: (product as any).unitType || 'pcs',
      costPrice: String((product as any).costPrice || 0),
      memberPrice: (product as any).memberPrice ? String((product as any).memberPrice) : '',
    })
    setDialogOpen(true)
  }

  function openAdjustment(product: Product) {
    setAdjustmentForm({
      productId: product?.id || '',
      productName: product?.name || '',
      type: 'restock',
      quantity: '',
      note: '',
      poNumber: '',
      unitCost: '',
      totalCost: '',
    })
    setAdjustmentOpen(true)
  }

  function handleProductClick(product: Product) {
    setDetailProductId(product.id)
    setActiveScreen('product-detail')
  }

  function openLogSheet(productId?: string) {
    setLogProductId(productId || null)
    setLogSheetOpen(true)
  }

  // ── Submit handlers ──
  async function handleSubmit() {
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }
    setSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category,
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        inStock: form.inStock,
        stockCount: parseInt(form.stockCount) || 0,
        reorderPoint: parseInt(form.reorderPoint) || 10,
        unitType: form.unitType,
        costPrice: parseFloat(form.costPrice) || 0,
        memberPrice: form.memberPrice ? parseFloat(form.memberPrice) : undefined,
      }
      if (editingId) body.id = editingId

      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(editingId ? 'Product updated' : 'Product created')
      setDialogOpen(false)
      refreshProducts()
      refreshInventoryLog()
    } catch {
      toast.error('Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdjustment() {
    const qty = parseInt(adjustmentForm.quantity)
    if (isNaN(qty) || qty === 0) {
      toast.error('Enter a valid quantity (positive to add, negative to remove)')
      return
    }
    
    if (!adjustmentForm.note.trim()) {
      toast.error('Notes are required for adjustments')
      return
    }

    // For sale/restock type, auto-determine sign based on type
    let finalQty = qty
    if (adjustmentForm.type === 'restock' || adjustmentForm.type === 'return') {
      finalQty = Math.abs(qty)
    } else if (adjustmentForm.type === 'sale' || adjustmentForm.type === 'void') {
      finalQty = -Math.abs(qty)
    }

    setAdjustSubmitting(true)
    try {
      const res = await fetch('/api/inventory-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustmentForm.productId,
          type: adjustmentForm.type,
          quantity: finalQty,
          note: adjustmentForm.note.trim() || undefined,
          staffName: 'Sarah M.',
          poNumber: adjustmentForm.poNumber.trim() || undefined,
          unitCost: adjustmentForm.unitCost ? parseFloat(adjustmentForm.unitCost) : undefined,
          totalCost: adjustmentForm.totalCost ? parseFloat(adjustmentForm.totalCost) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(
        `Stock adjusted: ${result.previousStock} → ${result.newStock} (${finalQty > 0 ? '+' : ''}${finalQty})`
      )
      setAdjustmentOpen(false)
      refreshProducts()
      refreshInventoryLog()
    } catch {
      toast.error('Failed to adjust stock')
    } finally {
      setAdjustSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This will also remove all inventory logs for this product.')) return
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Product deleted')
      refreshProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-4 border-b bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Product Inventory</h1>
            <p className="text-sm text-zinc-500">
              {isLoading ? '...' : `${products.length} product${products.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveScreen('inventory-logs')}
              className="gap-1.5"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Log</span>
            </Button>
            <Button variant="outline" onClick={() => openAdjustment({} as Product)} className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Make Adjustment
            </Button>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search + Category */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STOCK_FILTERS.map((f) => {
            const count =
              f.key === 'all' ? stats.total :
              f.key === 'active' ? stats.active :
              f.key === 'inactive' ? stats.inactive :
              f.key === 'in-stock' ? (stats.active - stats.reorder) :
              f.key === 'out-of-stock' ? stats.outOfStock :
              stats.reorder

            return (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  stockFilter === f.key
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                {f.icon}
                {f.label}
                <span className={`ml-0.5 text-[10px] rounded-full px-1.5 py-0.5 ${
                  stockFilter === f.key
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Reorder alert banner */}
        {stats.reorder > 0 && stockFilter !== 'reorder' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>{stats.reorder} item{stats.reorder !== 1 ? 's' : ''}</strong> below reorder point
            </span>
            <button
              onClick={() => setStockFilter('reorder')}
              className="ml-auto text-xs font-medium underline hover:text-orange-900"
            >
              View all
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {stockFilter !== 'all' ? 'No products match the selected filter' : 'No products found'}
              </p>
              {stockFilter !== 'all' && (
                <Button variant="link" onClick={() => setStockFilter('all')} className="mt-2">
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Price</TableHead>
                    <TableHead className="font-semibold">Stock</TableHead>
                    <TableHead className="font-semibold">Reorder Pt.</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.inStock, product.stockCount, product.reorderPoint)
                    const needsReorder = product.inStock && product.stockCount > 0 && product.stockCount <= product.reorderPoint
                    const stockPercent = product.reorderPoint > 0
                      ? Math.min(100, Math.round((product.stockCount / product.reorderPoint) * 100))
                      : 100

                    return (
                      <TableRow
                        key={product.id}
                        className={`group ${needsReorder ? 'bg-orange-50/50' : ''}`}
                      >
                        <TableCell className="text-zinc-500 font-mono text-xs">
                          {product.sku || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button onClick={() => {
                                if (product.isVariant && product.parentId) {
                                  // detail screen will need to handle variant focusing
                                  // For now, open the parent, but we'll add variant focus support
                                  setDetailProductId(product.parentId)
                                } else {
                                  handleProductClick(product)
                                }
                              }} className="font-medium text-zinc-900 truncate hover:text-emerald-600 hover:underline text-left flex items-center gap-2">
                                {product.isVariant && <Layers className="h-3.5 w-3.5 text-zinc-400" />}
                                {product.name}
                              </button>
                              {needsReorder && (
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                              )}
                            </div>
                            {product.description && (
                              <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`font-semibold tabular-nums ${
                              product.stockCount === 0 ? 'text-red-600' :
                              needsReorder ? 'text-orange-600' :
                              'text-zinc-900'
                            }`}>
                              {product.stockCount}
                            </span>
                            {/* Mini stock bar */}
                            <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  stockPercent <= 50 ? 'bg-red-400' :
                                  stockPercent <= 100 ? 'bg-orange-400' :
                                  'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.max(2, stockPercent)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-zinc-500 text-sm">
                          {product.reorderPoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={stockStatus.className}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View log"
                              onClick={() => openLogSheet(product.id)}
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Adjust stock"
                              onClick={() => openAdjustment(product)}
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit product"
                              onClick={() => openEdit(product)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-red-500"
                              title="Delete product"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Add/Edit Product Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update product details below.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Name *</Label>
              <Input id="inv-name" placeholder="Product name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-desc">Description</Label>
              <Input id="inv-desc" placeholder="Brief description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-price">Standard Price *</Label>
                <Input id="inv-price" type="number" step="0.01" min="0" placeholder="0.00" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} />
                {parseFloat(form.price) > 0 && parseFloat(form.costPrice) > 0 && (
                  <p className="text-[10px] text-zinc-500">
                    Margin: {Math.round(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.price)) * 100)}%
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-sku">SKU</Label>
                <Input id="inv-sku" placeholder="e.g. LR-001" value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-barcode">Barcode</Label>
                <Input id="inv-barcode" placeholder="e.g. 1234567890" value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-cost">Cost Price</Label>
                <Input id="inv-cost" type="number" step="0.01" min="0" placeholder="0.00" value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-member">Member Price</Label>
                <Input id="inv-member" type="number" step="0.01" min="0" placeholder="Optional" value={form.memberPrice}
                  onChange={(e) => setForm({ ...form, memberPrice: e.target.value })} />
                {parseFloat(form.memberPrice) > 0 && parseFloat(form.costPrice) > 0 && (
                  <p className="text-[10px] text-zinc-500">
                    Margin: {Math.round(((parseFloat(form.memberPrice) - parseFloat(form.costPrice)) / parseFloat(form.memberPrice)) * 100)}%
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-unit">Unit Type</Label>
                <Select value={form.unitType} onValueChange={(v) => setForm({ ...form, unitType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="lbs">Lbs</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-stock">Stock Count</Label>
                <Input id="inv-stock" type="number" min="0" placeholder="0" value={form.stockCount}
                  onChange={(e) => setForm({ ...form, stockCount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-reorder">Reorder Point</Label>
                <Input id="inv-reorder" type="number" min="0" placeholder="10" value={form.reorderPoint}
                  onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch id="inv-instock" checked={form.inStock}
                  onCheckedChange={(checked) => setForm({ ...form, inStock: checked })} />
                <Label htmlFor="inv-instock" className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock Adjustment Dialog ── */}
      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {adjustmentForm.productId ? (
                <>Modify stock level for <strong>{adjustmentForm.productName}</strong></>
              ) : (
                'Select a product to modify its stock level'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!adjustmentForm.productId && (
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={adjustmentForm.productId} onValueChange={(v) => {
                  const p = flatItems.find(p => p.id === v)
                  if (p) {
                    if (p.isVariant) {
                       setAdjustmentForm(f => ({ ...f, productId: p.parentId!, productName: p.parentName!, variantId: p.id, variantName: p.name }))
                    } else {
                       setAdjustmentForm(f => ({ ...f, productId: p.id, productName: p.name, variantId: '', variantName: '' }))
                    }
                  }
                }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Search or select a product" /></SelectTrigger>
                  <SelectContent>
                    {flatItems.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.isVariant ? `↳ ${p.name}` : p.name} ({p.stockCount} {p.unitType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={adjustmentForm.type}
                  onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Restock</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-qty">Quantity</Label>
                <Input id="adj-qty" type="number" placeholder="e.g. 10" value={adjustmentForm.quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adj-po">PO Number</Label>
                <Input id="adj-po" placeholder="e.g. PO-1234" value={adjustmentForm.poNumber}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, poNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-unitcost">Unit Cost</Label>
                <Input id="adj-unitcost" type="number" step="0.01" placeholder="0.00" value={adjustmentForm.unitCost}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, unitCost: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-totalcost">Total Cost</Label>
                <Input id="adj-totalcost" type="number" step="0.01" placeholder="0.00" value={adjustmentForm.totalCost}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, totalCost: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-note">Note (optional)</Label>
              <Textarea id="adj-note" placeholder="Reason for adjustment..."
                value={adjustmentForm.note}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                rows={3} />
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 space-y-1">
              <p><strong>Restock / Return:</strong> Increases stock (enter positive amount)</p>
              <p><strong>Sale / Void:</strong> Decreases stock (enter positive amount)</p>
              <p><strong>Adjustment:</strong> Enter negative to decrease, positive to increase</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustment} disabled={adjustSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {adjustSubmitting ? 'Adjusting...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Activity Log Sheet ── */}
      <Sheet open={logSheetOpen} onOpenChange={setLogSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-2 shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Inventory Activity Log
            </SheetTitle>
            <SheetDescription>
              {logProductId
                ? 'Showing activity for selected product'
                : 'Showing all inventory activity'}
            </SheetDescription>
          </SheetHeader>

          {/* Log type filters */}
          <div className="px-6 py-2 flex flex-wrap gap-1.5 border-b shrink-0">
            {[
              { key: '', label: 'All' },
              { key: 'restock', label: 'Restock' },
              { key: 'sale', label: 'Sale' },
              { key: 'adjustment', label: 'Adjustment' },
              { key: 'void', label: 'Void' },
              { key: 'return', label: 'Return' },
            ].map((f) => {
              const isActive = (!logProductId && f.key === '' && !adjustmentForm) || false
              return (
                <button
                  key={f.key}
                  onClick={() => {
                    if (f.key === '') {
                      setLogProductId(null)
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    !logProductId && f.key === ''
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
            {logProductId && (
              <button
                onClick={() => setLogProductId(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900 text-white border-zinc-900"
              >
                <RotateCcw className="h-3 w-3" />
                Show All
              </button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-3">
              {logsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No activity recorded</p>
                </div>
              ) : (
                logs.map((log) => {
                  const config = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_CONFIG.adjustment
                  return (
                    <div key={log.id} className="flex items-start gap-3 group">
                      {/* Type badge */}
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                        <span className={`text-xs font-bold ${config.color}`}>
                          {log.quantity > 0 ? '+' : ''}{log.quantity}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.bg} ${config.color} border-transparent`}>
                            {config.label}
                          </Badge>
                          <span className="text-sm font-medium text-zinc-900 truncate">
                            {log.product.name}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs text-zinc-500 truncate">{log.note}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          {log.staffName && (
                            <span className="flex items-center gap-0.5">
                              <span className="font-medium">{log.staffName}</span>
                            </span>
                          )}
                          {log.product.sku && (
                            <span className="font-mono">{log.product.sku}</span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <TimeAgo date={log.createdAt} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
