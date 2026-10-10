-- Datos iniciales de ejemplo. Editar títulos, precios y archivos desde /admin.
insert into public.books (slug, title, subtitle, description, price_pyg, published) values
  ('libro-1', 'Libro 1 (editar título)', 'Pastor Félix Guerrero',
   'Descripción del primer libro. Reemplazar desde el panel de administración, subir la portada y el archivo PDF.', 80000, false),
  ('libro-2', 'Libro 2 (editar título)', 'Pastor Félix Guerrero',
   'Descripción del segundo libro. Reemplazar desde el panel de administración, subir la portada y el archivo PDF.', 80000, false)
on conflict (slug) do nothing;

with c as (
  insert into public.courses (slug, title, subtitle, description, price_pyg, published)
  values ('fundamentos-de-la-fe', 'Fundamentos de la Fe', 'Curso introductorio',
          'Un recorrido por las raíces hebreas de la fe: el Shemá, las fiestas bíblicas y la Torá.', 250000, false)
  on conflict (slug) do nothing
  returning id
), m as (
  insert into public.modules (course_id, title, position)
  select id, 'Shemá Israel', 1 from c
  returning id
), l as (
  insert into public.lessons (module_id, title, position, video_source, duration_seconds)
  select id, 'Clase 1 — Escucha, Israel (Deuteronomio 6:4)', 1, 'upload', 0 from m
  returning module_id
)
insert into public.quiz_questions (module_id, question, options, correct_index, position)
select distinct module_id, '¿En qué libro de la Biblia se encuentra el Shemá?',
  '["Génesis", "Deuteronomio", "Salmos", "Isaías"]'::jsonb, 1, 1 from l;

-- Para convertir a un usuario en administrador (después de que se registre):
-- update public.profiles set role = 'admin' where email = 'correo@ejemplo.com';
