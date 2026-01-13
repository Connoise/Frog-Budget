import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Category, Purchase, FilterOptions, Alert } from '../types/supabase'

export type TabType = 'dashboard' | 'purchases' | 'budgets' | 'analysis' | 'settings'

interface BudgetState {
  // Auth
  user: { id: string; email: string } | null
  setUser: (user: { id: string; email: string } | null) => void

  // Profile
  profile: Profile | null
  setProfile: (profile: Profile | null) => void

  // Data
  categories: Category[]
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  purchases: Purchase[]
  setPurchases: (purchases: Purchase[]) => void
  addPurchase: (purchase: Purchase) => void
  updatePurchase: (id: string, updates: Partial<Purchase>) => void
  deletePurchase: (id: string) => void

  // UI State
  activeTab: TabType
  setActiveTab: (tab: TabType) => void

  selectedMonth: string // YYYY-MM format
  setSelectedMonth: (month: string) => void

  filters: FilterOptions
  setFilters: (filters: FilterOptions) => void
  clearFilters: () => void

  // Alerts
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  dismissAlert: (id: string) => void

  // Theme
  isDarkMode: boolean
  toggleDarkMode: () => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Modals
  showAddPurchase: boolean
  setShowAddPurchase: (show: boolean) => void
  editingPurchase: Purchase | null
  setEditingPurchase: (purchase: Purchase | null) => void

  showAddCategory: boolean
  setShowAddCategory: (show: boolean) => void
  editingCategory: Category | null
  setEditingCategory: (category: Category | null) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // CSV Import
  showImportModal: boolean
  setShowImportModal: (show: boolean) => void
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Profile
      profile: null,
      setProfile: (profile) => set({ profile }),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // Purchases
      purchases: [],
      setPurchases: (purchases) => set({ purchases }),
      addPurchase: (purchase) =>
        set((state) => ({ purchases: [purchase, ...state.purchases] })),
      updatePurchase: (id, updates) =>
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deletePurchase: (id) =>
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== id),
        })),

      // UI State
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),

      selectedMonth: getCurrentMonth(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),

      filters: {},
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      // Alerts
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      // Theme
      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode
          if (newMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { isDarkMode: newMode }
        }),

      // Loading
      isLoading: true,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Purchase modals
      showAddPurchase: false,
      setShowAddPurchase: (show) => set({ showAddPurchase: show, editingPurchase: show ? null : null }),
      editingPurchase: null,
      setEditingPurchase: (purchase) => set({ editingPurchase: purchase, showAddPurchase: !!purchase }),

      // Category modals
      showAddCategory: false,
      setShowAddCategory: (show) => set({ showAddCategory: show, editingCategory: show ? null : null }),
      editingCategory: null,
      setEditingCategory: (category) => set({ editingCategory: category, showAddCategory: !!category }),

      // Sidebar
      sidebarCollapsed: true, // Default collapsed on mobile
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // CSV Import
      showImportModal: false,
      setShowImportModal: (show) => set({ showImportModal: show }),
    }),
    {
      name: 'frog-budget-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        selectedMonth: state.selectedMonth,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// Initialize dark mode on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('frog-budget-storage')
  if (stored) {
    const parsed = JSON.parse(stored)
    if (parsed.state?.isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }
}
