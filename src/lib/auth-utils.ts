import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const createUserProfile = async (user: User) => {
  try {
    // Check if profile already exists using maybeSingle to avoid 406 errors
    const { data: existingProfile, error: checkError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    // If we got a result, profile exists
    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    // Only create if check didn't fail (might be no rows, which is fine)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError);
      return { success: false, error: checkError };
    }

    // Extract display name from email (e.g., "john.doe@gmail.com" -> "John Doe")
    const emailPrefix = user.email?.split('@')[0] || '';
    const displayName = emailPrefix
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Create new profile using upsert to handle race conditions
    const { data: profile, error } = await supabase
      .from('users_profile')
      .upsert({
        id: user.id,
        display_name: displayName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      })
      .select()
      .maybeSingle();

    if (error) {
      // Ignore conflict errors - profile might have been created by trigger
      if (error.code === '23505' || error.code === '23503') {
        console.log('Profile already exists or will be created by trigger');
        return { success: true, profile: { id: user.id } };
      }
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
      .from('users_profile')
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
