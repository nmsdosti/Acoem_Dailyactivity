-- Add status field to daily_activities for Planning/Executed
ALTER TABLE public.daily_activities 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'executed' CHECK (status IN ('planning', 'executed'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  message text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('all', 'specific')),
  recipient_engineer_id uuid REFERENCES public.engineers(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now()
);

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_engineer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
