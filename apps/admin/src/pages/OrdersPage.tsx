import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Toast from '@/components/Toast'
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  X,
  CheckCircle,
  Clock,
  Truck,
  Package,
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Order, Driver } from '@gaztime/shared'

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadOrders()
    loadDrivers()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.orders.list()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDrivers = async () => {
    try {
      const data = await api.drivers.list()
      setDrivers(data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    }
  }

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      await api.orders.assign(orderId, driverId)
      await loadOrders()
      if (selectedOrder?.id === orderId) {
        const updated = await api.orders.getById(orderId)
        setSelectedOrder(updated)
      }
      setToast({ message: 'Driver assigned successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to assign driver:', error)
      setToast({ message: 'Failed to assign driver', type: 'error' })
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    try {
      await api.orders.cancel(orderId, reason)
      await loadOrders()
      setSelectedOrder(null)
      setToast({ message: 'Order cancelled successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to cancel order:', error)
      setToast({ message: 'Failed to cancel order', type: 'error' })
    }
  }

  const handleExportOrders = () => {
    // Create CSV from filtered orders
    const headers = ['Reference', 'Customer', 'Product', 'Channel', 'Status', 'Payment', 'Amount', 'Date']
    const rows = filteredOrders.map(order => [
      order.reference,
      order.customer?.name || 'N/A',
      order.items?.length > 0 ? (order.items[0]?.product?.name || 'Unknown') : 'N/A',
      order.channel,
      order.status,
      order.paymentMethod,
      order.totalAmount.toString(),
      new Date(order.createdAt).toLocaleString('en-ZA')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    setToast({ message: `Exported ${filteredOrders.length} orders to CSV`, type: 'success' })
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter

    return matchesSearch && matchesStatus && matchesChannel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage all customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setToast({ message: 'Manual order creation coming soon', type: 'info' })}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="created">Created</option>
              <option value="confirmed">Confirmed</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
              <option value="all">All Channels</option>
              <option value="app">App</option>
              <option value="ussd">USSD</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="pos">POS</option>
              <option value="phone">Phone</option>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => o.status === 'created' || o.status === 'confirmed').length}
                </p>
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
                <p className="text-sm text-gray-500">In Transit</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => o.status === 'in_transit').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => o.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            {searchTerm || statusFilter !== 'all' || channelFilter !== 'all'
              ? `Showing ${filteredOrders.length} of ${orders.length} orders`
              : `${orders.length} total orders`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Reference</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Channel</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium">{order.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{order.customer?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.customer?.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.items?.length > 0 ? (order.items[0]?.product?.name || 'Unknown') : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {order.channel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs capitalize">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Order Details</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedOrder.reference}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Order Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      {selectedOrder.status !== 'created' && (
                        <div className="w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-gray-500">{formatDateTime(selectedOrder.createdAt)}</p>
                    </div>
                  </div>

                  {selectedOrder.assignedAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        {selectedOrder.deliveredAt && <div className="w-0.5 h-8 bg-gray-200" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Assigned to {selectedOrder.driver?.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(selectedOrder.assignedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.deliveredAt && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Delivered</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(selectedOrder.deliveredAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedOrder.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{selectedOrder.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Address</p>
                    <p className="text-sm font-medium">{selectedOrder.deliveryAddress?.text || (selectedOrder.deliveryAddress as any)?.street || 'Walk-in (no delivery)'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.product?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Payment</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Method</span>
                    <span className="text-sm font-medium capitalize">
                      {selectedOrder.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`text-sm font-medium ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver Assignment */}
              {!selectedOrder.driverId && selectedOrder.status !== 'cancelled' && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Assign Driver</h3>
                  <Select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignDriver(selectedOrder.id, e.target.value)
                      }
                    }}
                  >
                    <option value="">Select a driver...</option>
                    {drivers
                      .filter((d) => d.status === 'online')
                      .map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.todayDeliveries} deliveries today)
                        </option>
                      ))}
                  </Select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedOrder.driverId && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const newDriverId = prompt('Enter new driver ID:')
                      if (newDriverId) {
                        handleAssignDriver(selectedOrder.id, newDriverId)
                      }
                    }}
                  >
                    Reassign Driver
                  </Button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
