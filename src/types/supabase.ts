export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Purchase, 'id' | 'user_id' | 'created_at'>>
      }
      wishlist: {
        Row: WishlistItem
        Insert: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WishlistItem, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  income_amount: number
  income_frequency: 'weekly' | 'biweekly' | 'monthly'
  currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  percentage: number
  color: string
  icon: string | null
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  user_id: string
  category_id: string
  name: string
  amount: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  category_id: string
  name: string
  amount: number
  notes: string | null
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

// Derived types for analytics
export interface CategoryBudget {
  category: Category
  budgeted: {
    daily: number
    weekly: number
    biweekly: number
    monthly: number
    yearly: number
  }
  spent: {
    today: number
    thisWeek: number
    thisMonth: number
    thisYear: number
    allTime: number
  }
  remaining: {
    monthly: number
    yearly: number
  }
  percentUsed: {
    monthly: number
    yearly: number
  }
  status: 'ok' | 'warning' | 'danger' | 'overspent'
}

export interface MonthlySnapshot {
  month: string
  totalSpent: number
  totalBudgeted: number
  byCategory: Record<string, number>
}

export interface DailySpending {
  date: string
  amount: number
  count: number
}

export interface Alert {
  id: string
  type: 'overspent' | 'warning' | 'large_purchase' | 'pace_warning'
  categoryId?: string
  categoryName?: string
  message: string
  value?: number
  threshold?: number
  createdAt: string
}

// Filter options
export interface FilterOptions {
  categoryId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  sortBy?: 'date' | 'amount' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// Form types
export interface PurchaseFormData {
  name: string
  amount: string
  date: string
  category_id: string
  notes: string
}

export interface CategoryFormData {
  name: string
  percentage: string
  color: string
  icon: string
}

export interface ProfileFormData {
  display_name: string
  income_amount: string
  income_frequency: 'weekly' | 'biweekly' | 'monthly'
  currency: string
}

export interface WishlistFormData {
  name: string
  amount: string
  category_id: string
  notes: string
  priority: 'low' | 'medium' | 'high'
}
