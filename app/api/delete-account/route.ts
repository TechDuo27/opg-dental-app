// app/api/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete user profile (but keep analysis history for research)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // If we have service role key, delete auth user
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Error deleting auth user:', authError)
        return NextResponse.json(
          { error: 'Failed to delete auth account', details: authError.message },
          { status: 500 }
        )
      }
    } else {
      // Without service role key, we can only disable the account
      // by deleting the profile, which will prevent login via our app logic
      console.log('Service role key not available - auth user not deleted')
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}