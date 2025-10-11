CREATE TABLE IF NOT EXISTS public.engineers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text UNIQUE NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'engineer',
    weekly_hour_requirement integer DEFAULT 40,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.service_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.daily_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engineer_id uuid REFERENCES public.engineers(id) ON DELETE CASCADE,
    activity_date date NOT NULL,
    customer_name text,
    site_location text,
    total_hours numeric(4,2) DEFAULT 0,
    notes text,
    documents jsonb DEFAULT '[]'::jsonb,
    submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(engineer_id, activity_date)
);

CREATE TABLE IF NOT EXISTS public.activity_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_activity_id uuid REFERENCES public.daily_activities(id) ON DELETE CASCADE,
    service_category_id uuid REFERENCES public.service_categories(id) ON DELETE CASCADE,
    hours numeric(4,2) NOT NULL DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.service_categories (name, description) VALUES
('Installation', 'Equipment installation and setup'),
('Maintenance', 'Routine maintenance and servicing'),
('Repair', 'Equipment repair and troubleshooting'),
('Calibration', 'Instrument calibration services'),
('Training', 'Customer training and support'),
('Consultation', 'Technical consultation services'),
('Documentation', 'Technical documentation and reporting'),
('Travel', 'Travel time to customer sites'),
('Administrative', 'Administrative tasks and paperwork'),
('Emergency Response', 'Emergency service calls'),
('Quality Assurance', 'Quality control and testing'),
('Software Support', 'Software installation and support'),
('Commissioning', 'System commissioning and validation'),
('Inspection', 'Equipment inspection services'),
('Research & Development', 'R&D activities and testing')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_daily_activities_engineer_date ON public.daily_activities(engineer_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON public.daily_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_hours_daily_activity ON public.activity_hours(daily_activity_id);

alter publication supabase_realtime add table engineers;
alter publication supabase_realtime add table service_categories;
alter publication supabase_realtime add table daily_activities;
alter publication supabase_realtime add table activity_hours;