# Authentication Setup Documentation

## Overview
The AI Career Advisor app now has full Supabase authentication integration with the following features:

## Features Implemented

### 🔐 Authentication Methods
- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Google OAuth**: Users can sign in with their Google account (requires Supabase configuration)
- **Session Management**: Automatic session persistence and refresh
- **Profile Creation**: Automatic user profile creation in the `profiles` table

### 🛡️ Protected Routes
All authenticated pages are now protected:
- `/setup` - Profile setup page
- `/advisor` - AI advisor page
- `/learn` - Learning resources
- `/projects` - Project management
- `/job-readiness` - Job readiness assessment
- `/interview` - Interview preparation
- `/apply` - Job application tracking

### 🎯 Key Components

#### `useAuth` Hook (`src/hooks/useAuth.ts`)
- Manages authentication state
- Provides sign up, sign in, sign out functions
- Handles Google OAuth
- Automatically creates user profiles

#### `ProtectedRoute` Component (`src/components/ProtectedRoute.tsx`)
- Wraps protected pages
- Redirects unauthenticated users to `/auth`
- Shows loading spinner during auth checks

#### Auth Page (`src/pages/Auth.tsx`)
- Unified login/signup form
- Real Supabase integration
- Error handling and user feedback
- Google OAuth button

### 🔧 Configuration

#### Environment Variables (`.env`)
```
VITE_SUPABASE_URL="https://chxelpkvtnlduzlkauep.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

#### Supabase Client (`src/integrations/supabase/client.ts`)
- Configured with proper auth settings
- Persistent sessions
- Auto-refresh tokens

### 🗄️ Database Integration

#### Profiles Table
The app automatically creates user profiles in the `profiles` table with:
- `id` (matches auth.users.id)
- `full_name` (from user metadata)
- `avatar_url` (from user metadata)
- `created_at` and `updated_at` timestamps

#### Profile Creation (`src/lib/auth-utils.ts`)
- `createUserProfile()` - Creates profile after authentication
- `getUserProfile()` - Retrieves user profile data
- Handles existing profile checks

### 🎨 UI/UX Features

#### Landing Page Updates
- Shows different content for authenticated vs unauthenticated users
- Dynamic navigation with user email display
- Context-aware CTA buttons

#### Setup Page Updates
- Added logout functionality in header
- User-friendly sign out process

### 🚀 Usage

#### For New Users
1. Visit `/auth`
2. Choose "Sign up" 
3. Enter email and password
4. Verify email (if email confirmation enabled)
5. Automatic redirect to `/setup`
6. Profile automatically created

#### For Existing Users
1. Visit `/auth`
2. Enter credentials
3. Automatic redirect to `/setup`

#### Google OAuth (requires Supabase setup)
1. Click "Continue with Google"
2. Complete Google authentication
3. Automatic profile creation and redirect

### 🔒 Security Features
- Row Level Security (RLS) ready
- Protected API routes
- Secure session management
- Automatic token refresh
- Profile data isolation

### 🛠️ Next Steps
1. **Enable Google OAuth** in Supabase dashboard
2. **Configure RLS policies** for the profiles table
3. **Add email confirmation** if desired
4. **Implement password reset** functionality
5. **Add user profile editing** features

### 📝 Notes
- All authentication state is managed globally via the `useAuth` hook
- Protected routes automatically redirect to `/auth` if not authenticated
- User profiles are created automatically on first sign-in
- The app handles both new and returning users seamlessly

## Testing
1. Start the development server
2. Visit the app - should show landing page
3. Click "Sign In" - should redirect to `/auth`
4. Try signing up with a new email
5. Try signing in with existing credentials
6. Verify protected routes redirect when not authenticated
7. Test logout functionality from any protected page