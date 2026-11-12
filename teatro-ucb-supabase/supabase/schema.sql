-- Ejecuta este script en Supabase: SQL Editor > New query > Run

-- 1) Perfiles de usuario (extiende auth.users, donde Supabase guarda email y contraseña cifrada)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- 2) Reservas de butacas (reemplaza el localStorage)
create table if not exists public.reservas (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  funcion_id text not null,
  butaca text not null,
  created_at timestamptz not null default now(),
  unique (funcion_id, butaca)   -- una butaca no se puede reservar dos veces
);

-- 3) Al registrarse un usuario, crear su perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Seguridad por fila (RLS)
alter table public.profiles enable row level security;
alter table public.reservas enable row level security;

create policy "Ver mi perfil" on public.profiles
  for select using (auth.uid() = id);
create policy "Editar mi perfil" on public.profiles
  for update using (auth.uid() = id);

-- Todos pueden ver qué butacas están ocupadas (para pintar el mapa)
create policy "Ver reservas" on public.reservas
  for select using (true);
-- Solo usuarios con sesión pueden reservar, y solo a su nombre
create policy "Crear mis reservas" on public.reservas
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Cancelar mis reservas" on public.reservas
  for delete to authenticated using (auth.uid() = user_id);
