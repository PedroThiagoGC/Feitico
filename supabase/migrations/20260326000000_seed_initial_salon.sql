-- Seed: insere o salão inicial se ainda não existir nenhum registro ativo.
-- Edite os valores abaixo pelo painel do Supabase (Table Editor) após o deploy.
INSERT INTO public.salons (
  name,
  active,
  primary_color,
  about_text,
  address,
  phone,
  whatsapp,
  opening_hours
)
SELECT
  'Feitiço Salão',
  true,
  '#c9a96e',
  'Transforme seu visual com os melhores profissionais. Agende agora e viva uma experiência premium.',
  'Informe o endereço do salão',
  NULL,
  NULL,
  '{"seg-sex": "09:00 – 19:00", "sab": "09:00 – 17:00", "dom": "Fechado"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.salons LIMIT 1);
