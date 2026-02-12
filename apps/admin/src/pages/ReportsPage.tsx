import { useState, useEffect } from 'react'
import Toast from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Order, Customer } from '@gaztime/shared'
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

const reportTypes = [
  {
    id: 'sales',
    name: 'Sales Report',
    description: 'Daily, weekly, and monthly sales performance',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'delivery',
    name: 'Delivery Performance',
    description: 'Delivery times, completion rates, and driver performance',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Stock levels, movements, and cylinder tracking',
    icon: Package,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'customer',
    name: 'Customer Growth',
    description: 'New customers, retention, and churn analysis',
    icon: Users,
    color: 'bg-orange-100 text-orange-600',
  },
]

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7days')
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          api.orders.list(),
          api.customers.list(),
        ])
        setOrders(ordersData)
        setCustomers(customersData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter orders by last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo && o.status !== 'cancelled')

  const totalRevenue = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalOrders = recentOrders.length
  
  const newCustomers = customers.filter((c) => {
    const createdDate = new Date(c.createdAt)
    return createdDate >= sevenDaysAgo
  }).length

  // Daily chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const dayOrders = orders.filter(o => {
      const created = new Date(o.createdAt)
      return created >= date && created < nextDay && o.status !== 'cancelled'
    })

    return {
      date: date.toISOString(),
      revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      orders: dayOrders.length,
    }
  })

  // Top products by order count
  const productCounts = recentOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      const productName = item.product?.name || 'Unknown'
      if (!acc[productName]) {
        acc[productName] = { orders: 0, revenue: 0 }
      }
      acc[productName].orders += item.quantity
      acc[productName].revenue += item.total
    })
    return acc
  }, {} as Record<string, { orders: number; revenue: number }>)

  const topProducts = Object.entries(productCounts)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 4)

  // Top customers by spend
  const customerSpend = recentOrders.reduce((acc, order) => {
    const customerId = order.customerId
    if (!acc[customerId]) {
      acc[customerId] = {
        name: order.customer?.name || 'Unknown',
        spend: 0,
        orders: 0,
      }
    }
    acc[customerId].spend += order.totalAmount
    acc[customerId].orders += 1
    return acc
  }, {} as Record<string, { name: string; spend: number; orders: number }>)

  /* const topCustomers = Object.entries(customerSpend)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5) */
  void customerSpend // suppress unused warning

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading reports data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and export business reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </Select>
          <Button variant="outline" onClick={() => setToast({ message: 'Custom date range coming soon', type: 'info' })}>
            <Calendar className="h-4 w-4 mr-2" />
            Custom Dates
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedReport(report.id)}
          >
            <CardContent className="pt-6">
              <div className={`p-3 rounded-lg ${report.color} w-fit mb-3`}>
                <report.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">{report.name}</h3>
              <p className="text-sm text-gray-500">{report.description}</p>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Report (Example) */}
      {selectedReport === 'sales' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Report - Last 7 Days</CardTitle>
                <CardDescription>Comprehensive sales performance analysis</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(totalRevenue / 7)}/day
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {Math.round(totalOrders / 7)}/day
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalRevenue / totalOrders)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Daily Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { weekday: 'short' })}
                  />
                  <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#2BBFB3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Top Products</h3>
              <div className="space-y-2">
                {topProducts.length > 0 ? (
                  topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.orders} units sold</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No products data</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Growth Report */}
      {selectedReport === 'customer' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Growth Report</CardTitle>
                <CardDescription>Customer acquisition and retention metrics</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">New (7 days)</p>
                <p className="text-2xl font-bold text-green-600">{newCustomers}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-purple-600">
                  {customers.filter((c) => c.segment === 'active').length}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">At Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {customers.filter((c) => c.segment === 'at_risk').length}
                </p>
              </div>
            </div>

            {/* Customer Segments */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Customer Segments</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      segment: 'New',
                      count: customers.filter((c) => c.segment === 'new').length,
                    },
                    {
                      segment: 'Active',
                      count: customers.filter((c) => c.segment === 'active').length,
                    },
                    {
                      segment: 'At Risk',
                      count: customers.filter((c) => c.segment === 'at_risk').length,
                    },
                    {
                      segment: 'Churned',
                      count: customers.filter((c) => c.segment === 'churned').length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F7C948" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats - Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold mb-3">Order Volume</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, 'Orders']}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#2BBFB3"
                    strokeWidth={2}
                    dot={{ fill: '#2BBFB3', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
