-- Add cancel_after field to track when we can cancel (respecting cancel_disable_time)
ALTER TABLE public.pending_cancellations 
ADD COLUMN cancel_after TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add service_id for reference
ALTER TABLE public.pending_cancellations 
ADD COLUMN service_id UUID;

-- Add error_message for debugging
ALTER TABLE public.pending_cancellations 
ADD COLUMN error_message TEXT;