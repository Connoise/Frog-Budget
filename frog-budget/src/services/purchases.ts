import { supabase } from '../lib/supabase'
import type { Purchase, FilterOptions } from '../types/supabase'

export const purchaseService = {
  async getAll(userId: string, options?: FilterOptions): Promise<Purchase[]> {
    let query = supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }

    if (options?.startDate) {
      query = query.gte('date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('date', options.endDate)
    }

    if (options?.minAmount !== undefined) {
      query = query.gte('amount', options.minAmount)
    }

    if (options?.maxAmount !== undefined) {
      query = query.lte('amount', options.maxAmount)
    }

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getByMonth(userId: string, year: number, month: number): Promise<Purchase[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>): Promise<Purchase> {
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchase)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    const { data, error } = await supabase
      .from('purchases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async search(userId: string, query: string): Promise<Purchase[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('date', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  },
}
