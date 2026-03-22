INSERT INTO public.subscription_plans (name, description, monthly_price, annual_price, max_professionals, max_units, max_bookings_per_month, features_json)
VALUES
  ('Básico', 'Plano essencial para começar', 99.90, 999.00, 3, 1, 200, '["booking", "services", "professionals"]'::jsonb),
  ('Profissional', 'Para salões em crescimento', 199.90, 1999.00, 10, 3, 1000, '["booking", "services", "professionals", "gallery", "testimonials", "financial", "reports"]'::jsonb),
  ('Enterprise', 'Sem limites, suporte premium', 499.90, 4999.00, -1, -1, -1, '["booking", "services", "professionals", "gallery", "testimonials", "financial", "reports", "commission", "multi_unit", "pwa", "whatsapp", "video"]'::jsonb)