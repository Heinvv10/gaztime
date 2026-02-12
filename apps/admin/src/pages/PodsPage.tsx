import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Toast from '@/components/Toast'
import { Store, MapPin, Package, User, TrendingUp, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { api } from '@gaztime/shared'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const podIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-lg bg-brand-teal border-2 border-white shadow-lg flex items-center justify-center">
    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2 L2 7 L2 17 L12 22 L22 17 L22 7 Z M12 4.5 L19.5 8.5 L12 12.5 L4.5 8.5 Z"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

export function PodsPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [pods, setPods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPods = async () => {
      try {
        setLoading(true)
        const podsData = await api.pods.list()
        setPods(podsData)
      } catch (error) {
        console.error('Error fetching pods:', error)
        setToast({ message: 'Failed to load pods data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchPods()
  }, [])

  const totalSales = 0 // Sales data not available per-pod yet
  const activePods = pods.filter((pod) => pod.active).length
  const totalStock = pods.reduce(
    (sum, pod) => sum + (pod.stock?.reduce((s: number, item: any) => s + item.quantity, 0) || 0),
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-teal" />
          <p className="text-gray-500 mt-2">Loading pods data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pods</h1>
          <p className="text-gray-500">Manage retail kiosks and walk-in locations</p>
        </div>
        <Button onClick={() => setToast({ message: 'Add Pod form coming soon', type: 'info' })}>
          <Store className="h-4 w-4 mr-2" />
          Add Pod
        </Button>
      </div>

      {/* Pod Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Store className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pods</p>
                <p className="text-2xl font-bold">{pods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Pods</p>
                <p className="text-2xl font-bold">{activePods}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Sales/Pod</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(pods.length > 0 ? totalSales / pods.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pods Map */}
      <Card>
        <CardHeader>
          <CardTitle>Pod Locations</CardTitle>
          <CardDescription>Geographic distribution of retail pods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={[-24.8833, 30.3167]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {pods.map((pod) => (
                <Marker key={pod.id} position={[pod.location.lat, pod.location.lng]} icon={podIcon}>
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <p className="font-semibold mb-1">{pod.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{pod.location.address}</p>
                      <div className="space-y-1 mb-2">
                        <p className="text-xs font-medium">Status:</p>
                        <p className={`text-lg font-bold ${pod.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {pod.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Button size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pods.map((pod) => (
          <Card key={pod.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pod.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {pod.location.address}
                  </p>
                </div>
                <Badge variant={pod.active ? 'default' : 'outline'}>
                  {pod.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operator */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Operator: {pod.operatorId || 'Unassigned'}
                </span>
              </div>

              {/* Sales Today */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-400">
                  {formatCurrency(0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Sales data coming soon</p>
              </div>

              {/* Stock Levels */}
              <div>
                <p className="text-sm font-medium mb-2">Stock Levels</p>
                <div className="space-y-2">
                  {pod.stock?.length > 0 ? (
                    pod.stock.map((item: any, idx: number) => {
                      const isLow = item.quantity < 15
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.product}</span>
                          <Badge variant={isLow ? 'destructive' : 'outline'}>
                            {item.quantity}
                          </Badge>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-gray-400">No stock data available</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Replenish
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
