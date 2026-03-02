

## Plan: Fix Redirect-Loop zwischen Storefront und Login

### Problem
`CustomerProfile.tsx` (Zeile 53) prüft `if (!user) { navigate('/login') }` — aber es verwendet `useAuth` aus `@/hooks/useAuth`, nicht aus `@/contexts/AuthContext`. Dieser Hook hat seinen eigenen Loading-State. Solange der noch lädt, ist `user === null`, und es wird sofort zurück auf `/login` navigiert. Das erzeugt den Loop:

1. UnifiedAuth erkennt User + Rolle → navigiert zu `/storefront/profile`
2. CustomerProfile mountet, `user` ist noch `null` (loading) → navigiert zurück zu `/login`
3. UnifiedAuth mountet neu (neuer Ref) → navigiert wieder zu `/storefront/profile`
4. Endlosschleife

### Fix

**`src/pages/CustomerProfile.tsx`**: Loading-State abfragen bevor redirected wird.

```typescript
const { user, loading } = useAuth();

useEffect(() => {
  if (loading) return; // Wait for auth to load
  if (!user) { navigate('/login'); return; }
  // ... rest of loadData
}, [user, loading]);
```

**Gleichen Check auch in `src/pages/Storefront.tsx`** falls dort ein ähnliches Redirect-Pattern existiert.

### Dateien
- `src/pages/CustomerProfile.tsx` — Loading-Guard vor Redirect hinzufügen

