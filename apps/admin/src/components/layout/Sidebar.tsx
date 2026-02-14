import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  ShoppingCart,
  Users,
  Package,
  Truck,
  Store,
  DollarSign,
  BarChart3,
  Settings,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Map', href: '/live-map', icon: Map },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Fleet', href: '/fleet', icon: Truck },
  { name: 'Pods', href: '/pods', icon: Store },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-brand-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-700 mt-16 lg:mt-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-teal">
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Gaz Time</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-teal text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <p className="text-xs text-gray-400 text-center">
          © 2026 Gaz Time
          <br />
          National Operations
        </p>
      </div>
    </aside>
  )
}
