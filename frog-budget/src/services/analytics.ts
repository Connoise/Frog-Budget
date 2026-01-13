import type { Category, Purchase, CategoryBudget, MonthlySnapshot, DailySpending, Alert, Profile } from '../types/supabase'

const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

const getYearStart = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1)
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0]
}

const isInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end
}

const getMonthlyIncome = (profile: Profile): number => {
  switch (profile.income_frequency) {
    case 'weekly':
      return profile.income_amount * 4.33
    case 'biweekly':
      return profile.income_amount * 2.17
    case 'monthly':
      return profile.income_amount
    default:
      return profile.income_amount * 2.17
  }
}

export const analyticsService = {
  calculateCategoryBudgets(
    categories: Category[],
    purchases: Purchase[],
    profile: Profile
  ): CategoryBudget[] {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = getMonthStart(now)
    const monthEnd = getMonthEnd(now)
    const yearStart = getYearStart(now)
    const weekStart = getWeekStart(now)

    const monthlyIncome = getMonthlyIncome(profile)
    const yearlyIncome = monthlyIncome * 12

    return categories.map((category) => {
      const categoryPurchases = purchases.filter((p) => p.category_id === category.id)

      const monthlyBudget = (monthlyIncome * category.percentage) / 100
      const yearlyBudget = (yearlyIncome * category.percentage) / 100
      const dailyBudget = monthlyBudget / 30
      const weeklyBudget = monthlyBudget / 4.33
      const biweeklyBudget = monthlyBudget / 2.17

      const todaySpent = categoryPurchases
        .filter((p) => isSameDay(new Date(p.date), today))
        .reduce((sum, p) => sum + p.amount, 0)

      const weekSpent = categoryPurchases
        .filter((p) => new Date(p.date) >= weekStart)
        .reduce((sum, p) => sum + p.amount, 0)

      const monthSpent = categoryPurchases
        .filter((p) => {
          const d = new Date(p.date)
          return isInRange(d, monthStart, monthEnd)
        })
        .reduce((sum, p) => sum + p.amount, 0)

      const yearSpent = categoryPurchases
        .filter((p) => new Date(p.date) >= yearStart)
        .reduce((sum, p) => sum + p.amount, 0)

      const allTimeSpent = categoryPurchases.reduce((sum, p) => sum + p.amount, 0)

      const monthlyRemaining = monthlyBudget - monthSpent
      const yearlyRemaining = yearlyBudget - yearSpent
      const monthlyPercentUsed = monthlyBudget > 0 ? (monthSpent / monthlyBudget) * 100 : 0
      const yearlyPercentUsed = yearlyBudget > 0 ? (yearSpent / yearlyBudget) * 100 : 0

      let status: CategoryBudget['status'] = 'ok'
      if (monthlyPercentUsed > 100) {
        status = 'overspent'
      } else if (monthlyPercentUsed > 80) {
        status = 'danger'
      } else if (monthlyPercentUsed > 60) {
        status = 'warning'
      }

      return {
        category,
        budgeted: {
          daily: dailyBudget,
          weekly: weeklyBudget,
          biweekly: biweeklyBudget,
          monthly: monthlyBudget,
          yearly: yearlyBudget,
        },
        spent: {
          today: todaySpent,
          thisWeek: weekSpent,
          thisMonth: monthSpent,
          thisYear: yearSpent,
          allTime: allTimeSpent,
        },
        remaining: {
          monthly: monthlyRemaining,
          yearly: yearlyRemaining,
        },
        percentUsed: {
          monthly: monthlyPercentUsed,
          yearly: yearlyPercentUsed,
        },
        status,
      }
    })
  },

  getMonthlySnapshots(
    purchases: Purchase[],
    categories: Category[],
    profile: Profile,
    monthsBack: number = 12
  ): MonthlySnapshot[] {
    const snapshots: MonthlySnapshot[] = []
    const now = new Date()
    const monthlyIncome = getMonthlyIncome(profile)

    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthStart = getMonthStart(date)
      const monthEnd = getMonthEnd(date)

      const monthPurchases = purchases.filter((p) => {
        const d = new Date(p.date)
        return isInRange(d, monthStart, monthEnd)
      })

      const byCategory: Record<string, number> = {}
      categories.forEach((c) => {
        byCategory[c.id] = monthPurchases
          .filter((p) => p.category_id === c.id)
          .reduce((sum, p) => sum + p.amount, 0)
      })

      snapshots.push({
        month: monthStr,
        totalSpent: monthPurchases.reduce((sum, p) => sum + p.amount, 0),
        totalBudgeted: monthlyIncome,
        byCategory,
      })
    }

    return snapshots.reverse()
  },

  getDailySpending(purchases: Purchase[], daysBack: number = 30): DailySpending[] {
    const now = new Date()
    const spending: DailySpending[] = []

    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayPurchases = purchases.filter((p) => p.date === dateStr)

      spending.push({
        date: dateStr,
        amount: dayPurchases.reduce((sum, p) => sum + p.amount, 0),
        count: dayPurchases.length,
      })
    }

    return spending
  },

  generateAlerts(categoryBudgets: CategoryBudget[], purchases: Purchase[]): Alert[] {
    const alerts: Alert[] = []
    const now = new Date()

    categoryBudgets.forEach((cb) => {
      if (cb.status === 'overspent') {
        alerts.push({
          id: `overspent-${cb.category.id}`,
          type: 'overspent',
          categoryId: cb.category.id,
          categoryName: cb.category.name,
          message: `${cb.category.name} is over budget by $${Math.abs(cb.remaining.monthly).toFixed(2)}`,
          value: cb.percentUsed.monthly,
          threshold: 100,
          createdAt: now.toISOString(),
        })
      }

      if (cb.status === 'danger') {
        alerts.push({
          id: `warning-${cb.category.id}`,
          type: 'warning',
          categoryId: cb.category.id,
          categoryName: cb.category.name,
          message: `${cb.category.name} is at ${cb.percentUsed.monthly.toFixed(0)}% of monthly budget`,
          value: cb.percentUsed.monthly,
          threshold: 80,
          createdAt: now.toISOString(),
        })
      }
    })

    const thisMonth = purchases.filter((p) => {
      const d = new Date(p.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const totalMonthlyBudget = categoryBudgets.reduce((sum, cb) => sum + cb.budgeted.monthly, 0)
    const largeThreshold = totalMonthlyBudget * 0.1

    thisMonth
      .filter((p) => p.amount > largeThreshold)
      .forEach((p) => {
        const category = categoryBudgets.find((cb) => cb.category.id === p.category_id)
        alerts.push({
          id: `large-${p.id}`,
          type: 'large_purchase',
          categoryId: p.category_id,
          categoryName: category?.category.name,
          message: `Large purchase: ${p.name} ($${p.amount.toFixed(2)})`,
          value: p.amount,
          threshold: largeThreshold,
          createdAt: p.created_at,
        })
      })

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getProjections(
    categoryBudgets: CategoryBudget[],
    purchases: Purchase[]
  ): { projected: number; budgeted: number; daysRemaining: number; dailyAverage: number } {
    const now = new Date()
    const monthStart = getMonthStart(now)
    const monthEnd = getMonthEnd(now)
    const daysInMonth = monthEnd.getDate()
    const daysPassed = now.getDate()
    const daysRemaining = daysInMonth - daysPassed

    const monthPurchases = purchases.filter((p) => {
      const d = new Date(p.date)
      return isInRange(d, monthStart, monthEnd)
    })

    const totalSpent = monthPurchases.reduce((sum, p) => sum + p.amount, 0)
    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0
    const projected = totalSpent + dailyAverage * daysRemaining
    const budgeted = categoryBudgets.reduce((sum, cb) => sum + cb.budgeted.monthly, 0)

    return { projected, budgeted, daysRemaining, dailyAverage }
  },
}
