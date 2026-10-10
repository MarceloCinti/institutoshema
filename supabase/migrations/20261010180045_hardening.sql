-- =====================================================================
-- Instituto Shema — endurecimiento de seguridad y rendimiento
-- (resultado de la auditoría de Supabase: advisors + pruebas de RLS)
-- =====================================================================

-- 1) La API sólo puede LEER (según RLS). Todas las escrituras sensibles se
--    hacen desde el servidor con service_role; los alumnos sólo editan
--    algunas columnas de su propio perfil.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;
grant update (full_name, phone, document_number, city) on public.profiles to authenticated;
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- 2) La función del trigger no debe poder llamarse desde la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- (public.is_admin() queda ejecutable a propósito: la usan las políticas RLS
--  y sólo informa si quien consulta es administrador.)

-- 3) Políticas: evaluar auth.uid()/is_admin() una sola vez por consulta.
alter policy "perfil propio" on public.profiles to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
alter policy "editar perfil propio" on public.profiles to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy "libros publicados" on public.books
  using (published or (select public.is_admin()));
alter policy "cursos publicados" on public.courses
  using (published or (select public.is_admin()));
alter policy "modulos de cursos publicados" on public.modules
  using (exists (select 1 from public.courses c where c.id = course_id and (c.published or (select public.is_admin()))));
alter policy "clases de mis cursos" on public.lessons to authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = module_id and e.user_id = (select auth.uid())
  ));
alter policy "mis pedidos" on public.orders to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "mis libros" on public.book_purchases to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "mis cursos" on public.enrollments to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "mi progreso" on public.lesson_progress to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "mis examenes" on public.quiz_attempts to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
alter policy "mis certificados" on public.certificates to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- 4) Índices para las claves foráneas (reportes de asistencia y borrados en cascada).
create index if not exists enrollments_course_id_idx on public.enrollments (course_id);
create index if not exists enrollments_order_id_idx on public.enrollments (order_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);
create index if not exists book_purchases_book_id_idx on public.book_purchases (book_id);
create index if not exists book_purchases_order_id_idx on public.book_purchases (order_id);
create index if not exists certificates_course_id_idx on public.certificates (course_id);
create index if not exists quiz_attempts_module_id_idx on public.quiz_attempts (module_id);

-- 5) Límites de archivos que suben los usuarios.
update storage.buckets
  set file_size_limit = 10485760, allowed_mime_types = array['image/*', 'application/pdf']
  where id = 'receipts';
update storage.buckets
  set file_size_limit = 10485760, allowed_mime_types = array['image/*']
  where id = 'covers';
