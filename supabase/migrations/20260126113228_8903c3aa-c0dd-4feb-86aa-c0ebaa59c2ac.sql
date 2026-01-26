-- Create table for shift exceptions (time-off blocks within working hours)
CREATE TABLE public.shift_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own shift exceptions"
  ON public.shift_exceptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shift exceptions"
  ON public.shift_exceptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shift exceptions"
  ON public.shift_exceptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shift exceptions"
  ON public.shift_exceptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create unique constraint to prevent overlapping exceptions
CREATE UNIQUE INDEX shift_exceptions_unique_idx 
  ON public.shift_exceptions (staff_member_id, exception_date, start_time, end_time);

-- Add updated_at trigger
CREATE TRIGGER update_shift_exceptions_updated_at
  BEFORE UPDATE ON public.shift_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();