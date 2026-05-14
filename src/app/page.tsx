'use client'

import { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/pos/sidebar'
import { OrdersScreen } from '@/components/pos/orders-screen'
import { PosScreen } from '@/components/pos/pos-screen'
import { InventoryScreen } from '@/components/pos/inventory-screen'
import { ApparelScreen } from '@/components/pos/apparel-screen'
import { InventoryLogsScreen } from '@/components/pos/inventory-logs-screen'
import { ProductDetailScreen } from '@/components/pos/product-detail-screen'
import { ReceivingScreen } from '@/components/pos/receiving-screen'
import { RegisterOpenScreen } from '@/components/pos/register-open-screen'
import { RegisterCloseScreen } from '@/components/pos/register-close-screen'
import { CashMovementScreen } from '@/components/pos/cash-movement-screen'
import { DeviceRegistrationScreen } from '@/components/pos/device-registration-screen'
import { ReportsScreen } from '@/components/pos/reports-screen'
import { useAppStore } from '@/store/app-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30000 },
  },
})

function AppContent() {
  const {
    activeScreen, setActiveScreen,
    activeSession, setActiveSession,
    activeRegisterDevice, setActiveRegisterDevice,
  } = useAppStore()

  const deviceRegistered = useRef(false)

  // Auto-register this device on first load
  useEffect(() => {
    fetch('/api/seed').catch(() => {})

    if (deviceRegistered.current || activeRegisterDevice) return
    deviceRegistered.current = true

    // Use a stable device key stored in localStorage
    let deviceKey = localStorage.getItem('strikepos_device_key')
    if (!deviceKey) {
      deviceKey = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      localStorage.setItem('strikepos_device_key', deviceKey)
    }

    // Check if device already exists by this key
    fetch('/api/devices')
      .then(r => r.json())
      .then((devices: any[]) => {
        const existing = devices.find(d => d.deviceKey === deviceKey)
        if (existing) {
          setActiveRegisterDevice(existing)
          // Restore any open session for this device
          restoreOpenSession(existing.id)
          return
        }
        // Auto-register as a new device
        return fetch('/api/devices/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceKey, name: `POS Terminal`, location: 'Main' })
        }).then(r => r.json()).then(device => {
          if (device?.id) {
            setActiveRegisterDevice(device)
            restoreOpenSession(device.id)
          }
        })
      })
      .catch(() => {})
  }, [])

  function restoreOpenSession(deviceId: string) {
    if (activeSession) return // already have one
    fetch('/api/register/sessions?deviceId=' + deviceId + '&status=open')
      .then(r => r.json())
      .then((sessions: any[]) => {
        const open = sessions?.find((s: any) => s.status === 'open')
        if (open) setActiveSession(open)
      })
      .catch(() => {})
  }

  const isOverlay = activeScreen === 'register-open' || activeScreen === 'register-close' || activeScreen === 'cash-movement'

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-zinc-50 relative">
        {/* Normal screens — always rendered, overlays stack on top */}
        {activeScreen === 'orders' && <OrdersScreen />}
        {activeScreen === 'pos' && <PosScreen />}
        {activeScreen === 'inventory' && <InventoryScreen />}
        {activeScreen === 'apparel' && <ApparelScreen />}
        {activeScreen === 'inventory-logs' && <InventoryLogsScreen />}
        {activeScreen === 'product-detail' && <ProductDetailScreen />}
        {activeScreen === 'receiving' && <ReceivingScreen />}
        {activeScreen === 'devices' && <DeviceRegistrationScreen />}
        {activeScreen === 'reports' && <ReportsScreen />}

        {/* Register Open — full overlay inside main */}
        {activeScreen === 'register-open' && (
          <div className="absolute inset-0 z-50">
            <RegisterOpenScreen
              onSessionOpened={(session) => {
                setActiveSession(session as any)
                setActiveScreen('orders')
              }}
              onGoToDevices={() => setActiveScreen('devices')}
            />
          </div>
        )}

        {/* Register Close — full overlay inside main */}
        {activeScreen === 'register-close' && activeSession && (
          <div className="absolute inset-0 z-50">
            <RegisterCloseScreen
              session={activeSession as any}
              onClosed={() => {
                setActiveSession(null)
                setActiveScreen('orders')
              }}
            />
          </div>
        )}

        {/* Cash Movement — full overlay inside main */}
        {activeScreen === 'cash-movement' && activeSession && (
          <div className="absolute inset-0 z-50">
            <CashMovementScreen
              sessionId={activeSession.id}
              onClose={() => setActiveScreen('orders')}
            />
          </div>
        )}

        {/* No session and trying to close */}
        {activeScreen === 'register-close' && !activeSession && (
          <div className="flex items-center justify-center h-full text-zinc-500">
            No open session to close.
          </div>
        )}
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
