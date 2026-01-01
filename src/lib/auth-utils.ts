import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const createUserProfile = async (user: User) => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    // Create new profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { success: false, error };
  }
};