'use client'

import { useAppStore, type ActiveScreen } from '@/store/app-store'
import { LayoutGrid, ShoppingCart, Shirt, Package, History, ArrowDownToLine, BarChart3, Monitor, Lock, Unlock, DollarSign } from 'lucide-react'

const mainNav: { id: ActiveScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Orders', icon: <LayoutGrid className="h-5 w-5 shrink-0" /> },
  { id: 'pos', label: 'POS', icon: <ShoppingCart className="h-5 w-5 shrink-0" /> },
  { id: 'apparel', label: 'Apparel', icon: <Shirt className="h-5 w-5 shrink-0" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="h-5 w-5 shrink-0" /> },
  { id: 'receiving', label: 'Receiving', icon: <ArrowDownToLine className="h-5 w-5 shrink-0" /> },
  { id: 'inventory-logs', label: 'Inv. Logs', icon: <History className="h-5 w-5 shrink-0" /> },
]

const mgmtNav: { id: ActiveScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5 shrink-0" /> },
  { id: 'devices', label: 'Devices', icon: <Monitor className="h-5 w-5 shrink-0" /> },
]

export function Sidebar() {
  const { activeScreen, setActiveScreen, activeSession, currentStaff } = useAppStore()

  const btnClass = (id: ActiveScreen) =>
    `inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium py-2 has-[>svg]:px-3 justify-start gap-3 h-11 px-3 transition-colors w-full ${
      activeScreen === id
        ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-400'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`

  return (
    <aside className="flex flex-col h-screen bg-zinc-900 text-white w-[72px] shrink-0 lg:w-[180px] transition-all">
      <div className="flex items-center gap-2 px-3 py-4 border-b border-zinc-700">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          S
        </div>
        <span className="hidden lg:block text-sm font-semibold tracking-tight truncate">
          StrikePOS
        </span>
      </div>

      {/* Register session status bar */}
      <button
        onClick={() => setActiveScreen(activeSession ? 'register-close' : 'register-open')}
        className={`flex items-center gap-2 px-3 py-2 border-b border-zinc-700 w-full text-left hover:bg-zinc-800 transition-colors ${activeSession ? 'text-emerald-400' : 'text-amber-400'}`}
      >
        {activeSession ? <Unlock className="h-3.5 w-3.5 shrink-0" /> : <Lock className="h-3.5 w-3.5 shrink-0" />}
        <span className="hidden lg:block text-xs truncate">
          {activeSession ? `Open — ${activeSession.staffName}` : 'Register Closed'}
        </span>
      </button>

      <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto">
        {mainNav.map((item) => (
          <button key={item.id} onClick={() => setActiveScreen(item.id)} className={btnClass(item.id)}>
            {item.icon}
            <span className="hidden lg:block text-sm">{item.label}</span>
          </button>
        ))}

        {/* Cash Movement button — only when session open */}
        {activeSession && (
          <button onClick={() => setActiveScreen('cash-movement')} className={btnClass('cash-movement')}>
            <DollarSign className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block text-sm">Cash Move</span>
          </button>
        )}

        <div className="border-t border-zinc-700 mt-2 pt-2">
          {mgmtNav.map((item) => (
            <button key={item.id} onClick={() => setActiveScreen(item.id)} className={btnClass(item.id)}>
              {item.icon}
              <span className="hidden lg:block text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="px-2 pb-3 border-t border-zinc-700 pt-2">
        <div className="hidden lg:block text-xs text-zinc-500 text-center mt-1 px-2 truncate">
          {currentStaff ? currentStaff.name : 'No Staff'}
        </div>
      </div>
    </aside>
  )
}

