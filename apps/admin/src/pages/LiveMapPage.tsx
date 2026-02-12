import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor } from '@/lib/utils'
import { api } from '@gaztime/shared'
import { Radio, Truck, Store, Loader2 } from 'lucide-react'

// Custom markers
const createDriverIcon = (status: string) =>
  L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${
      status === 'online'
        ? 'bg-green-500'
        : status === 'on_delivery'
        ? 'bg-blue-500'
        : 'bg-gray-400'
    } border-2 border-white shadow-lg">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 18.5a1.5 1.5 0 0 1-1 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1 1.5zm1.5-9-1.5 7-10.5.004L6 9.5h13.5M6 6h15l-1.68 8.4c-.12.6-.69 1.1-1.32 1.1H5l-1.5-7.5L2 2H0v2h1l1.5 7.5L4 18.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5h9a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5z"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

const podIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-teal border-2 border-white shadow-lg">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2 L2 7 L2 17 L12 22 L22 17 L22 7 Z M12 4.5 L19.5 8.5 L12 12.5 L4.5 8.5 Z M4 10 L11 14 L11 19.5 L4 15.5 Z M13 19.5 L13 14 L20 10 L20 15.5 Z"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

const depotIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-navy border-2 border-white shadow-lg">
    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
})

export function LiveMapPage() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [selectedPod, setSelectedPod] = useState<string | null>(null)
  const [showDrivers, setShowDrivers] = useState(true)
  const [showPods, setShowPods] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  
  const [drivers, setDrivers] = useState<any[]>([])
  const [pods, setPods] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [driversData, podsData, ordersData] = await Promise.all([
          api.drivers.list(),
          api.pods.list(),
          api.orders.list(),
        ])
        setDrivers(driversData)
        setPods(podsData)
        setOrders(ordersData.filter((o: any) => o.status === 'in_transit'))
      } catch (error) {
        console.error('Error fetching live map data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeOrders = orders

  // Depot location
  const depotLocation = { lat: -24.8833, lng: 30.3167 }

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-teal" />
          <p className="text-gray-500 mt-2">Loading live map data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex-shrink-0 overflow-y-auto">
        <CardHeader>
          <CardTitle>Live Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Display Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDrivers}
                  onChange={(e) => setShowDrivers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Drivers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPods}
                  onChange={(e) => setShowPods(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Pods</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Active Routes</span>
              </label>
            </div>
          </div>

          {/* Driver List */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Drivers ({drivers.length})
            </h3>
            <div className="space-y-2">
              {drivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={`w-full text-left p-2 rounded-lg border transition-colors ${
                    selectedDriver === driver.id
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.phone}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        driver.status
                      )}`}
                    >
                      {driver.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                    <span>{driver.totalDeliveries || 0} deliveries</span>
                    <span>★ {(driver.ratingAvg || 0).toFixed(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pod List */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Pods ({pods.length})
            </h3>
            <div className="space-y-2">
              {pods.map((pod) => (
                <button
                  key={pod.id}
                  onClick={() => setSelectedPod(pod.id)}
                  className={`w-full text-left p-2 rounded-lg border transition-colors ${
                    selectedPod === pod.id
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{pod.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pod.location.address}</p>
                  <div className="mt-1 text-xs">
                    <span className={`${pod.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {pod.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Deliveries */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Active Deliveries ({activeOrders.length})
            </h3>
            <div className="space-y-2">
              {activeOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-2 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium font-mono">{order.reference}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{order.driver?.name}</p>
                  <p className="text-xs text-gray-500">{order.items[0].product}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <MapContainer
            center={[depotLocation.lat, depotLocation.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Service area */}
            <Circle
              center={[depotLocation.lat, depotLocation.lng]}
              radius={5000}
              pathOptions={{ color: '#2BBFB3', fillColor: '#2BBFB3', fillOpacity: 0.1 }}
            />

            {/* Depot */}
            <Marker position={[depotLocation.lat, depotLocation.lng]} icon={depotIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Main Depot</p>
                  <p className="text-xs text-gray-600">Central Operations</p>
                </div>
              </Popup>
            </Marker>

            {/* Drivers */}
            {showDrivers &&
              drivers
                .filter((driver) => driver.currentLocation?.lat && driver.currentLocation?.lng)
                .map((driver) => (
                  <Marker
                    key={driver.id}
                    position={[driver.currentLocation.lat, driver.currentLocation.lng]}
                    icon={createDriverIcon(driver.status)}
                  >
                    <Popup>
                      <div className="text-sm min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{driver.name}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                              driver.status
                            )}`}
                          >
                            {driver.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{driver.phone}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Total deliveries</p>
                            <p className="font-medium">{driver.totalDeliveries || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Rating</p>
                            <p className="font-medium">★ {(driver.ratingAvg || 0).toFixed(1)}</p>
                          </div>
                        </div>
                        <Button size="sm" className="w-full mt-2">
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

            {/* Pods */}
            {showPods &&
              pods.map((pod) => (
                <Marker
                  key={pod.id}
                  position={[pod.location.lat, pod.location.lng]}
                  icon={podIcon}
                >
                  <Popup>
                    <div className="text-sm min-w-[220px]">
                      <p className="font-semibold mb-1">{pod.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{pod.location.address}</p>
                      <div className="space-y-1 mb-2">
                        <p className="text-xs font-medium">Stock Levels:</p>
                        {pod.stock?.length > 0 ? (
                          pod.stock.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-600">{item.product}</span>
                              <span className="font-medium">{item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400">No stock data</p>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`font-semibold ${pod.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {pod.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Active delivery routes */}
            {showRoutes &&
              activeOrders.slice(0, 3).map((order) => {
                const driver = drivers.find((d) => d.id === order.driver?.id)
                if (!driver || !driver.currentLocation?.lat || !driver.currentLocation?.lng) return null
                // Create a simple route from depot to driver location
                return (
                  <Polyline
                    key={order.id}
                    positions={[
                      [depotLocation.lat, depotLocation.lng],
                      [driver.currentLocation.lat, driver.currentLocation.lng],
                    ]}
                    pathOptions={{ color: '#3B82F6', weight: 3, dashArray: '5, 10' }}
                  />
                )
              })}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  )
}
