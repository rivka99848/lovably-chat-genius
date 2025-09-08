import { supabase } from '@/integrations/supabase/client'
import { getUserProfile, upsertUserProfile } from './supabase'

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  registrationDate?: string;
}

// Sync user data with Supabase
export const syncUserWithSupabase = async (user: User): Promise<User> => {
  try {
    const profile = await getUserProfile(user.id)
    if (!profile) {
      // Create new profile
      const newProfile = await upsertUserProfile(user.id, {
        name: user.name,
        category: user.category,
        plan: user.plan,
        messages_used: user.messagesUsed,
        message_limit: user.messageLimit
      })
      
      if (newProfile) {
        return {
          ...user,
          messagesUsed: newProfile.messages_used,
          messageLimit: newProfile.message_limit
        }
      }
    } else {
      // Return user with database data
      return {
        ...user,
        messagesUsed: profile.messages_used,
        messageLimit: profile.message_limit
      }
    }
    
    return user
  } catch (error) {
    console.error('Error syncing with Supabase:', error)
    return user
  }
}

// Update message usage in Supabase
export const updateMessageUsage = async (userId: string, newUsage: number): Promise<boolean> => {
  try {
    const updatedProfile = await upsertUserProfile(userId, {
      messages_used: newUsage
    })
    return !!updatedProfile
  } catch (error) {
    console.error('Error updating message usage:', error)
    return false
  }
}

// Check if subscription should be expired
export const checkSubscriptionExpiry = (user: User): User => {
  if (user.subscriptionStatus === 'cancel_pending' && user.subscriptionEndDate) {
    const now = new Date()
    const endDate = new Date(user.subscriptionEndDate)
    
    if (now >= endDate) {
      return {
        ...user,
        plan: 'free',
        messageLimit: 50,
        subscriptionStatus: 'expired'
      }
    }
  }
  
  return user
}

// Refresh user data from Supabase and localStorage
export const refreshUserData = async (userId: string): Promise<User | null> => {
  try {
    // Get from localStorage first
    const savedUser = localStorage.getItem('lovable_user')
    if (!savedUser) return null
    
    let user: User = JSON.parse(savedUser)
    
    // Check subscription expiry
    user = checkSubscriptionExpiry(user)
    
    // Sync with Supabase
    user = await syncUserWithSupabase(user)
    
    // Update localStorage
    localStorage.setItem('lovable_user', JSON.stringify(user))
    
    return user
  } catch (error) {
    console.error('Error refreshing user data:', error)
    return null
  }
}