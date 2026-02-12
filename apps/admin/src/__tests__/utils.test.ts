import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../lib/utils'

describe('formatCurrency', () => {
  it('formats ZAR currency correctly', () => {
    const result1000 = formatCurrency(1000)
    expect(result1000).toMatch(/R/)
    expect(result1000).toContain('1')
    
    const result100 = formatCurrency(100)
    expect(result100).toContain('100')
    
    const result0 = formatCurrency(0)
    expect(result0).toContain('0')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-02-11')
    const formatted = formatDate(date)
    expect(formatted).toMatch(/Feb/)
    expect(formatted).toMatch(/2026/)
  })
})

describe('formatTime', () => {
  it('formats time correctly', () => {
    const date = new Date('2026-02-11T14:30:00')
    const formatted = formatTime(date)
    expect(formatted).toMatch(/14:30/)
  })
})

describe('getStatusColor', () => {
  it('returns correct color classes for statuses', () => {
    expect(getStatusColor('created')).toContain('gray')
    expect(getStatusColor('confirmed')).toContain('blue')
    expect(getStatusColor('in_transit')).toContain('yellow')
    expect(getStatusColor('delivered')).toContain('green')
    expect(getStatusColor('cancelled')).toContain('red')
  })

  it('returns default color for unknown status', () => {
    expect(getStatusColor('unknown')).toContain('gray')
  })
})
