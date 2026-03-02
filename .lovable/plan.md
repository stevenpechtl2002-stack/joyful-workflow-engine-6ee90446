

## Plan: Fix Login-Redirect-Loop in UnifiedAuth

### Problem
The `useEffect` on line 55-67 in `src/pages/UnifiedAuth.tsx` calls `navigate()` repeatedly because:
1. Each `navigate` call triggers a re-render
2. The `roles` array is a new reference on each render (from `useAuth`)
3. `onAuthStateChange` and `getSession` both fire, causing duplicate state updates and re-triggers of the effect

This creates a "Maximum update depth exceeded" loop where the page bounces between `/login` and the target route.

### Fix in `src/pages/UnifiedAuth.tsx`

1. Add a `useRef` (`hasRedirected`) to track if a redirect has already been performed
2. Guard the `navigate()` calls with this ref so the redirect only fires once
3. Use `navigate(..., { replace: true })` to avoid polluting browser history

```typescript
const hasRedirected = useRef(false);

useEffect(() => {
  if (!isLoading && user && roles.length > 0 && !hasRedirected.current) {
    hasRedirected.current = true;
    if (roles.includes('admin')) {
      navigate('/admin', { replace: true });
    } else if (roles.includes('sales')) {
      navigate('/sales', { replace: true });
    } else if (roles.includes('manager') || mode === 'business') {
      navigate('/', { replace: true });
    } else {
      navigate('/storefront/profile', { replace: true });
    }
  }
}, [user, isLoading, roles, navigate, mode]);
```

### Files
- `src/pages/UnifiedAuth.tsx` -- add `useRef` import and redirect guard

