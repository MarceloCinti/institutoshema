-- =====================================================================
-- Instituto Shema — esquema inicial
-- Ejecutar en Supabase: SQL Editor > New query > pegar y "Run"
-- (o con la CLI: supabase db push)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  document_number text,          -- Cédula de identidad (para certificados)
  city text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Catálogo: libros y cursos
-- ---------------------------------------------------------------------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  author text not null default 'Pastor Félix Guerrero',
  description text not null default '',
  price_pyg integer not null default 0 check (price_pyg >= 0),
  pages integer,
  cover_path text,               -- bucket "covers" (público)
  file_path text,                -- bucket "books" (privado, PDF/EPUB)
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text not null default '',
  teacher text not null default 'Pastor Félix Guerrero',
  price_pyg integer not null default 0 check (price_pyg >= 0),
  cover_path text,
  passing_score integer not null default 70 check (passing_score between 1 and 100),
  max_attempts integer not null default 3 check (max_attempts >= 1),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.modules(course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  -- upload: video subido al bucket "videos" | youtube: enlace no listado | live: clase en vivo (Zoom/Meet)
  video_source text not null default 'upload' check (video_source in ('upload', 'youtube', 'live')),
  video_path text,
  video_url text,
  duration_seconds integer not null default 0,
  live_at timestamptz,
  live_url text,
  attendance_code text,          -- código que se dicta en la clase en vivo (nunca visible al alumno)
  created_at timestamptz not null default now()
);
create index on public.lessons(module_id, position);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  question text not null,
  options jsonb not null,        -- ["opción A", "opción B", ...]
  correct_index integer not null,
  position integer not null default 0
);
create index on public.quiz_questions(module_id, position);

-- ---------------------------------------------------------------------
-- Ventas y accesos
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('book', 'course')),
  item_id uuid not null,
  item_title text not null,
  amount_pyg integer not null,
  status text not null default 'pending' check (status in ('pending', 'review', 'paid', 'rejected', 'cancelled')),
  payment_method text not null check (payment_method in ('pagopar', 'transferencia', 'cortesia')),
  provider_ref text,             -- hash de pedido Pagopar
  receipt_path text,             -- comprobante de transferencia (bucket "receipts")
  admin_note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on public.orders(user_id, created_at desc);
create index on public.orders(status);

create table public.book_purchases (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Avance académico
-- ---------------------------------------------------------------------
create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_seconds integer not null default 0,   -- segundos realmente reproducidos (sin adelantar)
  last_position integer not null default 0,
  presence_checks integer not null default 0,   -- confirmaciones "¿Seguís ahí?"
  attended boolean not null default false,
  attended_at timestamptz,
  attendance_method text check (attendance_method in ('video', 'codigo', 'manual')),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts(user_id, module_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_name text not null,
  course_title text not null,
  final_score integer not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Permisos base de la API (algunos proyectos nuevos no los otorgan solos).
-- El acceso real a cada fila lo controlan las políticas RLS de abajo.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select on all tables in schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- Seguridad (RLS). Las escrituras sensibles (pedidos, progreso, exámenes,
-- certificados) se hacen desde el servidor con la service role key.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.orders enable row level security;
alter table public.book_purchases enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;

-- Perfiles: cada uno ve y edita el suyo (sin poder cambiar su rol)
create policy "perfil propio" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "editar perfil propio" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, document_number, city) on public.profiles to authenticated;

-- Catálogo público (sólo lo publicado)
create policy "libros publicados" on public.books for select using (published or public.is_admin());
create policy "cursos publicados" on public.courses for select using (published or public.is_admin());
create policy "modulos de cursos publicados" on public.modules for select using (
  exists (select 1 from public.courses c where c.id = course_id and (c.published or public.is_admin()))
);

-- Clases: sólo alumnos inscriptos. El código de asistencia nunca se expone.
create policy "clases de mis cursos" on public.lessons for select using (
  public.is_admin() or exists (
    select 1 from public.modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = module_id and e.user_id = auth.uid()
  )
);
revoke select on public.lessons from anon, authenticated;
grant select (id, module_id, title, description, position, video_source, duration_seconds, live_at, created_at)
  on public.lessons to authenticated;

-- quiz_questions: sin políticas => sólo accesible desde el servidor (respuestas correctas ocultas)

create policy "mis pedidos" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "mis libros" on public.book_purchases for select using (user_id = auth.uid() or public.is_admin());
create policy "mis cursos" on public.enrollments for select using (user_id = auth.uid() or public.is_admin());
create policy "mi progreso" on public.lesson_progress for select using (user_id = auth.uid() or public.is_admin());
create policy "mis examenes" on public.quiz_attempts for select using (user_id = auth.uid() or public.is_admin());
create policy "mis certificados" on public.certificates for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Almacenamiento
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('books', 'books', false),
  ('videos', 'videos', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Los administradores suben portadas, libros y videos directo desde el navegador
create policy "admin sube contenido" on storage.objects for insert to authenticated
  with check (bucket_id in ('covers', 'books', 'videos') and public.is_admin());
create policy "admin actualiza contenido" on storage.objects for update to authenticated
  using (bucket_id in ('covers', 'books', 'videos') and public.is_admin());
create policy "admin borra contenido" on storage.objects for delete to authenticated
  using (bucket_id in ('covers', 'books', 'videos', 'receipts') and public.is_admin());
create policy "admin lee todo" on storage.objects for select to authenticated
  using (public.is_admin());

-- Los alumnos suben sus comprobantes en su propia carpeta: receipts/<user_id>/...
create policy "alumno sube comprobante" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
