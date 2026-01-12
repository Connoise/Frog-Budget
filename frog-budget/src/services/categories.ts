import { supabase } from '../lib/supabase'
import type { Category } from '../types/supabase'

export const categoryService = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  async reorder(userId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      user_id: userId,
      order: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ order: update.order })
        .eq('id', update.id)

      if (error) throw error
    }
  },

  async seedDefaults(userId: string): Promise<void> {
    const { error } = await supabase.rpc('seed_default_categories', {
      p_user_id: userId,
    })

    if (error) {
      // If RPC fails, insert manually
      const defaults: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
        { user_id: userId, name: 'Daily + Gifts', percentage: 51, color: '#22c55e', icon: 'shopping-cart', order: 1, is_active: true },
        { user_id: userId, name: 'Music', percentage: 13, color: '#8b5cf6', icon: 'music', order: 2, is_active: true },
        { user_id: userId, name: 'Entertainment', percentage: 10, color: '#f59e0b', icon: 'gamepad-2', order: 3, is_active: true },
        { user_id: userId, name: 'Gillian PC', percentage: 8, color: '#ec4899', icon: 'monitor', order: 4, is_active: true },
        { user_id: userId, name: 'Mushroom', percentage: 6, color: '#84cc16', icon: 'leaf', order: 5, is_active: true },
        { user_id: userId, name: 'Video/Streaming', percentage: 5, color: '#06b6d4', icon: 'tv', order: 6, is_active: true },
        { user_id: userId, name: 'GIS', percentage: 3, color: '#64748b', icon: 'map', order: 7, is_active: true },
        { user_id: userId, name: 'PC', percentage: 1, color: '#ef4444', icon: 'cpu', order: 8, is_active: true },
      ]

      const { error: insertError } = await supabase
        .from('categories')
        .insert(defaults)

      if (insertError) throw insertError
    }
  },
}
