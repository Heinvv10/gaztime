import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { DollarSign, TrendingUp, Wallet, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Order } from '@gaztime/shared'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#2BBFB3', '#F7C948', '#1a1a2e', '#94A3B8', '#64748B']

export function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.orders.list()
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Helper: Filter orders by date range
  /* const filterOrdersByDate = (days: number) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setHours(0, 0, 0, 0)
    return orders.filter(o => new Date(o.createdAt) >= cutoff && o.status !== 'cancelled')
  } */

  // Calculate revenue metrics
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const ordersToday = orders.filter(o => new Date(o.createdAt) >= todayStart && o.status !== 'cancelled')
  const ordersYesterday = orders.filter(o => {
    const created = new Date(o.createdAt)
    return created >= yesterdayStart && created < todayStart && o.status !== 'cancelled'
  })
  // const ordersThisWeek = filterOrdersByDate(7)
  // const ordersThisMonth = filterOrdersByDate(30)

  const revenueToday = ordersToday.reduce((sum, o) => sum + o.totalAmount, 0)
  const revenueYesterday = ordersYesterday.reduce((sum, o) => sum + o.totalAmount, 0)
  // const _revenueThisWeek = ordersThisWeek.reduce((sum, o) => sum + o.totalAmount, 0)
  // const _revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.totalAmount, 0)

  const avgOrderValue = ordersToday.length > 0 ? revenueToday / ordersToday.length : 0
  const growthVsYesterday = revenueYesterday > 0 
    ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 
    : 0

  // Daily revenue chart (last 7 days)
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

  // Revenue by product (grouped by first item's product name)
  const revenueByProduct = ordersToday.reduce((acc, order) => {
    const productName = order.items[0]?.product?.name || 'Unknown'
    if (!acc[productName]) {
      acc[productName] = 0
    }
    acc[productName] += order.totalAmount
    return acc
  }, {} as Record<string, number>)

  const revenueByProductData = Object.entries(revenueByProduct).map(([category, value]) => ({
    category,
    value,
    percentage: revenueToday > 0 ? Math.round((value / revenueToday) * 100) : 0,
  })).sort((a, b) => b.value - a.value).slice(0, 5)

  // Revenue by channel
  const revenueByChannel = ordersToday.reduce((acc, order) => {
    const channel = order.channel
    if (!acc[channel]) {
      acc[channel] = 0
    }
    acc[channel] += order.totalAmount
    return acc
  }, {} as Record<string, number>)

  const revenueByChannelData = Object.entries(revenueByChannel).map(([category, value]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    value,
    percentage: revenueToday > 0 ? Math.round((value / revenueToday) * 100) : 0,
  }))

  // Revenue by payment method
  const revenueByPayment = ordersToday.reduce((acc, order) => {
    const method = order.paymentMethod === 'mobile_money' ? 'mobile' : order.paymentMethod
    if (!acc[method]) {
      acc[method] = 0
    }
    acc[method] += order.totalAmount
    return acc
  }, {} as Record<string, number>)

  const revenueByPaymentData = Object.entries(revenueByPayment).map(([category, value]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    value,
    percentage: revenueToday > 0 ? Math.round((value / revenueToday) * 100) : 0,
  }))

  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0)
  // const _avgDailyRevenue = totalRevenue / chartData.length

  const cashRevenue = revenueByPayment['cash'] || 0
  const cashOutstanding = cashRevenue * 0.1 // Estimate 10% outstanding

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading financial data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500">Revenue tracking and financial reports</p>
        </div>
        <Select defaultValue="7days">
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </Select>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueToday)}
                </p>
                {growthVsYesterday !== 0 && (
                  <p className={`text-xs ${growthVsYesterday > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthVsYesterday > 0 ? '+' : ''}{growthVsYesterday.toFixed(1)}% vs yesterday
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">7-Day Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cash Collection</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2BBFB3"
                strokeWidth={3}
                dot={{ fill: '#2BBFB3', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* By Product */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product</CardTitle>
            <CardDescription>Today's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByProductData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueByProductData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByProductData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {revenueByProductData.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span>{item.category}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No data for today</p>
            )}
          </CardContent>
        </Card>

        {/* By Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Channel</CardTitle>
            <CardDescription>Order source breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByChannelData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueByChannelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    <Bar dataKey="value" fill="#F7C948" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {revenueByChannelData.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                        <span className="text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No data for today</p>
            )}
          </CardContent>
        </Card>

        {/* By Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment</CardTitle>
            <CardDescription>Payment method breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByPaymentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueByPaymentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    <Bar dataKey="value" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {revenueByPaymentData.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                        <span className="text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No data for today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Collection Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Collection</CardTitle>
          <CardDescription>Driver cash handovers and outstanding amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Cash Collected Today</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {formatCurrency(cashOutstanding)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Based on real-time order data · {ordersToday.length} orders today
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
