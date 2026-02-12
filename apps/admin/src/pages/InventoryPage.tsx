import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import Toast from '@/components/Toast'
import { Package, AlertTriangle, Search, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Cylinder, StockLevel, LowStockAlert } from '@gaztime/shared'

export function InventoryPage() {
  const [cylinders, setCylinders] = useState<Cylinder[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const [cylData, stockData, lowStock] = await Promise.all([
        api.inventory.listCylinders(),
        api.inventory.getStockLevels(),
        api.inventory.getLowStock(),
      ])
      setCylinders(cylData)
      setStockLevels(stockData)
      setLowStockAlerts(lowStock)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCylinders = cylinders.filter((cyl) => {
    const matchesSearch = cyl.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === 'all' || cyl.locationType === locationFilter
    return matchesSearch && matchesLocation
  })

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      filled: 'bg-green-100 text-green-800',
      in_transit: 'bg-purple-100 text-purple-800',
      with_customer: 'bg-yellow-100 text-yellow-800',
      empty: 'bg-gray-100 text-gray-800',
      returned: 'bg-orange-100 text-orange-800',
      condemned: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage stock levels and cylinder registry</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setToast({ message: 'Add Stock form coming soon', type: 'info' })}>
            <Package className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[9, 3, 1, 19].map((size) => {
          const total = cylinders.filter((c) => c.sizeKg === size).length
          const filled = cylinders.filter(
            (c) => c.sizeKg === size && (c.status === 'filled' || c.status === 'in_transit')
          ).length

          return (
            <Card key={size}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-brand-teal" />
                  <Badge variant="outline">{size}kg Cylinders</Badge>
                </div>
                <div className="text-2xl font-bold">{filled}</div>
                <p className="text-xs text-gray-500">of {total} filled</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-teal rounded-full h-2"
                    style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Low Stock Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.locationName}</p>
                    <p className="text-xs text-gray-500">
                      {alert.sizeKg}kg cylinders: {alert.currentStock} (threshold: {alert.threshold})
                    </p>
                  </div>
                  <Button size="sm">Restock</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Levels by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels by Location</CardTitle>
          <CardDescription>Current inventory across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">9kg Filled</th>
                  <th className="text-left py-3 px-4 font-medium">9kg Empty</th>
                  <th className="text-left py-3 px-4 font-medium">3kg Filled</th>
                  <th className="text-left py-3 px-4 font-medium">3kg Empty</th>
                  <th className="text-left py-3 px-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((level, idx) => {
                  const stock9kg = level.stockBySize.find((s) => s.sizeKg === 9) || {
                    filled: 0,
                    empty: 0,
                  }
                  const stock3kg = level.stockBySize.find((s) => s.sizeKg === 3) || {
                    filled: 0,
                    empty: 0,
                  }
                  const total = level.stockBySize.reduce(
                    (sum, s) => sum + s.filled + s.empty,
                    0
                  )

                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{level.locationName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{level.locationType}</Badge>
                      </td>
                      <td className="py-3 px-4">{stock9kg.filled}</td>
                      <td className="py-3 px-4 text-gray-500">{stock9kg.empty}</td>
                      <td className="py-3 px-4">{stock3kg.filled}</td>
                      <td className="py-3 px-4 text-gray-500">{stock3kg.empty}</td>
                      <td className="py-3 px-4 font-semibold">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">All Locations</option>
              <option value="depot">Depot</option>
              <option value="pod">Pod</option>
              <option value="vehicle">Vehicle</option>
              <option value="customer">Customer</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cylinder Registry */}
      <Card>
        <CardHeader>
          <CardTitle>Cylinder Registry ({filteredCylinders.length})</CardTitle>
          <CardDescription>All registered cylinders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Serial Number</th>
                  <th className="text-left py-3 px-4 font-medium">Size</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Fill Count</th>
                  <th className="text-left py-3 px-4 font-medium">Last Filled</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCylinders.map((cyl) => (
                  <tr key={cyl.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{cyl.serialNumber}</td>
                    <td className="py-3 px-4">{cyl.sizeKg}kg</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(cyl.status)}>{cyl.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-xs font-medium capitalize">{cyl.locationType}</p>
                        <p className="text-xs text-gray-500">{cyl.locationId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{cyl.fillCount}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {cyl.lastFilledAt ? formatDate(cyl.lastFilledAt) : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
