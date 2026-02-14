import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  Star,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { formatCurrency, getStatusColor } from '@/lib/utils'
// Default empty stats for initial state
const defaultStats = {
  orders_today: 0,
  revenue_today: 0,
  avg_delivery_time: 0,
  active_drivers: 0,
  customer_rating: 0,
  orders_trend: 0,
  revenue_trend: 0,
}
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { api } from '@gaztime/shared'
import type { Order, Driver } from '@gaztime/shared'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon issue
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom markers
const driverIcon = (status: string) =>
  L.divIcon({
    html: `<div class="w-3 h-3 rounded-full ${
      status === 'online'
        ? 'bg-green-500'
        : status === 'on_delivery'
        ? 'bg-blue-500'
        : 'bg-gray-400'
    } border-2 border-white shadow-lg"></div>`,
    className: '',
    iconSize: [12, 12],
  })

const podIcon = L.divIcon({
  html: `<div class="w-4 h-4 rounded-sm bg-brand-teal border-2 border-white shadow-lg"></div>`,
  className: '',
  iconSize: [16, 16],
})

interface DashboardStats {
  orders_today: number
  revenue_today: number
  avg_delivery_time: number
  active_drivers: number
  customer_rating: number
  orders_trend: number
  revenue_trend: number
}

interface ChartDataPoint {
  date: string
  orders: number
  revenue: number
}

export function HomePage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [pods, setPods] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all orders
      const allOrders = await api.orders.list()
      
      // Fetch drivers and pods
      const allDrivers = await api.drivers.list()
      setDrivers(allDrivers)
      
      const allPods = await api.pods.list()
      setPods(allPods)

      // Calculate today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today)
      
      const ordersToday = todayOrders.length
      const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      
      // Calculate yesterday's stats for trend
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayOrders = allOrders.filter(
        (o) => new Date(o.createdAt) >= yesterday && new Date(o.createdAt) < today
      )
      const ordersYesterday = yesterdayOrders.length
      const revenueYesterday = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      
      const ordersTrend = ordersYesterday > 0 ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100 : 0
      const revenueTrend = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : 0

      // Calculate avg delivery time (delivered orders only)
      const deliveredOrders = allOrders.filter((o) => o.status === 'delivered' || o.status === 'completed')
      let avgDeliveryTime = 0
      if (deliveredOrders.length > 0) {
        const totalTime = deliveredOrders.reduce((sum, o) => {
          if (o.deliveredAt && o.createdAt) {
            const diff = new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime()
            return sum + diff / (1000 * 60) // minutes
          }
          return sum
        }, 0)
        avgDeliveryTime = Math.round(totalTime / deliveredOrders.length)
      }

      // Active drivers (online or on_delivery)
      const activeDrivers = allDrivers.filter(
        (d) => d.status === 'online' || d.status === 'on_delivery'
      ).length

      // Avg rating from delivered orders
      const ratedOrders = deliveredOrders.filter((o) => o.rating)
      const avgRating = ratedOrders.length > 0
        ? ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length
        : 4.5

      setStats({
        orders_today: ordersToday,
        revenue_today: revenueToday,
        avg_delivery_time: avgDeliveryTime || 45,
        active_drivers: activeDrivers,
        customer_rating: avgRating,
        orders_trend: Math.round(ordersTrend),
        revenue_trend: Math.round(revenueTrend),
      })

      // Calculate chart data for last 7 days
      const last7Days: ChartDataPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dayOrders = allOrders.filter(
          (o) => new Date(o.createdAt) >= date && new Date(o.createdAt) < nextDate
        )

        last7Days.push({
          date: date.toISOString(),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        })
      }
      setChartData(last7Days)

      // Recent orders (last 10)
      const sorted = [...allOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setRecentOrders(sorted.slice(0, 10))

      // Generate alerts from real data
      const computedAlerts: any[] = []
      const pendingOrders = allOrders.filter(o => o.status === 'created')
      if (pendingOrders.length >= 3) {
        computedAlerts.push({
          id: 'pending-orders',
          severity: 'warning',
          message: `${pendingOrders.length} unassigned orders waiting for driver assignment`,
          created_at: new Date().toISOString(),
        })
      }
      const offlineDrivers = allDrivers.filter(d => d.status === 'offline')
      if (offlineDrivers.length > 0 && activeDrivers === 0) {
        computedAlerts.push({
          id: 'no-drivers',
          severity: 'critical',
          message: 'All drivers are currently offline',
          created_at: new Date().toISOString(),
        })
      }
      setAlerts(computedAlerts)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Orders Today',
      value: stats.orders_today,
      trend: stats.orders_trend,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Revenue Today',
      value: formatCurrency(stats.revenue_today),
      trend: stats.revenue_trend,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Avg Delivery Time',
      value: `${stats.avg_delivery_time}min`,
      trend: -5,
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      title: 'Active Drivers',
      value: stats.active_drivers,
      trend: 0,
      icon: Users,
      color: 'text-orange-600',
    },
    {
      title: 'Customer Rating',
      value: stats.customer_rating.toFixed(1),
      trend: 3,
      icon: Star,
      color: 'text-yellow-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Gaz Time Operations - South Africa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend !== 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stat.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(stat.trend)}%
                  </span>
                  <span>vs yesterday</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders (Last 7 Days)</CardTitle>
            <CardDescription>Daily order volume trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="#2BBFB3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
            <CardDescription>Daily revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F7C948"
                  strokeWidth={2}
                  dot={{ fill: '#F7C948', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Operations Map & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Mini Map */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live Operations</CardTitle>
            <CardDescription>Driver locations and active pods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 rounded-lg overflow-hidden">
              <MapContainer
                center={[-24.8833, 30.3167]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Service area circle */}
                <Circle
                  center={[-24.8833, 30.3167]}
                  radius={5000}
                  pathOptions={{ color: '#2BBFB3', fillColor: '#2BBFB3', fillOpacity: 0.1 }}
                />
                {/* Drivers */}
                {drivers
                  .filter((d) => d.currentLocation)
                  .map((driver) => (
                    <Marker
                      key={driver.id}
                      position={[driver.currentLocation!.lat, driver.currentLocation!.lng]}
                      icon={driverIcon(driver.status)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-xs text-gray-600">{driver.status}</p>
                          <p className="text-xs">Deliveries today: {driver.todayDeliveries}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                {/* Pods */}
                {pods.filter(p => p.location?.lat).map((pod) => (
                  <Marker
                    key={pod.id}
                    position={[pod.location.lat, pod.location.lng]}
                    icon={podIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{pod.name}</p>
                        <p className="text-xs text-gray-600">{pod.location?.address || 'No address'}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>{alerts.length} require attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`h-4 w-4 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'text-red-500'
                          : alert.severity === 'warning'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Last 10 orders placed</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={recentOrders}
            getKey={(order) => order.id}
            emptyMessage="No recent orders"
            columns={[
              {
                key: 'reference',
                label: 'Reference',
                mobileLabel: 'Ref',
                render: (order) => (
                  <span className="font-mono text-xs">{order.reference}</span>
                ),
              },
              {
                key: 'customer',
                label: 'Customer',
                render: (order) => order.customer?.name || 'N/A',
              },
              {
                key: 'product',
                label: 'Product',
                render: (order) => order.items[0]?.product?.name || 'N/A',
              },
              {
                key: 'channel',
                label: 'Channel',
                render: (order) => (
                  <Badge variant="outline" className="text-xs">
                    {order.channel}
                  </Badge>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (order) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                render: (order) => formatCurrency(order.totalAmount),
              },
              {
                key: 'time',
                label: 'Time',
                render: (order) => (
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
