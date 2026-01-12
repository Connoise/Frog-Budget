import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useBudgetStore } from '../stores'
import { purchaseService } from '../services/purchases'
import { categoryService } from '../services/categories'
import { profileService } from '../services/profiles'
import { analyticsService } from '../services/analytics'
import type { Purchase, Category, CategoryBudget, MonthlySnapshot, DailySpending, Alert } from '../types/supabase'

// Auth hook
export function useAuth() {
  const { user, setUser, setProfile, setIsLoading } = useBudgetStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' })
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setIsLoading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, signIn, signUp, signOut }
}

// Profile hook
export function useProfile() {
  const { user, profile, setProfile } = useBudgetStore()

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      let profileData = await profileService.get(user.id)
      
      if (!profileData) {
        // Create default profile
        profileData = await profileService.create({
          id: user.id,
          email: user.email,
          display_name: user.email.split('@')[0],
          avatar_url: null,
          income_amount: 2888.72, // Default from Excel
          income_frequency: 'biweekly',
          currency: 'USD',
        })
      }
      
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }, [user, setProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const updateProfile = async (updates: Partial<typeof profile>) => {
    if (!user || !profile) return

    try {
      const updated = await profileService.update(user.id, updates)
      setProfile(updated)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  return { profile, loadProfile, updateProfile }
}

// Categories hook
export function useCategories() {
  const { user, categories, setCategories, addCategory, updateCategory, deleteCategory } = useBudgetStore()

  const loadCategories = useCallback(async () => {
    if (!user) return

    try {
      let cats = await categoryService.getAll(user.id)
      
      if (cats.length === 0) {
        // Seed default categories
        await categoryService.seedDefaults(user.id)
        cats = await categoryService.getAll(user.id)
      }
      
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [user, setCategories])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadCategories()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadCategories])

  const createCategory = async (data: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const newCategory = await categoryService.create({
        ...data,
        user_id: user.id,
      })
      addCategory(newCategory)
      return newCategory
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  const editCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const updated = await categoryService.update(id, updates)
      updateCategory(id, updated)
      return updated
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await categoryService.delete(id)
      deleteCategory(id)
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  const totalPercentage = categories.reduce((sum, c) => sum + c.percentage, 0)
  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01

  return {
    categories,
    loadCategories,
    createCategory,
    editCategory,
    removeCategory,
    totalPercentage,
    isValidPercentage,
  }
}

// Purchases hook
export function usePurchases() {
  const { user, purchases, setPurchases, addPurchase, updatePurchase, deletePurchase, filters } = useBudgetStore()

  const loadPurchases = useCallback(async () => {
    if (!user) return

    try {
      const data = await purchaseService.getAll(user.id, filters)
      setPurchases(data)
    } catch (error) {
      console.error('Error loading purchases:', error)
    }
  }, [user, filters, setPurchases])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadPurchases()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadPurchases])

  const createPurchase = async (data: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const newPurchase = await purchaseService.create({
        ...data,
        user_id: user.id,
      })
      addPurchase(newPurchase)
      return newPurchase
    } catch (error) {
      console.error('Error creating purchase:', error)
      throw error
    }
  }

  const editPurchase = async (id: string, updates: Partial<Purchase>) => {
    try {
      const updated = await purchaseService.update(id, updates)
      updatePurchase(id, updated)
      return updated
    } catch (error) {
      console.error('Error updating purchase:', error)
      throw error
    }
  }

  const removePurchase = async (id: string) => {
    try {
      await purchaseService.delete(id)
      deletePurchase(id)
    } catch (error) {
      console.error('Error deleting purchase:', error)
      throw error
    }
  }

  const searchPurchases = async (query: string): Promise<Purchase[]> => {
    if (!user || !query.trim()) return []

    try {
      return await purchaseService.search(user.id, query)
    } catch (error) {
      console.error('Error searching purchases:', error)
      return []
    }
  }

  return {
    purchases,
    loadPurchases,
    createPurchase,
    editPurchase,
    removePurchase,
    searchPurchases,
  }
}

// Analytics hook
export function useAnalytics(): {
  categoryBudgets: CategoryBudget[]
  monthlySnapshots: MonthlySnapshot[]
  dailySpending: DailySpending[]
  alerts: Alert[]
  projections: { projected: number; budgeted: number; daysRemaining: number; dailyAverage: number }
  totalSpentThisMonth: number
  totalBudgetedThisMonth: number
} {
  const { profile, categories, purchases } = useBudgetStore()

  if (!profile || categories.length === 0) {
    return {
      categoryBudgets: [],
      monthlySnapshots: [],
      dailySpending: [],
      alerts: [],
      projections: { projected: 0, budgeted: 0, daysRemaining: 0, dailyAverage: 0 },
      totalSpentThisMonth: 0,
      totalBudgetedThisMonth: 0,
    }
  }

  const categoryBudgets = analyticsService.calculateCategoryBudgets(categories, purchases, profile)
  const monthlySnapshots = analyticsService.getMonthlySnapshots(purchases, categories, profile, 12)
  const dailySpending = analyticsService.getDailySpending(purchases, 30)
  const alerts = analyticsService.generateAlerts(categoryBudgets, purchases)
  const projections = analyticsService.getProjections(categoryBudgets, purchases)

  const totalSpentThisMonth = categoryBudgets.reduce((sum, cb) => sum + cb.spent.thisMonth, 0)
  const totalBudgetedThisMonth = categoryBudgets.reduce((sum, cb) => sum + cb.budgeted.monthly, 0)

  return {
    categoryBudgets,
    monthlySnapshots,
    dailySpending,
    alerts,
    projections,
    totalSpentThisMonth,
    totalBudgetedThisMonth,
  }
}
