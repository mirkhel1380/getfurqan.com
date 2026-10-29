-- A write-only public contact endpoint and an inbox protected by the existing live admin gate.
create schema af_contact;
revoke all on schema af_contact from public,anon,authenticated;
grant usage on schema af_contact to anon,authenticated;
create table af_contact.messages(
 id uuid primary key,
 name text not null check(char_length(name) between 1 and 80),
 email text not null check(char_length(email) between 3 and 254),
 subject text not null check(char_length(subject) between 3 and 160),
 message text not null check(char_length(message) between 10 and 5000),
 language text not null default 'en',
 status text not null default 'new' check(status in ('new','read')),
 created_at timestamptz not null default now(),
 read_at timestamptz,
 read_by uuid references auth.users(id) on delete set null
);
alter table af_contact.messages enable row level security;
revoke all on af_contact.messages from public,anon,authenticated;
create index af_contact_created on af_contact.messages(created_at desc,id);
create index af_contact_email_created on af_contact.messages(email,created_at desc);
create index af_contact_new on af_contact.messages(created_at desc) where status='new';
create index af_contact_reader on af_contact.messages(read_by) where read_by is not null;
-- Public submission is deliberately allowed without an account. It can only append
-- validated messages; it never returns any stored message or account information.
create function af_contact.submit(p_request_id uuid,p_name text,p_email text,p_subject text,p_message text,p_language text default 'en',p_website text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare n text:=btrim(p_name);e text:=lower(btrim(p_email));s text:=btrim(p_subject);m text:=btrim(p_message);uid uuid:=auth.uid();existing af_contact.messages%rowtype;
begin
 -- Visitors do not need an account. If signed in, validate the live session as usual.
 if uid is not null then perform af_private.gate(false);end if;
 if char_length(coalesce(p_website,''))>0 then raise exception 'Please leave the website field empty' using errcode='22023';end if;
 if p_request_id is null or n is null or char_length(n) not between 1 and 80 or n ~ '[[:cntrl:]]' or
 e is null or char_length(e) not between 3 and 254 or e !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or
 s is null or char_length(s) not between 3 and 160 or s ~ '[[:cntrl:]]' or
 m is null or char_length(m) not between 10 and 5000 then
 raise exception 'Check your name, email, subject and message' using errcode='22023';end if;
 if p_language is null or p_language not in ('en','prs','ps','fa','de','nl','fr','it','ur','tr','es','pt','id') then raise exception 'Invalid language' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(1780410601);
 select * into existing from af_contact.messages where id=p_request_id;
 if found then
  if existing.name=n and existing.email=e and existing.subject=s and existing.message=m then return jsonb_build_object('ok',true,'reference',p_request_id);end if;
  raise exception 'Please retry this message' using errcode='22023';
 end if;
 if (select count(*) from af_contact.messages where email=e and created_at>now()-interval '1 hour')>=3 or
 (select count(*) from af_contact.messages where email=e and created_at>now()-interval '1 day')>=10 or
 (select count(*) from af_contact.messages where created_at>now()-interval '1 hour')>=100 or
 (select count(*) from af_contact.messages where created_at>now()-interval '1 day')>=500 then
 raise exception 'Too many messages. Please try again later or email contact@getfurqan.online' using errcode='P0001';end if;
 insert into af_contact.messages(id,name,email,subject,message,language) values(p_request_id,n,e,s,m,p_language);
 return jsonb_build_object('ok',true,'reference',p_request_id);
end;$$;
create function public.af_contact_submit(p_request_id uuid,p_name text,p_email text,p_subject text,p_message text,p_language text default 'en',p_website text default '') returns jsonb
language sql security invoker set search_path='' as $$select af_contact.submit(p_request_id,p_name,p_email,p_subject,p_message,p_language,p_website);$$;
create function af_contact.inbox(p_page integer default 1,p_unread boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(true);result jsonb;
begin
 if p_page is null or p_page<1 or p_page>20000 or p_unread is null then raise exception 'Invalid page' using errcode='22023';end if;
 select jsonb_build_object('total',(select count(*) from af_contact.messages where not p_unread or status='new'),'unread',(select count(*) from af_contact.messages where status='new'),'page',p_page,'per_page',20,'messages',coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)) into result from (
 select id,name,email,subject,message,language,status,created_at,read_at from af_contact.messages where not p_unread or status='new' order by created_at desc,id desc limit 20 offset (p_page-1)*20)q;
 return result;
end;$$;
create function public.af_contact_inbox(p_page integer default 1,p_unread boolean default false) returns jsonb language sql security invoker set search_path='' as $$select af_contact.inbox(p_page,p_unread);$$;
create function af_contact.mark(p_id uuid,p_read boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(true);
begin
 if p_id is null or p_read is null then raise exception 'Invalid message' using errcode='22023';end if;
 update af_contact.messages set status=case when p_read then 'read' else 'new' end,read_at=case when p_read then now() else null end,read_by=case when p_read then uid else null end where id=p_id;
 if not found then raise exception 'Message not found' using errcode='22023';end if;
 return jsonb_build_object('ok',true);
end;$$;
create function public.af_contact_mark(p_id uuid,p_read boolean) returns jsonb language sql security invoker set search_path='' as $$select af_contact.mark(p_id,p_read);$$;
revoke all on function af_contact.submit(uuid,text,text,text,text,text,text),af_contact.inbox(integer,boolean),af_contact.mark(uuid,boolean) from public,anon,authenticated;
revoke all on function public.af_contact_submit(uuid,text,text,text,text,text,text),public.af_contact_inbox(integer,boolean),public.af_contact_mark(uuid,boolean) from public,anon,authenticated;
grant execute on function af_contact.submit(uuid,text,text,text,text,text,text),public.af_contact_submit(uuid,text,text,text,text,text,text) to anon,authenticated;
grant execute on function af_contact.inbox(integer,boolean),af_contact.mark(uuid,boolean),public.af_contact_inbox(integer,boolean),public.af_contact_mark(uuid,boolean) to authenticated;
