import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveScreen = 'orders' | 'pos' | 'apparel' | 'inventory' | 'product-detail' | 'inventory-logs' | 'receiving' | 'devices' | 'reports' | 'register-open' | 'register-close' | 'cash-movement'

export interface CustomerInfo {
  id?: string
  name: string
  email?: string | null
  phone?: string | null
  isMember?: boolean
}

export interface RegisterSession {
  id: string
  deviceId: string
  staffName: string
  status: string
  openingExpected: number
  openingActual: number
  openingVariance: number
  openingFlagged: boolean
  movements: any[]
}

export interface DeviceInfo {
  id: string
  name: string
  deviceKey: string
  location: string
}

export interface StaffInfo {
  id: string
  name: string
  role: string
}

interface AppState {
  activeScreen: ActiveScreen
  setActiveScreen: (screen: ActiveScreen) => void

  detailProductId: string | null
  setDetailProductId: (id: string | null) => void

  // Active order in POS
  activeOrderId: string | null
  setActiveOrderId: (id: string | null) => void

  // Customer for current POS session
  activeCustomer: CustomerInfo | null
  setActiveCustomer: (customer: CustomerInfo | null) => void

  // Cart state for POS
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  loadCartFromOrder: (items: CartItem[]) => void

  // Orders refresh trigger
  ordersVersion: number
  refreshOrders: () => void

  // Products refresh trigger
  productsVersion: number
  refreshProducts: () => void

  // Apparel refresh trigger
  apparelVersion: number
  refreshApparel: () => void

  // Inventory log refresh trigger
  inventoryLogVersion: number
  refreshInventoryLog: () => void

  // Register session
  activeSession: RegisterSession | null
  setActiveSession: (session: RegisterSession | null) => void

  // Active device (persisted)
  activeRegisterDevice: DeviceInfo | null
  setActiveRegisterDevice: (device: DeviceInfo | null) => void

  // Current staff
  currentStaff: StaffInfo | null
  setCurrentStaff: (staff: StaffInfo | null) => void
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeScreen: 'orders',
      setActiveScreen: (screen) => set({ activeScreen: screen }),

      detailProductId: null,
      setDetailProductId: (id) => set({ detailProductId: id }),

      activeOrderId: null,
      setActiveOrderId: (id) => set({ activeOrderId: id }),

      activeCustomer: null,
      setActiveCustomer: (customer) => set({ activeCustomer: customer }),

      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.id === item.id)
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
              ),
            }
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }] }
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== productId),
        })),
      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((c) => c.id !== productId)
              : state.cart.map((c) =>
                  c.id === productId ? { ...c, quantity } : c
                ),
        })),
      clearCart: () => set({ cart: [] }),
      loadCartFromOrder: (items) => set({ cart: items }),

      ordersVersion: 0,
      refreshOrders: () =>
        set((state) => ({ ordersVersion: state.ordersVersion + 1 })),

      productsVersion: 0,
      refreshProducts: () =>
        set((state) => ({ productsVersion: state.productsVersion + 1 })),

      apparelVersion: 0,
      refreshApparel: () =>
        set((state) => ({ apparelVersion: state.apparelVersion + 1 })),

      inventoryLogVersion: 0,
      refreshInventoryLog: () =>
        set((state) => ({ inventoryLogVersion: state.inventoryLogVersion + 1 })),

      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),

      activeRegisterDevice: null,
      setActiveRegisterDevice: (device) => set({ activeRegisterDevice: device }),

      currentStaff: null,
      setCurrentStaff: (staff) => set({ currentStaff: staff }),
    }),
    {
      name: 'strikepos-state',
      partialize: (state) => ({
        activeRegisterDevice: state.activeRegisterDevice,
        currentStaff: state.currentStaff,
      }),
    }
  )
)

