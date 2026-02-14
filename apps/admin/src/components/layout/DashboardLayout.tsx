import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile hamburger menu */}
      <MobileMenu>
        <Sidebar />
      </MobileMenu>

      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
