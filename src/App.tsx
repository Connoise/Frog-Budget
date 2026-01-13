import React, { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  LogOut,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  X,
  Edit2,
  Trash2,
  Download,
  Check,
  Menu,
  Upload,
  FileText,
  ChevronLeft,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

import { useBudgetStore } from './stores'
import { useAuth, useProfile, useCategories, usePurchases, useAnalytics } from './hooks'
import {
  formatCurrency,
  formatShortDate,
  formatPercentage,
  getToday,
  getProgressBarColor,
  getStatusTextColor,
  cn,
  exportToCSV,
} from './utils'
import type { PurchaseFormData, CategoryFormData } from './types/supabase'

// ============================================
// AUTH SCREEN
// ============================================
function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Check your email to confirm your account!')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-frog-50 to-frog-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-frog-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🐸</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frog Budget</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your spending, hop to savings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              error.includes('Check your email') 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-frog-600 hover:bg-frog-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-frog-600 hover:text-frog-700 dark:text-frog-400 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SIDEBAR
// ============================================
function Sidebar() {
  const { activeTab, setActiveTab, isDarkMode, toggleDarkMode, sidebarCollapsed, setSidebarCollapsed } = useBudgetStore()
  const { signOut } = useAuth()
  const { alerts } = useAnalytics()

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases' as const, label: 'Purchases', icon: Receipt },
    { id: 'budgets' as const, label: 'Budgets', icon: PieChart },
    { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  const alertCount = alerts.filter(a => a.type === 'overspent' || a.type === 'warning').length

  const handleTabClick = (tabId: typeof tabs[0]['id']) => {
    setActiveTab(tabId)
    // Auto-collapse on mobile after selecting
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transform transition-transform duration-300 ease-in-out",
        sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "lg:justify-center")}>
            <div className="w-10 h-10 bg-frog-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🐸</span>
            </div>
            {!sidebarCollapsed && (
              <div className="lg:hidden xl:block">
                <h1 className="font-bold text-gray-900 dark:text-white">Frog Budget</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personal Finance</p>
              </div>
            )}
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setSidebarCollapsed(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
          {/* Collapse button on desktop */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft size={20} className={cn("text-gray-500 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const showBadge = tab.id === 'dashboard' && alertCount > 0

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                  sidebarCollapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-frog-100 text-frog-700 dark:bg-frog-900/30 dark:text-frog-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                )}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{tab.label}</span>}
                {showBadge && (
                  <span className={cn(
                    "bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center",
                    sidebarCollapsed ? "absolute -top-1 -right-1 lg:top-0 lg:right-0" : "absolute right-3"
                  )}>
                    {alertCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button
            onClick={toggleDarkMode}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors",
              sidebarCollapsed && "lg:justify-center lg:px-2"
            )}
            title={sidebarCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors",
              sidebarCollapsed && "lg:justify-center lg:px-2"
            )}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

// ============================================
// MOBILE HEADER
// ============================================
function MobileHeader() {
  const { toggleSidebar, activeTab } = useBudgetStore()
  const { alerts } = useAnalytics()
  const alertCount = alerts.filter(a => a.type === 'overspent' || a.type === 'warning').length

  const tabLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    purchases: 'Purchases',
    budgets: 'Budgets',
    analysis: 'Analysis',
    settings: 'Settings',
  }

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative"
      >
        <Menu size={24} className="text-gray-700 dark:text-gray-300" />
        {alertCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {alertCount}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xl">🐸</span>
        <span className="font-semibold text-gray-900 dark:text-white">{tabLabels[activeTab]}</span>
      </div>
      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  )
}

// ============================================
// CSV IMPORT MODAL
// ============================================
function CSVImportModal() {
  const { showImportModal, setShowImportModal } = useBudgetStore()
  const { categories } = useCategories()
  const { createPurchase } = usePurchases()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    name: '',
    amount: '',
    category: '',
  })
  const [defaultCategory, setDefaultCategory] = useState('')
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<Array<{ date: string; name: string; amount: number }>>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split('\n')
    return lines.map(line => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      
      if (parsed.length > 0) {
        setHeaders(parsed[0])
        setCsvData(parsed.slice(1))
        
        // Auto-detect columns
        const headerLower = parsed[0].map(h => h.toLowerCase())
        setColumnMapping({
          date: parsed[0][headerLower.findIndex(h => h.includes('date') || h.includes('posted'))] || '',
          name: parsed[0][headerLower.findIndex(h => h.includes('description') || h.includes('name') || h.includes('merchant'))] || '',
          amount: parsed[0][headerLower.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('charge'))] || '',
          category: parsed[0][headerLower.findIndex(h => h.includes('category') || h.includes('type'))] || '',
        })
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    if (csvData.length > 0 && columnMapping.date && columnMapping.name && columnMapping.amount) {
      const dateIdx = headers.indexOf(columnMapping.date)
      const nameIdx = headers.indexOf(columnMapping.name)
      const amountIdx = headers.indexOf(columnMapping.amount)

      const previewData = csvData.slice(0, 5).map(row => {
        let amount = parseFloat(row[amountIdx]?.replace(/[$,]/g, '') || '0')
        // Make positive if negative (some banks show debits as negative)
        amount = Math.abs(amount)
        
        return {
          date: row[dateIdx] || '',
          name: row[nameIdx] || '',
          amount,
        }
      }).filter(p => p.name && p.amount > 0)

      setPreview(previewData)
    } else {
      setPreview([])
    }
  }, [csvData, columnMapping, headers])

  const handleImport = async () => {
    if (!columnMapping.date || !columnMapping.name || !columnMapping.amount || !defaultCategory) {
      return
    }

    setImporting(true)
    setImportResult(null)

    const dateIdx = headers.indexOf(columnMapping.date)
    const nameIdx = headers.indexOf(columnMapping.name)
    const amountIdx = headers.indexOf(columnMapping.amount)

    let success = 0
    let failed = 0

    for (const row of csvData) {
      try {
        let amount = parseFloat(row[amountIdx]?.replace(/[$,]/g, '') || '0')
        amount = Math.abs(amount)
        
        if (amount <= 0 || !row[nameIdx]) continue

        // Parse date - try multiple formats
        let dateStr = row[dateIdx]
        let parsedDate: Date | null = null
        
        // Try MM/DD/YYYY
        const mdyMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        if (mdyMatch) {
          parsedDate = new Date(parseInt(mdyMatch[3]), parseInt(mdyMatch[1]) - 1, parseInt(mdyMatch[2]))
        }
        
        // Try YYYY-MM-DD
        if (!parsedDate) {
          const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
          if (isoMatch) {
            parsedDate = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
          }
        }

        // Try MM-DD-YYYY
        if (!parsedDate) {
          const mdyDash = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
          if (mdyDash) {
            parsedDate = new Date(parseInt(mdyDash[3]), parseInt(mdyDash[1]) - 1, parseInt(mdyDash[2]))
          }
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          failed++
          continue
        }

        const formattedDate = parsedDate.toISOString().split('T')[0]

        await createPurchase({
          name: row[nameIdx].replace(/"/g, '').trim(),
          amount,
          date: formattedDate,
          category_id: defaultCategory,
          notes: 'Imported from CSV',
        })
        success++
      } catch {
        failed++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)
  }

  const handleClose = () => {
    setShowImportModal(false)
    setCsvData([])
    setHeaders([])
    setColumnMapping({ date: '', name: '', amount: '', category: '' })
    setPreview([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!showImportModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl my-8 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload size={20} />
            Import CSV
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-frog-100 file:text-frog-700 dark:file:bg-frog-900/30 dark:file:text-frog-400"
            />
          </div>

          {/* Column Mapping */}
          {headers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Map Columns</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date Column *</label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Description Column *</label>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Column *</label>
                  <select
                    value={columnMapping.amount}
                    onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Default Category *</label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Preview (first 5 rows)</h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Date</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Description</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{row.date}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[200px]">{row.name}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {csvData.length} total rows to import
              </p>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={cn(
              "p-3 rounded-lg",
              importResult.failed > 0
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            )}>
              Imported {importResult.success} purchases successfully.
              {importResult.failed > 0 && ` ${importResult.failed} rows failed.`}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {importResult ? 'Done' : 'Cancel'}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={importing || !columnMapping.date || !columnMapping.name || !columnMapping.amount || !defaultCategory || csvData.length === 0}
              className="flex-1 py-2 px-4 bg-frog-600 hover:bg-frog-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? 'Importing...' : (
                <>
                  <Upload size={18} />
                  Import {csvData.length} Rows
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PURCHASE FORM MODAL
// ============================================
function PurchaseModal() {
  const { showAddPurchase, setShowAddPurchase, editingPurchase, setEditingPurchase } = useBudgetStore()
  const { categories } = useCategories()
  const { createPurchase, editPurchase } = usePurchases()

  const [formData, setFormData] = useState<PurchaseFormData>({
    name: '',
    amount: '',
    date: getToday(),
    category_id: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingPurchase) {
      setFormData({
        name: editingPurchase.name,
        amount: editingPurchase.amount.toString(),
        date: editingPurchase.date,
        category_id: editingPurchase.category_id,
        notes: editingPurchase.notes || '',
      })
    } else {
      setFormData({
        name: '',
        amount: '',
        date: getToday(),
        category_id: categories[0]?.id || '',
        notes: '',
      })
    }
  }, [editingPurchase, categories])

  const handleClose = () => {
    setShowAddPurchase(false)
    setEditingPurchase(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid amount')
      }

      if (editingPurchase) {
        await editPurchase(editingPurchase.id, {
          name: formData.name,
          amount,
          date: formData.date,
          category_id: formData.category_id,
          notes: formData.notes || null,
        })
      } else {
        await createPurchase({
          name: formData.name,
          amount,
          date: formData.date,
          category_id: formData.category_id,
          notes: formData.notes || null,
        })
      }

      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase')
    } finally {
      setSaving(false)
    }
  }

  if (!showAddPurchase) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingPurchase ? 'Edit Purchase' : 'Add Purchase'}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
              placeholder="What did you buy?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500 resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-frog-600 hover:bg-frog-700 text-white rounded-lg disabled:opacity-50">
              {saving ? 'Saving...' : editingPurchase ? 'Update' : 'Add Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// CATEGORY FORM MODAL
// ============================================
function CategoryModal() {
  const { showAddCategory, setShowAddCategory, editingCategory, setEditingCategory } = useBudgetStore()
  const { createCategory, editCategory } = useCategories()

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    percentage: '',
    color: '#22c55e',
    icon: 'tag',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const colorOptions = ['#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#ef4444']

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        percentage: editingCategory.percentage.toString(),
        color: editingCategory.color,
        icon: editingCategory.icon || 'tag',
      })
    } else {
      setFormData({ name: '', percentage: '', color: '#22c55e', icon: 'tag' })
    }
  }, [editingCategory])

  const handleClose = () => {
    setShowAddCategory(false)
    setEditingCategory(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const percentage = parseFloat(formData.percentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100')
      }

      if (editingCategory) {
        await editCategory(editingCategory.id, {
          name: formData.name,
          percentage,
          color: formData.color,
          icon: formData.icon,
        })
      } else {
        await createCategory({
          name: formData.name,
          percentage,
          color: formData.color,
          icon: formData.icon,
          order: 999,
          is_active: true,
        })
      }

      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  if (!showAddCategory) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
              placeholder="Category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Percentage *</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                className="w-full pr-8 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
                placeholder="0"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn("w-8 h-8 rounded-full transition-transform", formData.color === color && "ring-2 ring-offset-2 ring-gray-400 scale-110")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-frog-600 hover:bg-frog-700 text-white rounded-lg disabled:opacity-50">
              {saving ? 'Saving...' : editingCategory ? 'Update' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// DASHBOARD TAB
// ============================================
function DashboardTab() {
  const { setShowAddPurchase } = useBudgetStore()
  const { categoryBudgets, alerts, projections, totalSpentThisMonth, totalBudgetedThisMonth } = useAnalytics()

  const overallPercent = totalBudgetedThisMonth > 0 ? (totalSpentThisMonth / totalBudgetedThisMonth) * 100 : 0
  const activeAlerts = alerts.filter(a => a.type === 'overspent' || a.type === 'warning')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowAddPurchase(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-frog-600 hover:bg-frog-700 text-white rounded-lg transition-colors">
          <Plus size={20} />
          <span>Add Purchase</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Spent This Month</span>
            <DollarSign size={18} className="text-frog-500 hidden sm:block" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpentThisMonth)}</div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">of {formatCurrency(totalBudgetedThisMonth)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Budget Used</span>
            <PieChart size={18} className="text-blue-500 hidden sm:block" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(overallPercent, 1)}</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div className={cn("h-2 rounded-full transition-all", getProgressBarColor(overallPercent))} style={{ width: `${Math.min(overallPercent, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Projected</span>
            {projections.projected > projections.budgeted ? <TrendingUp size={18} className="text-red-500 hidden sm:block" /> : <TrendingDown size={18} className="text-green-500 hidden sm:block" />}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(projections.projected)}</div>
          <div className={cn("text-xs sm:text-sm mt-1", projections.projected > projections.budgeted ? "text-red-500" : "text-green-500")}>
            {projections.projected > projections.budgeted
              ? `${formatCurrency(projections.projected - projections.budgeted)} over`
              : `${formatCurrency(projections.budgeted - projections.projected)} under`}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Daily Avg</span>
            <Calendar size={18} className="text-purple-500 hidden sm:block" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(projections.dailyAverage)}</div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{projections.daysRemaining} days left</div>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between text-sm">
                <span className="text-red-600 dark:text-red-400">{alert.message}</span>
                <span className="text-red-500 font-medium">{alert.value?.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Category Budgets</h3>
        </div>
        <div className="p-4 space-y-4">
          {categoryBudgets.map((cb) => (
            <div key={cb.category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cb.category.color }} />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{cb.category.name}</span>
                </div>
                <div className="text-right text-sm">
                  <span className={cn("font-medium", getStatusTextColor(cb.status))}>{formatCurrency(cb.spent.thisMonth)}</span>
                  <span className="text-gray-500 dark:text-gray-400"> / {formatCurrency(cb.budgeted.monthly)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className={cn("h-2 rounded-full transition-all", getProgressBarColor(cb.percentUsed.monthly))} style={{ width: `${Math.min(cb.percentUsed.monthly, 100)}%` }} />
                </div>
                <span className={cn("text-xs font-medium w-10 text-right", getStatusTextColor(cb.status))}>{formatPercentage(cb.percentUsed.monthly, 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PURCHASES TAB
// ============================================
function PurchasesTab() {
  const { setShowAddPurchase, setEditingPurchase, filters, setFilters, setShowImportModal } = useBudgetStore()
  const { purchases, removePurchase } = usePurchases()
  const { categories } = useCategories()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredPurchases = purchases.filter((p) => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filters.categoryId && p.category_id !== filters.categoryId) return false
    return true
  })

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || 'Unknown'
  const getCategoryColor = (categoryId: string) => categories.find((c) => c.id === categoryId)?.color || '#6b7280'

  const handleDelete = async (id: string) => {
    try {
      await removePurchase(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleExport = () => {
    const data = filteredPurchases.map((p) => ({
      Date: p.date,
      Name: p.name,
      Amount: p.amount,
      Category: getCategoryName(p.category_id),
      Notes: p.notes || '',
    }))
    exportToCSV(data, `frog-budget-purchases-${getToday()}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchases</h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredPurchases.length} {filteredPurchases.length === 1 ? 'purchase' : 'purchases'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setShowAddPurchase(true)} className="flex items-center gap-2 px-4 py-2 bg-frog-600 hover:bg-frog-700 text-white rounded-lg">
            <Plus size={20} />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search purchases..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
          />
        </div>
        <select
          value={filters.categoryId || ''}
          onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No purchases found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filters.categoryId ? 'Try adjusting your filters' : 'Start tracking your spending'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button onClick={() => setShowAddPurchase(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-frog-600 hover:bg-frog-700 text-white rounded-lg">
                <Plus size={18} />Add Purchase
              </button>
              <button onClick={() => setShowImportModal(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Upload size={18} />Import CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPurchases.map((purchase) => (
              <div key={purchase.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getCategoryColor(purchase.category_id) + '20' }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(purchase.category_id) }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{purchase.name}</div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">{getCategoryName(purchase.category_id)}</span>
                        <span>•</span>
                        <span className="flex-shrink-0">{formatShortDate(purchase.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(purchase.amount)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingPurchase(purchase)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      {deleteConfirm === purchase.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(purchase.id)} className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 rounded-lg">
                            <Check size={16} className="text-red-600" />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                            <X size={16} className="text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(purchase.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                          <Trash2 size={16} className="text-gray-500 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {purchase.notes && <div className="mt-2 ml-13 text-sm text-gray-500 dark:text-gray-400">{purchase.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// BUDGETS TAB
// ============================================
function BudgetsTab() {
  const { setShowAddCategory, setEditingCategory } = useBudgetStore()
  const { categories, removeCategory, totalPercentage, isValidPercentage } = useCategories()
  const { profile } = useProfile()
  const { categoryBudgets } = useAnalytics()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      await removeCategory(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const getBudgetInfo = (categoryId: string) => categoryBudgets.find((cb) => cb.category.id === categoryId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your spending categories</p>
        </div>
        <button onClick={() => setShowAddCategory(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-frog-600 hover:bg-frog-700 text-white rounded-lg">
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Percentage Summary */}
      <div className={cn(
        "rounded-xl p-4 border",
        isValidPercentage 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isValidPercentage ? (
              <Check size={20} className="text-green-500" />
            ) : (
              <AlertTriangle size={20} className="text-yellow-500" />
            )}
            <span className={isValidPercentage ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}>
              Total: {totalPercentage.toFixed(1)}%
            </span>
          </div>
          {!isValidPercentage && (
            <span className="text-yellow-600 dark:text-yellow-400 text-sm">
              Should equal 100%
            </span>
          )}
        </div>
      </div>

      {profile && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Income Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Per Paycheck</div>
              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(profile.income_amount)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Monthly</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(profile.income_frequency === 'biweekly' ? profile.income_amount * 2.17 : profile.income_frequency === 'weekly' ? profile.income_amount * 4.33 : profile.income_amount)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Yearly</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency((profile.income_frequency === 'biweekly' ? profile.income_amount * 2.17 : profile.income_frequency === 'weekly' ? profile.income_amount * 4.33 : profile.income_amount) * 12)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Frequency</div>
              <div className="font-semibold text-gray-900 dark:text-white capitalize">{profile.income_frequency}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {categories.map((category) => {
          const budget = getBudgetInfo(category.id)
          return (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: category.color + '20' }}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" style={{ backgroundColor: category.color }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{category.percentage}% of income</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditingCategory(category)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Edit2 size={16} className="text-gray-500" />
                  </button>
                  {deleteConfirm === category.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(category.id)} className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 rounded-lg">
                        <Check size={16} className="text-red-600" />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(category.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 size={16} className="text-gray-500 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              {budget && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Daily</div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(budget.budgeted.daily)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Bi-weekly</div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(budget.budgeted.biweekly)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Monthly</div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(budget.budgeted.monthly)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Yearly</div>
                    <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(budget.budgeted.yearly)}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {categories.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <PieChart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No categories yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create categories to start budgeting</p>
          <button onClick={() => setShowAddCategory(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-frog-600 hover:bg-frog-700 text-white rounded-lg">
            <Plus size={18} />Add Category
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// ANALYSIS TAB
// ============================================
function AnalysisTab() {
  const { categoryBudgets, monthlySnapshots, dailySpending } = useAnalytics()

  const pieData = categoryBudgets.map((cb) => ({
    name: cb.category.name,
    value: cb.spent.thisMonth,
    color: cb.category.color,
  })).filter((d) => d.value > 0)

  const trendData = monthlySnapshots.map((snapshot) => ({
    month: snapshot.month.slice(5),
    spent: snapshot.totalSpent,
    budgeted: snapshot.totalBudgeted,
  }))

  const dailyData = dailySpending.slice(-14).map((d) => ({
    date: d.date.slice(5),
    amount: d.amount,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">Visualize your spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No spending data this month</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="spent" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Spent" />
                <Line type="monotone" dataKey="budgeted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Budget" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Spending (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab() {
  const { profile, updateProfile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    income_amount: '',
    income_frequency: 'biweekly' as 'weekly' | 'biweekly' | 'monthly',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        income_amount: profile.income_amount.toString(),
        income_frequency: profile.income_frequency,
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        display_name: formData.display_name,
        income_amount: parseFloat(formData.income_amount) || 0,
        income_frequency: formData.income_frequency,
      })
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure your budget preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Income</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.income_amount}
                onChange={(e) => setFormData({ ...formData, income_amount: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pay Frequency</label>
            <select
              value={formData.income_frequency}
              onChange={(e) => setFormData({ ...formData, income_frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-frog-500"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 px-4 bg-frog-600 hover:bg-frog-700 text-white rounded-lg disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

// ============================================
// MAIN APP
// ============================================
function App() {
  const { user, isLoading, activeTab, sidebarCollapsed } = useBudgetStore()
  useAuth()
  useProfile()
  useCategories()
  usePurchases()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-frog-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl">🐸</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        !sidebarCollapsed && "lg:ml-0"
      )}>
        <MobileHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'purchases' && <PurchasesTab />}
          {activeTab === 'budgets' && <BudgetsTab />}
          {activeTab === 'analysis' && <AnalysisTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
      <PurchaseModal />
      <CategoryModal />
      <CSVImportModal />
    </div>
  )
}

export default App
