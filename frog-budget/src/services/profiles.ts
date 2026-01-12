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
        // No profile found, return null
        return null
      }
      throw error
    }
    return data
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
