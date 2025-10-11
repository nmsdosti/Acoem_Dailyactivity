-- Update engineers table to support different roles
ALTER TABLE public.engineers 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'engineer' CHECK (role IN ('engineer', 'admin', 'limited_admin'));

-- Update existing service categories
TRUNCATE TABLE public.service_categories CASCADE;

INSERT INTO public.service_categories (name, description) VALUES
('Onsite Installation', 'Equipment installation and setup at customer site'),
('Warranty Support', 'Warranty-related support and services'),
('Repair and calibration', 'Equipment repair and calibration services'),
('Training', 'Customer training and support'),
('POC', 'Proof of Concept activities'),
('Validation', 'System validation and testing'),
('Routine Office Activity', 'Regular office-based activities'),
('Travel', 'Travel time to customer sites'),
('Alignment service', 'Equipment alignment services'),
('Vibration service', 'Vibration analysis and services'),
('Self Learning', 'Professional development and learning'),
('AMC Regular', 'Annual Maintenance Contract - Regular'),
('AMC Breakdown', 'Annual Maintenance Contract - Breakdown'),
('Pre Sales(Survey/Site Inspection)', 'Pre-sales activities and site surveys')
ON CONFLICT (name) DO NOTHING;

-- Add period fields to daily_activities
ALTER TABLE public.daily_activities 
ADD COLUMN IF NOT EXISTS period_start_date date,
ADD COLUMN IF NOT EXISTS period_end_date date,
ADD COLUMN IF NOT EXISTS installation_start_date date,
ADD COLUMN IF NOT EXISTS installation_end_date date;
