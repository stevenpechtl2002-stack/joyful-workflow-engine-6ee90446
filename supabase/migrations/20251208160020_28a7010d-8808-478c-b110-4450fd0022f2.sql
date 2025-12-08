-- Add policies to explicitly block anonymous access
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to documents" 
ON public.documents 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to user_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.role() = 'authenticated');