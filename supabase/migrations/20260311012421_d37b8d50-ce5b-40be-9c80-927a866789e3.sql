
CREATE OR REPLACE FUNCTION public.auto_create_api_key_on_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create if no API key exists yet for this user
  INSERT INTO public.customer_api_keys (customer_id)
  VALUES (NEW.user_id)
  ON CONFLICT (customer_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_api_key_on_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_api_key_on_reservation();
