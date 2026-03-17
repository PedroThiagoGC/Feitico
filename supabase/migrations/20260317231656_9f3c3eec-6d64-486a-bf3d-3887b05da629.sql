
-- Add buffer_minutes to services
ALTER TABLE services ADD COLUMN buffer_minutes integer NOT NULL DEFAULT 0;
ALTER TABLE services ADD CONSTRAINT services_duration_multiple_5 CHECK (duration % 5 = 0);
ALTER TABLE services ADD CONSTRAINT services_buffer_multiple_5 CHECK (buffer_minutes % 5 = 0);

-- Create professionals table
CREATE TABLE professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  commission_type text NOT NULL DEFAULT 'percentage',
  commission_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create professional_services (N:N)
CREATE TABLE professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price numeric,
  custom_duration_minutes integer,
  custom_buffer_minutes integer,
  commission_override_type text,
  commission_override_value numeric,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(professional_id, service_id),
  CONSTRAINT ps_custom_duration_multiple_5 CHECK (custom_duration_minutes IS NULL OR custom_duration_minutes % 5 = 0),
  CONSTRAINT ps_custom_buffer_multiple_5 CHECK (custom_buffer_minutes IS NULL OR custom_buffer_minutes % 5 = 0)
);

-- Create professional_availability (recurring weekly)
CREATE TABLE professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean NOT NULL DEFAULT true
);

-- Create professional_exceptions (date-specific overrides)
CREATE TABLE professional_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  type text NOT NULL DEFAULT 'day_off',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Update bookings with professional and financial fields
ALTER TABLE bookings ADD COLUMN professional_id uuid REFERENCES professionals(id);
ALTER TABLE bookings ADD COLUMN total_buffer_minutes integer NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN total_occupied_minutes integer NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN commission_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN profit_amount numeric NOT NULL DEFAULT 0;

-- RLS for professionals
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active professionals" ON professionals FOR SELECT TO public USING (active = true);
CREATE POLICY "Admin full access professionals" ON professionals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for professional_services
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active professional_services" ON professional_services FOR SELECT TO public USING (active = true);
CREATE POLICY "Admin full access professional_services" ON professional_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for professional_availability
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active professional_availability" ON professional_availability FOR SELECT TO public USING (active = true);
CREATE POLICY "Admin full access professional_availability" ON professional_availability FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for professional_exceptions
ALTER TABLE professional_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read professional_exceptions" ON professional_exceptions FOR SELECT TO public USING (true);
CREATE POLICY "Admin full access professional_exceptions" ON professional_exceptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
