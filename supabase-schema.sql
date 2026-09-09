-- ============================================================
-- Student Management System — Supabase schema
-- ------------------------------------------------------------
-- HOW TO USE:
-- 1. Open your Supabase project: https://wjxcileyccpxxautqxxx.supabase.co
-- 2. Go to SQL Editor -> New query
-- 3. Paste this entire file and click Run
-- 4. Done — the app will work immediately (tables + security + realtime)
--
-- This replaces the old Firebase Firestore structure:
--   Firestore students/{ownerUid}/list/{id}        -> public.students
--   Firestore students/{ownerUid}/members/{uid}    -> public.members
--   Firestore students/{ownerUid}/attendance/...   -> public.attendance_records
--   Firestore users/{uid}                          -> public.users
-- ============================================================

-- ---------- helper: auto-update updated_at ----------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1) users — email -> uid directory (for "add member by email")
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 2) students — one row per student, owned by a workspace owner
-- ============================================================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dept text not null,               -- stores the DEGREE string (same as before)
  year text default '',
  regno text default '',
  mobile text not null,
  email text default '',
  parent_mobile text default '',
  address text default '',
  gender text default 'Male',
  created_at timestamptz default now()
);

create index if not exists students_owner_idx on public.students(owner_id);
create unique index if not exists students_owner_mobile_uidx
  on public.students(owner_id, mobile);

-- ============================================================
-- 3) members — who can access an owner's workspace + their role
-- ============================================================
create table if not exists public.members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text default '',
  role text not null check (role in ('staff', 'viewer')),
  added_at timestamptz default now(),
  primary key (owner_id, uid)
);

create index if not exists members_uid_idx on public.members(uid);
create index if not exists members_owner_idx on public.members(owner_id);

-- ============================================================
-- 4) attendance_records — one row per student per day
-- ============================================================
create table if not exists public.attendance_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  student_id uuid not null references public.students(id) on delete cascade,
  hours jsonb not null default '[true,true,true,true,true]',
  marked_by text default '',
  marked_by_uid uuid,
  updated_at timestamptz default now(),
  primary key (owner_id, date, student_id)
);

create index if not exists attendance_owner_date_idx
  on public.attendance_records(owner_id, date);

drop trigger if exists trg_attendance_updated_at on public.attendance_records;
create trigger trg_attendance_updated_at
  before update on public.attendance_records
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Roles: admin = workspace owner, staff = can add/edit/attendance,
-- viewer = read-only.
-- ============================================================

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.members enable row level security;
alter table public.attendance_records enable row level security;

-- ---------- users ----------
drop policy if exists "Authenticated can look up users by email" on public.users;
create policy "Authenticated can look up users by email"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "Users can create own directory entry" on public.users;
create policy "Users can create own directory entry"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own directory entry" on public.users;
create policy "Users can update own directory entry"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- students ----------
drop policy if exists "Owner has full access to students" on public.students;
create policy "Owner has full access to students"
  on public.students for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Members can read students" on public.students;
create policy "Members can read students"
  on public.students for select
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.owner_id = students.owner_id
        and m.uid = auth.uid()
    )
  );

drop policy if exists "Staff can add students" on public.students;
create policy "Staff can add students"
  on public.students for insert
  to authenticated
  with check (
    exists (
      select 1 from public.members m
      where m.owner_id = students.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  );

drop policy if exists "Staff can edit students" on public.students;
create policy "Staff can edit students"
  on public.students for update
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.owner_id = students.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.owner_id = students.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  );
-- NOTE: only the owner can DELETE (staff/viewer cannot). No delete policy
-- for members = deletes blocked for them, same as the old app.

-- ---------- members ----------
drop policy if exists "Owner manages members" on public.members;
create policy "Owner manages members"
  on public.members for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Members can read own membership" on public.members;
create policy "Members can read own membership"
  on public.members for select
  to authenticated
  using (auth.uid() = uid);

-- ---------- attendance_records ----------
drop policy if exists "Owner has full access to attendance" on public.attendance_records;
create policy "Owner has full access to attendance"
  on public.attendance_records for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Members can read attendance" on public.attendance_records;
create policy "Members can read attendance"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.owner_id = attendance_records.owner_id
        and m.uid = auth.uid()
    )
  );

drop policy if exists "Staff can write attendance" on public.attendance_records;
create policy "Staff can write attendance"
  on public.attendance_records for insert
  to authenticated
  with check (
    exists (
      select 1 from public.members m
      where m.owner_id = attendance_records.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  );

drop policy if exists "Staff can update attendance" on public.attendance_records;
create policy "Staff can update attendance"
  on public.attendance_records for update
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.owner_id = attendance_records.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.owner_id = attendance_records.owner_id
        and m.uid = auth.uid()
        and m.role = 'staff'
    )
  );

-- ============================================================
-- REALTIME — live sync across devices/members (like Firestore
-- onSnapshot). Run once; safe to re-run.
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'students'
  ) then
    alter publication supabase_realtime add table public.students;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table public.members;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'attendance_records'
  ) then
    alter publication supabase_realtime add table public.attendance_records;
  end if;
end
$$;
