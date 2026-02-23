
-- Update handle_new_user() to automatically create API key
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  -- Create customer record (DSGVO-konform: nur notwendige Daten)
  INSERT INTO public.customers (id, email, company_name, plan, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'company_name',
    'starter',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Automatisch API-Key erstellen
  INSERT INTO public.customer_api_keys (customer_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Willkommen!', 'Ihr Account wurde erfolgreich erstellt. Erkunden Sie Ihr Dashboard.', 'success');
  
  RETURN NEW;
END;
$function$;

-- Backfill: API-Keys für bestehende Kunden ohne Key erstellen
INSERT INTO public.customer_api_keys (customer_id)
SELECT id FROM public.customers
WHERE id NOT IN (SELECT customer_id FROM public.customer_api_keys);
