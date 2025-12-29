-- Create table to track numbers that need automatic cancellation
CREATE TABLE public.pending_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activation_id TEXT NOT NULL,
  server_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.pending_cancellations ENABLE ROW LEVEL SECURITY;

-- System can manage pending cancellations
CREATE POLICY "System can insert pending cancellations" 
ON public.pending_cancellations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update pending cancellations" 
ON public.pending_cancellations 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete pending cancellations" 
ON public.pending_cancellations 
FOR DELETE 
USING (true);

CREATE POLICY "System can view pending cancellations" 
ON public.pending_cancellations 
FOR SELECT 
USING (true);

-- Index for faster lookups
CREATE INDEX idx_pending_cancellations_status ON public.pending_cancellations(status);
CREATE INDEX idx_pending_cancellations_created_at ON public.pending_cancellations(created_at);