import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render: (item: T) => ReactNode
  mobileLabel?: string // Optional custom label for mobile view
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  getKey: (item: T) => string | number
  emptyMessage?: string
}

export function ResponsiveTable<T>({
  data,
  columns,
  getKey,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {data.map((item) => (
          <div
            key={getKey(item)}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-gray-600 text-sm">
                  {col.mobileLabel || col.label}
                </span>
                <span className="text-sm text-right ml-4">{col.render(item)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 font-medium text-gray-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={getKey(item)}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
