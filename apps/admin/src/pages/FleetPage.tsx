import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Toast from '@/components/Toast'
import { User, Truck, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Driver } from '@gaztime/shared'

export function FleetPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const data = await api.drivers.list()
      setDrivers(data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-100 text-green-800',
      offline: 'bg-gray-100 text-gray-800',
      on_delivery: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fleet...</p>
        </div>
      </div>
    )
  }

  const onlineCount = drivers.filter((d) => d.status === 'online').length
  const onDeliveryCount = drivers.filter((d) => d.status === 'on_delivery').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage drivers and vehicles</p>
        </div>
        <Button onClick={() => setToast({ message: 'Add Driver form coming soon', type: 'info' })}>
          <User className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Online</p>
                <p className="text-2xl font-bold">{onlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">On Delivery</p>
                <p className="text-2xl font-bold">{onDeliveryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {(
                    drivers.reduce((sum, d) => sum + d.ratingAvg, 0) / drivers.length || 0
                  ).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Driver</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium">Today</th>
                  <th className="text-left py-3 px-4 font-medium">Total</th>
                  <th className="text-left py-3 px-4 font-medium">Rating</th>
                  <th className="text-left py-3 px-4 font-medium">Earnings</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(driver.status)}>{driver.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {driver.vehicle ? (
                        <div>
                          <p className="text-xs font-medium">{driver.vehicle.registration}</p>
                          <p className="text-xs text-gray-500">
                            {driver.vehicle.make} {driver.vehicle.model}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No vehicle</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{driver.todayDeliveries} deliveries</td>
                    <td className="py-3 px-4">{driver.totalDeliveries}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{driver.ratingAvg.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(driver.todayEarnings)}
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
