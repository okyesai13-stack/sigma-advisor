

# Add Authentication and User-Linked Data to Platform

## Overview
Add Supabase Auth with login/signup pages, create a profiles table, add `user_id` to all 18 data tables, create an `AuthProvider` context, protect all routes behind auth, and update the ResumeContext to auto-load the user's resume after login.

## Architecture

```text
Landing (/) → "Start Career" → Auth (/auth) → Login/Signup
                                                    ↓
                                              On success
                                                    ↓
                                          /setup (protected)
                                                    ↓
                                    All data tables now keyed by user_id
                                    resume_id still exists but user_id is primary
```

## Changes

### 1. Database Migration

**New table: `profiles`**
- `id` (uuid, PK, references auth.users(id) ON DELETE CASCADE)
- `full_name` (text, nullable)
- `avatar_url` (text, nullable)
- `email` (text, nullable)
- `created_at`, `updated_at` (timestamptz)
- RLS: users can read/update only their own profile

**Trigger**: Auto-create profile on signup via `handle_new_user_profile()` trigger on `auth.users`.

**Add `user_id` column to all 18 tables:**
- `resume_store`, `career_analysis_result`, `skill_validation_result`, `career_goal_score_result`, `ai_role_analysis_result`, `learning_plan_result`, `project_ideas_result`, `job_matching_result`, `job_finder_result`, `journey_state`, `chat_history`, `interview_preparation_result`, `smart_analysis_result`, `upgraded_resume_result`, `mock_interview_session`, `project_build_session`, `learning_content`, `career_trajectory_result`
- All as `uuid REFERENCES auth.users(id) ON DELETE CASCADE`, nullable (to preserve existing data)
- Update RLS policies: authenticated users can only SELECT/INSERT/UPDATE/DELETE their own rows (where `user_id = auth.uid()`), keep public INSERT for backward compat during transition

### 2. New Auth Page: `src/pages/AuthPage.tsx`
- Tab-based login/signup form (email + password)
- Uses `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`
- On successful auth, redirect to `/setup` (new user) or `/dashboard` (returning user with existing resume)
- Clean, modern UI matching the platform's design language

### 3. New Auth Context: `src/contexts/AuthContext.tsx`
- Wraps the app with auth state via `supabase.auth.onAuthStateChange()`
- Provides `user`, `session`, `signOut`, `loading` state
- Set up `onAuthStateChange` listener BEFORE calling `getSession()`

### 4. Protected Route Component: `src/components/auth/ProtectedRoute.tsx`
- Checks auth state; redirects to `/auth` if not logged in
- Shows loading spinner while auth state resolves

### 5. Update `ResumeContext.tsx`
- After auth, auto-fetch the user's most recent `resume_id` from `resume_store` where `user_id = auth.uid()`
- Remove sessionStorage dependency; use the authenticated user's data instead
- Keep `resumeId` in state but load it from DB on auth

### 6. Update `upload-resume` Edge Function
- Accept optional `user_id` from the auth token (extract from `Authorization` header)
- Store `user_id` alongside `resume_id` in `resume_store` and `journey_state`

### 7. Update All Edge Functions (18 functions)
- Extract `user_id` from the auth JWT in the `Authorization` header
- Store `user_id` when inserting rows
- Functions: `career-analysis`, `career-goal-score`, `skill-validation`, `ai-role-analysis`, `learning-plan`, `project-generation`, `job-matching`, `job-finder-agent`, `interview-prep`, `smart-analysis`, `resume-upgrade`, `resume-upgrade-jd`, `career-trajectory`, `mock-interview`, `project-builder`, `advisor-chat`, `advisor-chat-stream`, `upload-resume`

### 8. Update `App.tsx` Routing
- Add `/auth` route (outside layout, like landing)
- Wrap `AppLayout` routes with `ProtectedRoute`
- Landing page "Start Career" button navigates to `/auth` instead of `/setup`

### 9. Update `LandingNoAuth.tsx`
- "Start Career" button → navigate to `/auth`
- "View Previous Results" section: after entering resume ID, require login first

### 10. Update `DashboardNoAuth.tsx` and other pages
- Load data by `user_id` (via auth) instead of just `resume_id` from context
- The `resumeId` is still used as a secondary key but `user_id` ensures data isolation

### 11. Add Sign Out to Layout
- Add user avatar + sign out button in `AppLayout` header area

## Technical Details

### Profile Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
```

### Auth JWT Extraction in Edge Functions
```typescript
const authHeader = req.headers.get('Authorization');
const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
const userId = user?.id;
```

### RLS Pattern for User-Owned Data
```sql
CREATE POLICY "Users can access own data"
  ON public.resume_store FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/AuthPage.tsx` | Login/signup page |
| `src/contexts/AuthContext.tsx` | Auth state provider |
| `src/components/auth/ProtectedRoute.tsx` | Route guard |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add auth route, wrap routes with ProtectedRoute, add AuthProvider |
| `src/contexts/ResumeContext.tsx` | Auto-load user's resume from DB after auth |
| `src/pages/LandingNoAuth.tsx` | "Start Career" → `/auth` |
| `src/components/layout/AppLayout.tsx` | Add sign-out button |
| `supabase/functions/upload-resume/index.ts` | Store user_id |
| 17 other edge functions | Extract and store user_id |

### Database Migration
- Create `profiles` table + trigger
- Add `user_id` column (nullable uuid) to all 18 data tables
- Update RLS policies for authenticated access
- Keep existing public policies as fallback (can remove later)

### Deployment
- Run database migration
- Redeploy all 18 edge functions

