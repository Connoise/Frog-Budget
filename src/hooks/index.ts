import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useBudgetStore } from '../stores'
import { purchaseService } from '../services/purchases'
import { categoryService } from '../services/categories'
import { profileService } from '../services/profiles'
import { analyticsService } from '../services/analytics'
import { wishlistService } from '../services/wishlist'
import type { Purchase, Category, WishlistItem, CategoryBudget, MonthlySnapshot, DailySpending, Alert, Profile } from '../types/supabase'

export function useAuth() {
  const { user, setUser, setProfile, setIsLoading } = useBudgetStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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

export function useProfile() {
  const { user, profile, setProfile } = useBudgetStore()

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      let profileData = await profileService.get(user.id)
      
      if (!profileData) {
        profileData = await profileService.create({
          id: user.id,
          email: user.email,
          display_name: user.email.split('@')[0],
          avatar_url: null,
          income_amount: 2888.72,
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

  const updateProfile = async (updates: Partial<Profile>) => {
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

export function useCategories() {
  const { user, categories, setCategories, addCategory, updateCategory, deleteCategory } = useBudgetStore()

  const loadCategories = useCallback(async () => {
    if (!user) return

    try {
      let cats = await categoryService.getAll(user.id)
      
      if (cats.length === 0) {
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

export function useWishlist() {
  const { user, wishlist, setWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem } = useBudgetStore()

  const loadWishlist = useCallback(async () => {
    if (!user) return

    try {
      const data = await wishlistService.getAll(user.id)
      setWishlist(data)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    }
  }, [user, setWishlist])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('wishlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadWishlist()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadWishlist])

  const createWishlistItem = async (data: Omit<WishlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const newItem = await wishlistService.create({
        ...data,
        user_id: user.id,
      })
      addWishlistItem(newItem)
      return newItem
    } catch (error) {
      console.error('Error creating wishlist item:', error)
      throw error
    }
  }

  const editWishlistItem = async (id: string, updates: Partial<WishlistItem>) => {
    try {
      const updated = await wishlistService.update(id, updates)
      updateWishlistItem(id, updated)
      return updated
    } catch (error) {
      console.error('Error updating wishlist item:', error)
      throw error
    }
  }

  const removeWishlistItem = async (id: string) => {
    try {
      await wishlistService.delete(id)
      deleteWishlistItem(id)
    } catch (error) {
      console.error('Error deleting wishlist item:', error)
      throw error
    }
  }

  return {
    wishlist,
    loadWishlist,
    createWishlistItem,
    editWishlistItem,
    removeWishlistItem,
  }
}

export function useAnalytics(includeWishlist = false, enableRollover = true): {
  categoryBudgets: CategoryBudget[]
  monthlySnapshots: MonthlySnapshot[]
  dailySpending: DailySpending[]
  alerts: Alert[]
  projections: { projected: number; budgeted: number; daysRemaining: number; dailyAverage: number }
  totalSpentThisMonth: number
  totalBudgetedThisMonth: number
  totalEffectiveBudgetThisMonth: number
  totalRollover: number
  totalWishlistCost: number
} {
  const { profile, categories, purchases, wishlist } = useBudgetStore()

  const totalWishlistCost = wishlist.reduce((sum, item) => sum + item.amount, 0)

  if (!profile || categories.length === 0) {
    return {
      categoryBudgets: [],
      monthlySnapshots: [],
      dailySpending: [],
      alerts: [],
      projections: { projected: 0, budgeted: 0, daysRemaining: 0, dailyAverage: 0 },
      totalSpentThisMonth: 0,
      totalBudgetedThisMonth: 0,
      totalEffectiveBudgetThisMonth: 0,
      totalRollover: 0,
      totalWishlistCost,
    }
  }

  // Create simulated purchases from wishlist items if needed
  const simulatedPurchases = includeWishlist
    ? wishlist.map((item) => ({
        ...item,
        date: new Date().toISOString().split('T')[0], // Today's date
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    : []

  const combinedPurchases = includeWishlist ? [...purchases, ...simulatedPurchases] : purchases

  const categoryBudgets = analyticsService.calculateCategoryBudgets(categories, combinedPurchases, profile, enableRollover)
  const monthlySnapshots = analyticsService.getMonthlySnapshots(purchases, categories, profile, 12)
  const dailySpending = analyticsService.getDailySpending(purchases, 30)
  const alerts = analyticsService.generateAlerts(categoryBudgets, combinedPurchases)
  const projections = analyticsService.getProjections(categoryBudgets, combinedPurchases)

  const totalSpentThisMonth = categoryBudgets.reduce((sum, cb) => sum + cb.spent.thisMonth, 0)
  const totalBudgetedThisMonth = categoryBudgets.reduce((sum, cb) => sum + cb.budgeted.monthly, 0)
  const totalEffectiveBudgetThisMonth = categoryBudgets.reduce((sum, cb) => sum + cb.rollover.effectiveBudget, 0)
  const totalRollover = categoryBudgets.reduce((sum, cb) => sum + cb.rollover.amount, 0)

  return {
    categoryBudgets,
    monthlySnapshots,
    dailySpending,
    alerts,
    projections,
    totalSpentThisMonth,
    totalBudgetedThisMonth,
    totalEffectiveBudgetThisMonth,
    totalRollover,
    totalWishlistCost,
  }
}
