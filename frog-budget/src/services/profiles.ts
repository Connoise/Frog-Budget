import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'

export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    return data as unknown as Profile
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as Record<string, unknown>)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Profile
  },

  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile as Record<string, unknown>)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Profile
  },
}
