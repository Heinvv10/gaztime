import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Toast from '@/components/Toast'
import {
  User,
  Bell,
  DollarSign,
  Package,
  Shield,
  Database,
} from 'lucide-react'

export function SettingsPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleSaveProfile = () => {
    // Save to localStorage as placeholder
    localStorage.setItem('profile', JSON.stringify({
      name: 'Admin User',
      email: 'admin@gaztime.co.za',
      savedAt: new Date().toISOString()
    }))
    setToast({ message: 'Profile settings saved successfully', type: 'success' })
  }

  const handleSaveThresholds = () => {
    localStorage.setItem('stockThresholds', JSON.stringify({
      mainDepot: 200,
      pod1: 20,
      pod2: 20,
      pod3: 20,
      savedAt: new Date().toISOString()
    }))
    setToast({ message: 'Stock thresholds saved successfully', type: 'success' })
  }

  const handleUpdatePrices = () => {
    localStorage.setItem('pricing', JSON.stringify({
      '9kg': 315,
      '3kg': 99,
      '1kg': 35,
      '19kg': 620,
      deliveryFee: 0,
      updatedAt: new Date().toISOString()
    }))
    setToast({ message: 'Prices updated successfully', type: 'success' })
  }
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure system preferences and account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input defaultValue="Admin User" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" defaultValue="admin@gaztime.co.za" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select defaultValue="admin">
              <option value="admin">Super Admin</option>
              <option value="manager">Area Manager</option>
              <option value="operator">Operator</option>
              <option value="readonly">Read-only</option>
            </Select>
          </div>
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what updates you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'New Order Alerts', description: 'Get notified when new orders are placed' },
            { label: 'Low Stock Warnings', description: 'Alert when stock falls below threshold' },
            {
              label: 'Delivery Issues',
              description: 'Notifications for late or failed deliveries',
            },
            { label: 'Daily Reports', description: 'Receive end-of-day summary via email' },
          ].map((item, idx) => (
            <label key={idx} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" defaultChecked className="mt-1" />
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>Set product prices and delivery fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { product: '9kg LPG Cylinder', price: 315 },
            { product: '3kg LPG Refill', price: 99 },
            { product: '1kg LPG Daily', price: 35 },
            { product: '19kg LPG Cylinder', price: 620 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">{item.product}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">R</span>
                <Input
                  type="number"
                  defaultValue={item.price}
                  className="w-24"
                />
              </div>
            </div>
          ))}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Delivery Fee</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">R</span>
                <Input type="number" defaultValue={0} className="w-24" />
              </div>
            </div>
          </div>
          <Button onClick={handleUpdatePrices}>Update Prices</Button>
        </CardContent>
      </Card>

      {/* Stock Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Alert Thresholds
          </CardTitle>
          <CardDescription>Set minimum stock levels for alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { location: 'Main Depot', threshold: 200 },
            { location: 'Pod 1 - Town Centre', threshold: 20 },
            { location: 'Pod 2 - Extension 5', threshold: 20 },
            { location: 'Pod 3 - Extension 7', threshold: 20 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">{item.location}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  defaultValue={item.threshold}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">units</span>
              </div>
            </div>
          ))}
          <Button onClick={handleSaveThresholds}>Save Thresholds</Button>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>Manage admin users and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Admin User', email: 'admin@gaztime.co.za', role: 'Super Admin' },
            { name: 'Marco Operations', email: 'marco@gaztime.co.za', role: 'Area Manager' },
            { name: 'Nomsa Operator', email: 'nomsa@gaztime.co.za', role: 'Pod Supervisor' },
          ].map((user, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            <User className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardContent>
      </Card>

      {/* System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System & Data
          </CardTitle>
          <CardDescription>Database and backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Last Backup</span>
              <span className="text-sm text-gray-600">2 hours ago</span>
            </div>
            <Button variant="outline" size="sm">
              Run Backup Now
            </Button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Database Size</span>
              <span className="text-sm text-gray-600">243 MB</span>
            </div>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">
              System Version: 1.0.0 · API: http://localhost:3333/api
            </p>
          </div>
        </CardContent>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
