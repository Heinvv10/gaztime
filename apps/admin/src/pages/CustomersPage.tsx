import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Download, UserPlus, Phone, MapPin, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@gaztime/shared'
import type { Customer, Order } from '@gaztime/shared'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, ordersData] = await Promise.all([
        api.customers.list(),
        api.orders.list(),
      ])
      setCustomers(customersData)
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)

    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter

    return matchesSearch && matchesSegment
  })

  const getSegmentColor = (segment: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      churned: 'bg-red-100 text-red-800',
    }
    return colors[segment as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customerId === selectedCustomer.id)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage customer database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Total Customers',
            value: customers.length,
            segment: 'all',
            color: 'bg-blue-100 text-blue-800',
          },
          {
            label: 'Active',
            value: customers.filter((c) => c.segment === 'active').length,
            segment: 'active',
            color: 'bg-green-100 text-green-800',
          },
          {
            label: 'At Risk',
            value: customers.filter((c) => c.segment === 'at_risk').length,
            segment: 'at_risk',
            color: 'bg-yellow-100 text-yellow-800',
          },
          {
            label: 'New',
            value: customers.filter((c) => c.segment === 'new').length,
            segment: 'new',
            color: 'bg-purple-100 text-purple-800',
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSegmentFilter(stat.segment)}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <Badge className={stat.color}>{stat.segment}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
              <option value="all">All Segments</option>
              <option value="new">New</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="churned">Churned</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium">Segment</th>
                  <th className="text-left py-3 px-4 font-medium">Wallet</th>
                  <th className="text-left py-3 px-4 font-medium">Orders</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const customerOrderCount = orders.filter((o) => o.customerId === customer.id).length
                  return (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{customer.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getSegmentColor(customer.segment)}>{customer.segment}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{formatCurrency(customer.walletBalance)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{customerOrderCount}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedCustomer.name}</CardTitle>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedCustomer(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Segment</p>
                  <Badge className={getSegmentColor(selectedCustomer.segment)}>
                    {selectedCustomer.segment}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                  <p className="font-semibold">{formatCurrency(selectedCustomer.walletBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                  <p className="font-semibold">{customerOrders.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Joined</p>
                  <p className="font-semibold">{formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Addresses</h3>
                {selectedCustomer.addresses.map((addr, idx) => (
                  <div key={addr.id || idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded mb-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{addr.label}</p>
                      <p className="text-xs text-gray-600">{addr.text}</p>
                      {addr.landmark && (
                        <p className="text-xs text-gray-500">📍 {addr.landmark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recent Orders</h3>
                <div className="space-y-2">
                  {customerOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="text-xs font-mono">{order.reference}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
