-- Al Furqan account data. Public wrappers enforce live, verified sessions in private helpers.
create schema if not exists af_private;
revoke all on schema af_private from public, anon;
grant usage on schema af_private to authenticated;
create table public.af_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name)<=80),
 status text not null default 'active' check (status in ('active','suspended')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_seen_at timestamptz
);
alter table public.af_profiles enable row level security;
revoke all on public.af_profiles from public, anon, authenticated;
grant select on public.af_profiles to authenticated;
create index af_profiles_created on public.af_profiles(created_at desc,id);
create table af_private.admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table af_private.owner_emails(email text primary key check(email=lower(email)));
create table af_private.audit(id bigint generated always as identity primary key,actor_id uuid not null references auth.users(id),target_id uuid references auth.users(id),action text not null,reason text not null default '' check(char_length(reason)<=250),created_at timestamptz not null default now());
alter table af_private.admins enable row level security;
alter table af_private.owner_emails enable row level security;
alter table af_private.audit enable row level security;
revoke all on all tables in schema af_private from public,anon,authenticated;
create index af_audit_created on af_private.audit(created_at desc);
create index af_audit_actor on af_private.audit(actor_id);
create index af_audit_target on af_private.audit(target_id);
create function af_private.sync_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.af_profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),80)) on conflict(id) do nothing;
 if new.email_confirmed_at is not null and exists(select 1 from af_private.owner_emails where email=lower(new.email)) then
  insert into af_private.admins(user_id) values(new.id) on conflict(user_id) do nothing;
 end if;
 return new;
end;$$;
revoke all on function af_private.sync_auth_user() from public,anon,authenticated;
create trigger af_user_created after insert on auth.users for each row execute function af_private.sync_auth_user();
create trigger af_user_verified after update of email_confirmed_at on auth.users for each row execute function af_private.sync_auth_user();
create function af_private.gate(admin_required boolean default false) returns uuid language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions s where s.id=sid and s.user_id=uid and (s.not_after is null or s.not_after>now())) then raise exception 'A live sign-in session is required' using errcode='28000'; end if;
 if not exists(select 1 from auth.users u where u.id=uid and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now())) then raise exception 'Verify your email before continuing' using errcode='42501'; end if;
 if not exists(select 1 from public.af_profiles p where p.id=uid and p.status='active') then raise exception 'Account access is suspended. Contact the site administrator.' using errcode='42501'; end if;
 if admin_required and not exists(select 1 from af_private.admins a where a.user_id=uid) then raise exception 'Administrator access is required' using errcode='42501'; end if;
 return uid;
end;$$;
revoke all on function af_private.gate(boolean) from public,anon,authenticated;
grant execute on function af_private.gate(boolean) to authenticated;
create policy af_profile_self_read on public.af_profiles for select to authenticated using(id=(select af_private.gate(false)));
create function af_private.me() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(false); result jsonb;
begin
 update public.af_profiles set last_seen_at=now() where id=uid;
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'email',u.email,'email_verified',u.email_confirmed_at is not null,'created_at',p.created_at,'status',p.status,'is_admin',exists(select 1 from af_private.admins a where a.user_id=uid)) into result from public.af_profiles p join auth.users u on u.id=p.id where p.id=uid;
 return result;
end;$$;
create function public.af_me() returns jsonb language sql security invoker set search_path='' as $$ select af_private.me(); $$;
create function af_private.update_profile(p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(false);
begin
 if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then raise exception 'Name must contain 1 to 80 characters' using errcode='22023'; end if;
 update public.af_profiles set display_name=btrim(p_name),updated_at=now() where id=uid;
 return jsonb_build_object('ok',true);
end;$$;
create function public.af_update_profile(p_name text) returns jsonb language sql security invoker set search_path='' as $$select af_private.update_profile(p_name);$$;
create function af_private.admin_users(p_query text default '',p_page integer default 1) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(true); result jsonb; total bigint;
begin
 if char_length(coalesce(p_query,''))>160 or p_page<1 or p_page>20000 then raise exception 'Invalid search or page' using errcode='22023'; end if;
 select count(*) into total from public.af_profiles p join auth.users u on u.id=p.id where coalesce(p_query,'')='' or strpos(lower(p.display_name||' '||coalesce(u.email,'')),lower(p_query))>0;
 select jsonb_build_object('total',total,'page',p_page,'per_page',25,'stats',jsonb_build_object('total',(select count(*) from public.af_profiles),'active',(select count(*) from public.af_profiles where status='active'),'suspended',(select count(*) from public.af_profiles where status='suspended'),'verified',(select count(*) from auth.users where email_confirmed_at is not null)),'users',coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)) into result from (
 select p.id,p.display_name,u.email,p.status,p.created_at,p.last_seen_at,u.last_sign_in_at,(u.email_confirmed_at is not null) as email_verified,exists(select 1 from af_private.admins a where a.user_id=p.id) as is_admin from public.af_profiles p join auth.users u on u.id=p.id
 where coalesce(p_query,'')='' or strpos(lower(p.display_name||' '||coalesce(u.email,'')),lower(p_query))>0 order by p.created_at desc,p.id limit 25 offset (p_page-1)*25
 )q;
 return result;
end;$$;
create function public.af_admin_users(p_query text default '',p_page integer default 1) returns jsonb language sql security invoker set search_path='' as $$select af_private.admin_users(p_query,p_page);$$;
create function af_private.admin_status(p_user uuid,p_status text,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(true); old_status text;
begin
 if p_status not in ('active','suspended') or p_status is null or char_length(coalesce(p_reason,''))>250 then raise exception 'Invalid status or reason' using errcode='22023'; end if;
 if p_user=uid or exists(select 1 from af_private.admins where user_id=p_user) then raise exception 'Administrator accounts cannot be suspended here' using errcode='42501'; end if;
 select status into old_status from public.af_profiles where id=p_user for update;
 if not found then raise exception 'Account not found' using errcode='22023'; end if;
 if old_status<>p_status then
 update public.af_profiles set status=p_status,updated_at=now() where id=p_user;
 insert into af_private.audit(actor_id,target_id,action,reason) values(uid,p_user,'account_'||p_status,coalesce(p_reason,''));
 end if;
 return jsonb_build_object('ok',true,'status',p_status);
end;$$;
create function public.af_admin_status(p_user uuid,p_status text,p_reason text default '') returns jsonb language sql security invoker set search_path='' as $$select af_private.admin_status(p_user,p_status,p_reason);$$;
create function af_private.admin_audit() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(true); result jsonb;
begin
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into result from (select a.id,a.action,a.reason,a.created_at,a.target_id,coalesce(u.email,'') as target_email from af_private.audit a left join auth.users u on u.id=a.target_id order by a.created_at desc,a.id desc limit 50)q;
 return result;
end;$$;
create function public.af_admin_audit() returns jsonb language sql security invoker set search_path='' as $$select af_private.admin_audit();$$;
revoke all on function af_private.me(),af_private.update_profile(text),af_private.admin_users(text,integer),af_private.admin_status(uuid,text,text),af_private.admin_audit() from public,anon,authenticated;
grant execute on function af_private.me(),af_private.update_profile(text),af_private.admin_users(text,integer),af_private.admin_status(uuid,text,text),af_private.admin_audit() to authenticated;
revoke all on function public.af_me(),public.af_update_profile(text),public.af_admin_users(text,integer),public.af_admin_status(uuid,text,text),public.af_admin_audit() from public,anon,authenticated;
grant execute on function public.af_me(),public.af_update_profile(text),public.af_admin_users(text,integer),public.af_admin_status(uuid,text,text),public.af_admin_audit() to authenticated;
