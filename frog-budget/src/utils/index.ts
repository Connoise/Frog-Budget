// Currency formatting
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

// Date formatting
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, month }
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

// Color utilities
export function getStatusColor(status: 'ok' | 'warning' | 'danger' | 'overspent'): string {
  switch (status) {
    case 'ok':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'danger':
      return 'bg-orange-500'
    case 'overspent':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function getStatusTextColor(status: 'ok' | 'warning' | 'danger' | 'overspent'): string {
  switch (status) {
    case 'ok':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'danger':
      return 'text-orange-600 dark:text-orange-400'
    case 'overspent':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export function getProgressBarColor(percentage: number): string {
  if (percentage > 100) return 'bg-red-500'
  if (percentage > 80) return 'bg-orange-500'
  if (percentage > 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

// Validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num >= 0
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Category colors for charts
export const CHART_COLORS = [
  '#22c55e', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#ef4444', // red
]

export function getCategoryColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

// Export data to CSV
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '')
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Parse CSV to objects
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

// Class name helper
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
