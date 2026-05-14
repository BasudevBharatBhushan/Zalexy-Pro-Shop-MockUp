'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  UserCircle,
  UserPlus,
  Footprints,
  X,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { useAppStore, type CustomerInfo, type CartItem } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Switch } from '@/components/ui/switch'

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
  sku: string | null
  barcode: string | null
  memberPrice: number | null
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  isMember: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Bowling', 'Beverages', 'Food', 'Arcade', 'Packages']

const CATEGORY_COLORS: Record<string, string> = {
  Bowling: 'bg-orange-50 text-orange-700 border-orange-200',
  Beverages: 'bg-sky-50 text-sky-700 border-sky-200',
  Food: 'bg-amber-50 text-amber-700 border-amber-200',
  Arcade: 'bg-purple-50 text-purple-700 border-purple-200',
  Packages: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  General: 'bg-zinc-100 text-zinc-700 border-zinc-200',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ── Customer Selector Component ────────────────────────────────────────────

function CustomerSelector({
  customer,
  onSetWalkin,
  onSelectCustomer,
  onNewCustomer,
}: {
  customer: CustomerInfo | null
  onSetWalkin: () => void
  onSelectCustomer: (c: CustomerInfo) => void
  onNewCustomer: () => void
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/customers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch customers')
      return res.json() as Promise<Customer[]>
    },
  })

  const displayName = customer ? customer.name : 'Walk-in'

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-8 text-xs gap-1.5 px-2 ${
              customer
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'text-zinc-500'
            }`}
          >
            <UserCircle className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{displayName}</span>
            {customer?.phone && (
              <span className="hidden sm:inline text-zinc-400 ml-1">{customer.phone}</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Command className="border-0">
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {/* Walk-in option */}
                <CommandItem
                  onSelect={() => {
                    onSetWalkin()
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Footprints className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium">Walk-in</p>
                    <p className="text-xs text-zinc-400">No customer assigned</p>
                  </div>
                  {!customer && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">Current</Badge>
                  )}
                </CommandItem>

                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => {
                      onSelectCustomer({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        isMember: c.isMember,
                      })
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <UserCircle className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <div className="flex gap-2 text-xs text-zinc-400">
                        {c.email && <span className="truncate">{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </div>
                    {customer?.id === c.id && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">Current</Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                setOpen(false)
                onNewCustomer()
              }}
            >
              <UserPlus className="h-4 w-4" />
              New Customer
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── New Customer Dialog ────────────────────────────────────────────────────

function NewCustomerDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (customer: CustomerInfo) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isMember, setIsMember] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Customer name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          isMember,
        }),
      })
      if (!res.ok) throw new Error('Failed to create customer')
      const customer = await res.json()
      onSave({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isMember: customer.isMember,
      })
      toast.success('Customer created')
      setName('')
      setEmail('')
      setPhone('')
      setIsMember(false)
      onOpenChange(false)
    } catch {
      toast.error('Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new customer to the system.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cust-name">Name *</Label>
            <Input
              id="cust-name"
              placeholder="Customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cust-email">Email</Label>
            <Input
              id="cust-email"
              type="email"
              placeholder="customer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cust-phone">Phone</Label>
            <Input
              id="cust-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch id="cust-member" checked={isMember} onCheckedChange={setIsMember} />
            <Label htmlFor="cust-member" className="cursor-pointer">Is Club Member</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? 'Saving...' : 'Create Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main POS Component ─────────────────────────────────────────────────────

export function PosScreen() {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    loadCartFromOrder,
    productsVersion,
    activeOrderId,
    setActiveOrderId,
    activeCustomer,
    setActiveCustomer,
    refreshOrders,
    refreshProducts,
    activeSession,
    setActiveScreen,
  } = useAppStore()
  const queryClient = useQueryClient()

  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [charging, setCharging] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [orderLocation, setOrderLocation] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'open-tab'>('card')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [paymentStep, setPaymentStep] = useState<'method' | 'tip' | 'receipt'>('method')
  const [tipPercentage, setTipPercentage] = useState<number>(0)
  const [customTip, setCustomTip] = useState<number | null>(null)
  const [tipPresets, setTipPresets] = useState<number[]>([15, 18, 20])
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [sendReceipt, setSendReceipt] = useState<boolean>(true)


  // ── Fetch products ──
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.tipPresets) setTipPresets(JSON.parse(data.tipPresets))
        }
      } catch (e) {}
      return null
    }
  })
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-pos', categoryFilter, search, productsVersion],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter !== 'All') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json() as Promise<Product[]>
    },
  })

  // ── Cart totals ──
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountValue = discountType === 'percentage' ? (cartSubtotal * discountAmount) / 100 : discountAmount
  const subtotal = Math.max(0, cartSubtotal - discountValue)
  const tax = subtotal * 0.08
  const tipValue = customTip !== null ? customTip : (subtotal * tipPercentage) / 100
  const total = subtotal + tax + tipValue
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  // ── Reset to new order ──
  const resetToNewOrder = useCallback(() => {
    clearCart()
    setActiveOrderId(null)
    setActiveCustomer(null)
    setOrderNote('')
    setOrderLocation('')
    setDiscountAmount(0)
    setTipPercentage(0)
    setCustomTip(null)
    setCustomerEmail('')
    setPaymentStep('method')
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }, [clearCart, setActiveOrderId, setActiveCustomer, queryClient])

  // ── New order handler ──
  function handleNewOrder() {
    if (cart.length > 0) {
      // If cart has items, confirm before discarding
      if (!confirm('Start a new order? Current cart items will be discarded.')) {
        return
      }
    }
    resetToNewOrder()
    toast.success('New order started')
  }

  // ── Charge handler ──
  async function handleCharge() {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    setPaymentDialogOpen(true)
  }

  async function confirmCharge() {
    setCharging(true)
    try {
      const items = cart.map((c) => ({
        productId: c.id,
        quantity: c.quantity,
        price: c.price,
        subtotal: c.price * c.quantity,
      }))

      const body: Record<string, unknown> = {
        tabType: activeCustomer ? (paymentMethod === 'open-tab' ? 'open-tab' : 'walk-in') : 'walk-in',
        customerName: activeCustomer?.name || null,
        customerId: activeCustomer?.id || null,
        location: orderLocation || null,
        notes: orderNote || null,
        paymentMethod: paymentMethod === 'open-tab' ? 'card' : paymentMethod,
        discount: discountValue,
        discountType,
        tip: tipValue,
        items,
        sendReceipt: sendReceipt && customerEmail ? true : false,
        customerEmail: customerEmail || undefined,
      }

      if (activeOrderId) {
        body.id = activeOrderId
      }

      const res = await fetch('/api/orders', {
        method: activeOrderId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to process order')

      toast.success(`Order ${activeOrderId ? 'updated' : 'created'} — ${formatCurrency(total)}`)
      
      if (sendReceipt && customerEmail) {
        toast.success(`Receipt sent to ${customerEmail}`)
      }
      
      setPaymentDialogOpen(false)

      // Reset for new order
      resetToNewOrder()
      refreshOrders()
      refreshProducts()
    } catch {
      toast.error('Failed to process order')
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden relative">

      {/* ── No Session Banner ── */}
      {!activeSession && (
        <div className="absolute top-0 left-0 right-0 z-40 bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md">
          <span className="flex items-center gap-2 font-medium">
            <span>🔒</span>
            Register is closed — you can browse but cannot process transactions until the register is opened.
          </span>
          <button
            onClick={() => setActiveScreen('register-open')}
            className="bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg font-semibold text-xs whitespace-nowrap"
          >
            Open Register →
          </button>
        </div>
      )}

      {/* ── Product Grid (Left) ── */}
      <div className={`flex-1 flex flex-col overflow-hidden border-r ${!activeSession ? 'pt-10' : ''}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900">Point of Sale</h1>
              {activeOrderId && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Existing Order
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Customer Selector */}
              <CustomerSelector
                customer={activeCustomer}
                onSetWalkin={() => setActiveCustomer(null)}
                onSelectCustomer={setActiveCustomer}
                onNewCustomer={() => setNewCustomerOpen(true)}
              />
              {/* New Order Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewOrder}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                New Order
              </Button>
            </div>
          </div>

          {/* Location / Lane input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Lane / Location"
              value={orderLocation}
              onChange={(e) => setOrderLocation(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-8 w-16 mt-2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => {
                  const hasMemberPrice = activeCustomer?.isMember && product.memberPrice != null && product.memberPrice > 0
                  const displayPrice = hasMemberPrice ? product.memberPrice! : product.price
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {product.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 mt-1 ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.General}`}
                          >
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-zinc-900">
                            {formatCurrency(displayPrice)}
                          </span>
                          {hasMemberPrice && (
                            <span className="text-[10px] text-emerald-600 line-through opacity-70">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: displayPrice,
                              quantity: 1,
                              category: product.category,
                            })
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Cart (Right) ── */}
      <div className="w-full sm:w-[380px] shrink-0 flex flex-col bg-white">
        {/* Cart Header */}
        <div className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {itemCount}
                </Badge>
              )}
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-zinc-400 hover:text-red-500">
                Clear
              </Button>
            )}
          </div>

          {/* Active customer display */}
          {activeCustomer && (
            <div className="mt-2 flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
              <UserCircle className="h-4 w-4 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-emerald-800 truncate">{activeCustomer.name}</p>
                  {activeCustomer.isMember && (
                    <Badge variant="default" className="text-[9px] h-4 px-1 py-0 bg-emerald-600">Member</Badge>
                  )}
                </div>
                {(activeCustomer.email || activeCustomer.phone) && (
                  <p className="text-[10px] text-emerald-600 truncate">
                    {[activeCustomer.email, activeCustomer.phone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveCustomer(null)}
                className="text-emerald-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {!activeCustomer && (
            <div className="mt-2 flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-100">
              <Footprints className="h-4 w-4 text-zinc-400" />
              <p className="text-xs text-zinc-400">Walk-in — no customer</p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Cart is empty</p>
                <p className="text-xs text-zinc-300 mt-1">Add products from the left</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-zinc-50"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Line total + remove */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-zinc-900 tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Order Note */}
        <div className="px-4">
          <Input
            placeholder="Add order note..."
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Cart Totals + Charge */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-900 tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </div>
              
              {/* Discount Section */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-500">Discount</span>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={discountAmount || ''} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-16 h-6 text-xs text-right px-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 px-1.5 text-xs"
                      onClick={() => setDiscountType(t => t === 'percentage' ? 'fixed' : 'percentage')}
                    >
                      {discountType === 'percentage' ? '%' : '$'}
                    </Button>
                  </div>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Applied Discount</span>
                    <span className="tabular-nums">-{formatCurrency(discountValue)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tax (8%)</span>
                <span className="text-zinc-900 tabular-nums">{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-bold text-zinc-900">Total</span>
                <span className="font-bold text-zinc-900 tabular-nums">{formatCurrency(subtotal + tax)}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!activeSession) {
                  setActiveScreen('register-open')
                  return
                }
                setPaymentStep('method')
                setPaymentDialogOpen(true)
              }}
              className={`w-full h-11 text-base font-semibold ${!activeSession ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
            >
              <CreditCard className="h-5 w-5" />
              {activeSession ? `Charge ${formatCurrency(total)}` : '🔒 Open Register to Charge'}
            </Button>
          </div>
        )}
      </div>

      {/* ── New Customer Dialog ── */}
      <NewCustomerDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onSave={setActiveCustomer}
      />

      {/* ── Payment Confirmation Dialog ── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'method' && 'Payment Method'}
              {paymentStep === 'tip' && 'Add Tip'}
              {paymentStep === 'receipt' && 'Receipt & Complete'}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === 'method' && (activeOrderId ? 'Update and close this order?' : 'Complete this order?')}
              {paymentStep === 'tip' && 'Select a tip amount or enter a custom tip.'}
              {paymentStep === 'receipt' && 'Would you like a receipt?'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {paymentStep === 'method' && (
              <>
                {/* Customer info */}
                <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {activeCustomer?.name || 'Walk-in'}
                  </p>
                  {orderLocation && (
                    <p className="text-xs text-zinc-500">{orderLocation}</p>
                  )}
                  {(activeCustomer?.email || activeCustomer?.phone) && (
                    <p className="text-xs text-zinc-400">
                      {[activeCustomer?.email, activeCustomer?.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Order summary */}
                <div className="space-y-1 text-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-zinc-600">{item.quantity}× {item.name}</span>
                      <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {discountValue > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  <Separator className="my-1.5" />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(subtotal + tax)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className={paymentMethod === 'card' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className={paymentMethod === 'cash' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <span className="mr-2">$</span>
                      Cash
                    </Button>
                  </div>
                  {activeCustomer && (
                    <Button
                      type="button"
                      variant={paymentMethod === 'open-tab' ? 'default' : 'outline'}
                      className={`w-full mt-2 ${paymentMethod === 'open-tab' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                      onClick={() => setPaymentMethod('open-tab')}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Save Card & Open Tab
                    </Button>
                  )}
                </div>
              </>
            )}

            {paymentStep === 'tip' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {tipPresets.map(preset => (
                    <Button
                      key={preset}
                      variant={tipPercentage === preset && customTip === null ? 'default' : 'outline'}
                      onClick={() => { setTipPercentage(preset); setCustomTip(null); }}
                      className={tipPercentage === preset && customTip === null ? 'bg-emerald-600' : ''}
                    >
                      {preset}%<br/>
                      <span className="text-xs opacity-70 block mt-1">{formatCurrency((subtotal * preset) / 100)}</span>
                    </Button>
                  ))}
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label>Custom Tip ($)</Label>
                  <Input 
                    type="number" 
                    value={customTip || ''} 
                    onChange={e => {
                      setCustomTip(Number(e.target.value))
                      setTipPercentage(0)
                    }} 
                    placeholder="Enter custom amount" 
                  />
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-zinc-500"
                  onClick={() => { setTipPercentage(0); setCustomTip(0); }}
                >
                  No Tip
                </Button>
                
                <div className="bg-emerald-50 rounded-lg p-3 mt-4">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>New Total</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === 'receipt' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pt-2">
                  <Switch id="send-receipt" checked={sendReceipt} onCheckedChange={setSendReceipt} />
                  <Label htmlFor="send-receipt" className="cursor-pointer">Email Receipt</Label>
                </div>
                
                {sendReceipt && (
                  <div className="space-y-2">
                    <Label>Customer Email</Label>
                    <Input 
                      type="email" 
                      placeholder="customer@email.com" 
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                    {!customerEmail && activeCustomer?.email && (
                      <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setCustomerEmail(activeCustomer.email || '')}>
                        Use {activeCustomer.email}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            {paymentStep === 'method' ? (
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            ) : (
              <Button variant="outline" onClick={() => setPaymentStep(paymentStep === 'tip' ? 'method' : 'tip')}>Back</Button>
            )}
            
            {paymentStep === 'method' && (
              <Button onClick={() => paymentMethod === 'open-tab' ? confirmCharge() : setPaymentStep('tip')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {paymentMethod === 'open-tab' ? 'Start Tab' : 'Continue to Tip'}
              </Button>
            )}
            
            {paymentStep === 'tip' && (
              <Button onClick={() => setPaymentStep('receipt')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Continue to Receipt
              </Button>
            )}

            {paymentStep === 'receipt' && (
              <Button onClick={confirmCharge} disabled={charging} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {charging ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
