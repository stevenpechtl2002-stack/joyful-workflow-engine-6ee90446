-- Add INSERT policy for notifications - only admins and system (via SECURITY DEFINER functions) can create notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));