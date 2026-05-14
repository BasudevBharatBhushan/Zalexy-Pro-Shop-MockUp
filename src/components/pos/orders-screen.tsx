'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Beer,
  CirclePause,
  CircleCheck,
  Ban,
  CircleX,
  Users,
  UserCheck,
  UserX,
  Briefcase,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { useAppStore, type CartItem } from '@/store/app-store'
import { TimeAgo } from './time-ago'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  subtotal: number
  product: {
    id: string
    name: string
    price: number
    category: string
  }
}

interface Order {
  id: string
  orderNumber: number
  status: string
  tabType: string
  customerName: string | null
  location: string | null
  total: number
  balance: number
  paid: number
  notes: string | null
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
  customer?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
}

// ── Constants ──────────────────────────────────────────────────────────────

type StatusKey = 'all' | 'open' | 'hold' | 'closed' | 'void' | 'cancelled'
type CategoryKey = 'all' | 'member' | 'non-member' | 'staff'

const STATUS_FILTERS: { key: StatusKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Users className="h-3.5 w-3.5" /> },
  { key: 'open', label: 'Open', icon: <CircleCheck className="h-3.5 w-3.5" /> },
  { key: 'hold', label: 'Hold', icon: <CirclePause className="h-3.5 w-3.5" /> },
  { key: 'closed', label: 'Closed', icon: <Ban className="h-3.5 w-3.5" /> },
  { key: 'void', label: 'Void', icon: <CircleX className="h-3.5 w-3.5" /> },
  { key: 'cancelled', label: 'Cancelled', icon: <Ban className="h-3.5 w-3.5" /> },
]

const CATEGORY_FILTERS: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Users className="h-3.5 w-3.5" /> },
  { key: 'member', label: 'Member', icon: <UserCheck className="h-3.5 w-3.5" /> },
  { key: 'non-member', label: 'Non Member', icon: <UserX className="h-3.5 w-3.5" /> },
  { key: 'staff', label: 'Staff', icon: <Briefcase className="h-3.5 w-3.5" /> },
]

const STATUS_COLORS: Record<string, { border: string; badge: string }> = {
  open: { border: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hold: { border: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  closed: { border: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  void: { border: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { border: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const TAB_TYPE_LABELS: Record<string, string> = {
  'walk-in': 'Walk-in',
  'open-tab': 'Open Tab',
  'reserved': 'Reserved',
  'staff': 'Staff',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getTabTypeCategory(tabType: string): CategoryKey {
  if (tabType === 'staff') return 'staff'
  return 'non-member' // default mapping
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrdersScreen() {
  const {
    ordersVersion,
    refreshOrders,
    setActiveScreen,
    setActiveOrderId,
    setActiveCustomer,
    loadCartFromOrder,
    clearCart,
  } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateMode, setDateMode] = useState<'today' | 'all' | 'custom'>('today')
  const [customDate, setCustomDate] = useState(todayStr)

  // ── Fetch orders ──
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter, search, sortBy, ordersVersion, dateMode, customDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('sortBy', sortBy)
      if (dateMode === 'today') params.set('date', todayStr)
      else if (dateMode === 'custom') params.set('date', customDate)
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json() as Promise<Order[]>
    },
  })

  // ── Filter by category ──
  const filteredOrders = useMemo(() => {
    if (categoryFilter === 'all') return orders
    return orders.filter((o) => getTabTypeCategory(o.tabType) === categoryFilter)
  }, [orders, categoryFilter])

  // ── Status counts ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1
    }
    return counts
  }, [orders])

  // ── Handle clicking Open/Hold order → navigate to POS ──
  function handleGoToPOS(order: Order) {
    const cartItems: CartItem[] = order.orderItems.map((item) => ({
      id: item.productId,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      category: item.product.category,
    }))
    clearCart()
    loadCartFromOrder(cartItems)
    setActiveOrderId(order.id)
    setActiveCustomer(
      order.customerName
        ? {
            id: order.customer?.id,
            name: order.customerName,
            email: order.customer?.email,
            phone: order.customer?.phone,
          }
        : null
    )
    setActiveScreen('pos')
  }

  function handleDuplicateOrder(order: Order) {
    const cartItems: CartItem[] = order.orderItems.map((item) => ({
      id: item.productId,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      category: item.product.category,
    }))
    clearCart()
    loadCartFromOrder(cartItems)
    setActiveOrderId(null)
    setActiveCustomer(
      order.customerName
        ? {
            id: order.customer?.id,
            name: order.customerName,
            email: order.customer?.email,
            phone: order.customer?.phone,
          }
        : null
    )
    setDetailOrder(null)
    setActiveScreen('pos')
  }

  // ── Handle order status update ──
  async function handleUpdateStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast.success(`Order ${newStatus}`)
      refreshOrders()
    } catch {
      toast.error('Failed to update order')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-4 border-b bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Running Orders</h1>
            <p className="text-sm text-zinc-500">
              {isLoading ? '...' : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button 
            onClick={() => {
              clearCart()
              setActiveOrderId(null)
              setActiveCustomer(null)
              setActiveScreen('pos')
            }} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Date filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', 'all', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                dateMode === mode
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {mode === 'today' ? '📅 Today' : mode === 'all' ? '📋 All Orders' : '🗓 Pick Date'}
            </button>
          ))}
          {dateMode === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          )}
          <span className="text-xs text-zinc-400 ml-auto">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest $</SelectItem>
              <SelectItem value="lowest">Lowest $</SelectItem>
              <SelectItem value="number">Order #</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="px-4 sm:px-6 py-3 border-b bg-white space-y-2">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === f.key
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {f.icon}
              {f.label}
              <span className="ml-0.5 opacity-70">
                {(statusCounts[f.key] ?? 0) > 0 ? statusCounts[f.key] : ''}
              </span>
            </button>
          ))}
        </div>
        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setCategoryFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === f.key
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order grid ── */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No orders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => {
                const colors = STATUS_COLORS[order.status] || STATUS_COLORS.open
                const isClickable = order.status === 'open' || order.status === 'hold'
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (isClickable) {
                        handleGoToPOS(order)
                      } else {
                        setDetailOrder(order)
                      }
                    }}
                    className={`relative bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow group ${
                      isClickable
                        ? 'cursor-pointer ring-1 ring-emerald-200 hover:ring-emerald-400 hover:ring-2'
                        : 'cursor-pointer'
                    }`}
                  >
                    {/* Left color bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.border}`} />

                    {/* Top color strip */}
                    <div className={`h-1 ${colors.border}`} />

                    <div className="p-4 pl-5 space-y-2.5">
                      {/* Order number + status + tab type */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900">
                          #{order.orderNumber}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors.badge}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Tab type */}
                      <div className="flex items-center gap-1.5">
                        {order.tabType === 'open-tab' && <Beer className="h-3.5 w-3.5 text-zinc-400" />}
                        <span className="text-xs text-zinc-500">
                          {TAB_TYPE_LABELS[order.tabType] || order.tabType}
                        </span>
                      </div>

                      {/* Customer name + location */}
                      <div>
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {order.customerName || 'Walk-in'}
                        </p>
                        {order.location && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {order.location}
                          </p>
                        )}
                      </div>

                      {/* Items list */}
                      {order.orderItems.length > 0 && (
                        <div className="space-y-0.5">
                          {order.orderItems.slice(0, 3).map((item) => (
                            <p key={item.id} className="text-xs text-zinc-500 truncate">
                              {item.quantity}× {item.product.name}
                            </p>
                          ))}
                          {order.orderItems.length > 3 && (
                            <p className="text-xs text-zinc-400">
                              +{order.orderItems.length - 3} more items
                            </p>
                          )}
                        </div>
                      )}

                      {/* Total + Balance + Go to POS */}
                      <Separator className="my-1" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.total)}</p>
                          {order.balance > 0 && (
                            <p className="text-xs text-red-500">
                              Due: {formatCurrency(order.balance)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isClickable && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Open in POS
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="h-3 w-3" />
                            <TimeAgo date={order.createdAt} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>



      {/* ── Order Detail Sheet ── */}
      <Sheet open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          {detailOrder && (
            <>
              <SheetHeader className="px-6 pt-6 pb-2">
                <SheetTitle>Order #{detailOrder.orderNumber}</SheetTitle>
                <SheetDescription>
                  Created <TimeAgo date={detailOrder.createdAt} />
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
                <div className="px-6 py-4 space-y-5">
                  {/* Status + Tab Type */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_COLORS[detailOrder.status]?.badge}>
                      {detailOrder.status.charAt(0).toUpperCase() + detailOrder.status.slice(1)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {detailOrder.tabType === 'open-tab' && <Beer className="h-3 w-3 mr-1" />}
                      {TAB_TYPE_LABELS[detailOrder.tabType] || detailOrder.tabType}
                    </Badge>
                  </div>

                  {/* Customer info */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {detailOrder.customerName || 'Walk-in'}
                    </p>
                    {detailOrder.location && (
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {detailOrder.location}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2">Items</h3>
                    {detailOrder.orderItems.length === 0 ? (
                      <p className="text-sm text-zinc-400">No items yet</p>
                    ) : (
                      <div className="space-y-2">
                        {detailOrder.orderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-zinc-800">{item.product.name}</span>
                              <span className="text-zinc-400 ml-1">×{item.quantity}</span>
                            </div>
                            <span className="font-medium text-zinc-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Total</span>
                      <span className="font-bold text-zinc-900">{formatCurrency(detailOrder.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Paid</span>
                      <span className="text-emerald-600 font-medium">{formatCurrency(detailOrder.paid)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-700 font-medium">Balance</span>
                      <span className={`font-bold ${detailOrder.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(detailOrder.balance)}
                      </span>
                    </div>
                  </div>

                  {detailOrder.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Notes</h3>
                        <p className="text-sm text-zinc-500">{detailOrder.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Status actions */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailOrder.status === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(detailOrder.id, 'hold')
                              setDetailOrder(null)
                            }}
                          >
                            <CirclePause className="h-3.5 w-3.5 mr-1" />
                            Hold
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(detailOrder.id, 'closed')
                              setDetailOrder(null)
                            }}
                          >
                            <CircleCheck className="h-3.5 w-3.5 mr-1" />
                            Close
                          </Button>
                        </>
                      )}
                      {detailOrder.status === 'hold' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(detailOrder.id, 'open')
                              setDetailOrder(null)
                            }}
                          >
                            Reopen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(detailOrder.id, 'closed')
                              setDetailOrder(null)
                            }}
                          >
                            Close
                          </Button>
                        </>
                      )}
                      {(detailOrder.status === 'open' || detailOrder.status === 'hold') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(detailOrder.id, 'void')
                            setDetailOrder(null)
                          }}
                        >
                          <CircleX className="h-3.5 w-3.5 mr-1" />
                          Void
                        </Button>
                      )}
                      {(detailOrder.status === 'closed' || detailOrder.status === 'void' || detailOrder.status === 'cancelled') && (
                        <Button
                          size="sm"
                          className="bg-zinc-900 hover:bg-zinc-800 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateOrder(detailOrder)
                          }}
                        >
                          <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                          Duplicate Order
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
