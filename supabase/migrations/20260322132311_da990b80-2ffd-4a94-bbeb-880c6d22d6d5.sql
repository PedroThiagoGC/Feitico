INSERT INTO public.salons (name, slug, active, about_text, phone, whatsapp, address, instagram, primary_color, opening_hours)
VALUES (
  'Studio Premium',
  'studio-premium',
  true,
  'Somos mais do que um salão — somos um espaço de transformação e bem-estar. Com profissionais altamente qualificados e apaixonados pelo que fazem, nossa missão é proporcionar uma experiência única, combinando técnica, tendência e cuidado personalizado.',
  '(11) 99999-0000',
  '5511999990000',
  'Rua da Beleza, 123 - Centro, São Paulo - SP',
  '@studiopremium',
  '#C6A85C',
  '{"mon":"09:00 - 19:00","tue":"09:00 - 19:00","wed":"09:00 - 19:00","thu":"09:00 - 20:00","fri":"09:00 - 20:00","sat":"09:00 - 17:00","sun":"closed"}'::jsonb
);

INSERT INTO public.services (salon_id, name, description, price, duration, buffer_minutes, category, is_combo, active, sort_order)
SELECT s.id, v.name, v.description, v.price, v.duration, v.buffer_minutes, v.category, v.is_combo, true, v.sort_order
FROM salons s,
(VALUES
  ('Corte Masculino', 'Corte moderno com acabamento perfeito', 60.00, 30, 5, 'Cortes', false, 1),
  ('Corte Feminino', 'Corte personalizado com lavagem e finalização', 90.00, 45, 5, 'Cortes', false, 2),
  ('Barba', 'Barba feita com navalha e toalha quente', 40.00, 20, 5, 'Barba', false, 3),
  ('Coloração', 'Coloração profissional com produtos premium', 150.00, 90, 10, 'Coloração', false, 4),
  ('Escova Progressiva', 'Alisamento com tratamento capilar', 200.00, 120, 10, 'Tratamentos', false, 5),
  ('Hidratação Capilar', 'Tratamento intensivo de hidratação', 80.00, 40, 5, 'Tratamentos', false, 6),
  ('Combo Corte + Barba', 'Corte masculino completo com barba', 90.00, 50, 5, 'Combos', true, 7),
  ('Combo Noiva', 'Penteado, maquiagem e tratamento especial', 450.00, 180, 15, 'Combos', true, 8)
) AS v(name, description, price, duration, buffer_minutes, category, is_combo, sort_order)
WHERE s.slug = 'studio-premium';

INSERT INTO public.testimonials (salon_id, author_name, content, rating, active)
SELECT s.id, v.author_name, v.content, v.rating, true
FROM salons s,
(VALUES
  ('Maria Silva', 'Melhor salão da região! Atendimento impecável e resultado incrível. Recomendo demais!', 5),
  ('João Santos', 'Profissionais muito capacitados. Meu corte ficou exatamente como eu queria.', 5),
  ('Ana Oliveira', 'Ambiente sofisticado e acolhedor. A hidratação que fiz deixou meu cabelo perfeito.', 4)
) AS v(author_name, content, rating)
WHERE s.slug = 'studio-premium';