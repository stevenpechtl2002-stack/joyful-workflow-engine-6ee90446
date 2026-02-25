

# Plan: Logout → Landing Page Fix

## Problem
`ZenBookApp.tsx` imports `useAuth` from `@/hooks/useAuth` — this hook's `signOut` only calls `supabase.auth.signOut()` without redirecting. The `AuthContext` version already has the redirect (`window.location.href = '/'`), but it's not being used here.

## Solution
Change `ZenBookApp.tsx` to import `useAuth` from `@/contexts/AuthContext` instead of `@/hooks/useAuth`. The AuthContext's `signOut` already clears all state and redirects to `/`.

## Changes

**File: `src/components/zenbook/ZenBookApp.tsx`**
- Line 59: Change `import { useAuth } from '@/hooks/useAuth'` → `import { useAuth } from '@/contexts/AuthContext'`
- Line 80: Destructure will need minor adjustment since AuthContext exposes `isLoading` instead of `loading`, and doesn't have `isAuthenticated` (but has `user` which serves same purpose)

Specifically:
- `loading` → `isLoading`
- `isAuthenticated` → derive from `!!user`

That's the only change needed — one import swap, one destructure adjustment.

