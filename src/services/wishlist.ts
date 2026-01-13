import { supabase } from '../lib/supabase'
import type { WishlistItem } from '../types/supabase'

export const wishlistService = {
  async getAll(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as WishlistItem[]
  },

  async create(item: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'>): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlist')
      .insert(item as Record<string, unknown>)
      .select()
      .single()

    if (error) throw error
    return data as unknown as WishlistItem
  },

  async update(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlist')
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as WishlistItem
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
