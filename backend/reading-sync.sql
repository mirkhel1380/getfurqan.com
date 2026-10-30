-- Private, opt-in per-account reading records. No user ID is accepted from clients.
create schema af_reading;
revoke all on schema af_reading from public,anon,authenticated;
grant usage on schema af_reading to authenticated;
create table af_reading.settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table af_reading.items (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('bookmark','read','goal','resume','note','reflection')),
 item_key text not null check(char_length(item_key) between 1 and 100),
 value jsonb not null,
 revision bigint not null default 1 check(revision between 1 and 9007199254740991),
 updated_at timestamptz not null default now(),
 primary key(user_id,kind,item_key)
);
alter table af_reading.settings enable row level security;
alter table af_reading.items enable row level security;
revoke all on af_reading.settings,af_reading.items from public,anon,authenticated;

create function af_reading.valid_verse(k text) returns boolean language sql immutable security invoker set search_path='' as $$
 select coalesce(k ~ '^[1-9][0-9]{0,2}:[1-9][0-9]{0,2}$' and split_part(k,':',1)::int between 1 and 114 and split_part(k,':',2)::int between 1 and 286,false);
$$;
create function af_reading.validate_op(k text,i text,v jsonb) returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare d date; t text;
begin
 if k is null or i is null or v is null or char_length(i)>100 then return false;end if;
 if k='goal' then return i='goal' and (v='null'::jsonb or (jsonb_typeof(v)='number' and v::text ~ '^[0-9]{1,4}$' and (v::text)::int between 1 and 1000));end if;
 if k='resume' then
  if i<>'resume' then return false;end if;
  if v='null'::jsonb then return true;end if;
  if jsonb_typeof(v)<>'object' or jsonb_typeof(v->'key')<>'string' or jsonb_typeof(v->'translation')<>'string' or jsonb_typeof(v->'updatedAt')<>'string' or nullif(v->>'updatedAt','') is null or not af_reading.valid_verse(v->>'key') or coalesce(v->>'translation','') !~ '^[a-z0-9_]{1,80}$' or char_length(coalesce(v->>'updatedAt',''))>40 then return false;end if;
  perform (v->>'updatedAt')::timestamptz;
  return v ?& array['key','translation','updatedAt'] and (select count(*)=3 from jsonb_object_keys(v));
 end if;
 if k='read' then
  if i !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[|][1-9][0-9]{0,2}:[1-9][0-9]{0,2}$' then return false;end if;
  d:=split_part(i,'|',1)::date;
  return to_char(d,'YYYY-MM-DD')=split_part(i,'|',1) and af_reading.valid_verse(split_part(i,'|',2)) and v in ('true'::jsonb,'null'::jsonb);
 end if;
 if not af_reading.valid_verse(i) then return false;end if;
 if k='bookmark' then return v in ('true'::jsonb,'null'::jsonb);end if;
 if k in ('note','reflection') then return v='null'::jsonb or (jsonb_typeof(v)='string' and char_length(v#>>'{}')<=5000);end if;
 return false;
exception when others then return false;
end;$$;

create function af_reading.get_data() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(false);result jsonb;
begin
 select jsonb_build_object('enabled',coalesce((select enabled from af_reading.settings where user_id=uid),false),'items',coalesce((select jsonb_agg(jsonb_build_object('kind',kind,'key',item_key,'value',value,'revision',revision) order by kind,item_key) from af_reading.items where user_id=uid),'[]'::jsonb)) into result;
 return result;
end;$$;
create function af_reading.set_enabled(p_enabled boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(false);
begin
 if p_enabled is null then raise exception 'Invalid sync setting' using errcode='22023';end if;
 insert into af_reading.settings(user_id,enabled) values(uid,p_enabled) on conflict(user_id) do update set enabled=excluded.enabled,updated_at=now();
 return jsonb_build_object('enabled',p_enabled);
end;$$;
create function af_reading.patch(p_ops jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=af_private.gate(false);op jsonb;k text;i text;v jsonb;b bigint;r af_reading.items%rowtype;outcomes jsonb:='[]';active boolean;item_count int;used_bytes bigint;old_bytes int;
begin
 if p_ops is null or jsonb_typeof(p_ops)<>'array' or jsonb_array_length(p_ops) not between 1 and 100 or octet_length(p_ops::text)>600000 then raise exception 'Invalid reading changes' using errcode='22023';end if;
 select enabled into active from af_reading.settings where user_id=uid for update;
 if active is distinct from true then raise exception 'Private sync is paused' using errcode='42501';end if;
 select count(*),coalesce(sum(octet_length(value::text)),0) into item_count,used_bytes from af_reading.items where user_id=uid;
 for op in select * from jsonb_array_elements(p_ops) loop
  k:=op->>'kind';i:=op->>'key';v:=op->'value';
  if jsonb_typeof(op)<>'object' or not af_reading.validate_op(k,i,v) or jsonb_typeof(op->'base')<>'number' or coalesce(op->>'base','') !~ '^[0-9]{1,15}$' then raise exception 'Invalid reading change' using errcode='22023';end if;
  b:=(op->>'base')::bigint;
  select * into r from af_reading.items where user_id=uid and kind=k and item_key=i;
  if found then
   if r.value=v then
    outcomes:=outcomes||jsonb_build_array(jsonb_build_object('kind',k,'key',i,'value',r.value,'revision',r.revision,'ok',true));continue;
   end if;
   if r.revision<>b then
    outcomes:=outcomes||jsonb_build_array(jsonb_build_object('kind',k,'key',i,'value',r.value,'revision',r.revision,'ok',false));continue;
   end if;
   old_bytes:=octet_length(r.value::text);
  else
   if b<>0 then
    outcomes:=outcomes||jsonb_build_array(jsonb_build_object('kind',k,'key',i,'value',null,'revision',0,'ok',false));continue;
   end if;
   if v='null'::jsonb then
    outcomes:=outcomes||jsonb_build_array(jsonb_build_object('kind',k,'key',i,'value',null,'revision',0,'ok',true));continue;
   end if;
   old_bytes:=0;item_count:=item_count+1;
  end if;
  used_bytes:=used_bytes-old_bytes+octet_length(v::text);
  if item_count>20000 or used_bytes>2000000 then raise exception 'Account reading storage is full. Keep a copy of your notes and contact us.' using errcode='54000';end if;
  insert into af_reading.items(user_id,kind,item_key,value) values(uid,k,i,v)
  on conflict(user_id,kind,item_key) do update set value=excluded.value,revision=af_reading.items.revision+1,updated_at=now()
  returning * into r;
  outcomes:=outcomes||jsonb_build_array(jsonb_build_object('kind',k,'key',i,'value',r.value,'revision',r.revision,'ok',true));
 end loop;
 return jsonb_build_object('items',outcomes);
end;$$;
create function public.af_reading_get() returns jsonb language sql security invoker set search_path='' as $$select af_reading.get_data();$$;
create function public.af_reading_enabled(p_enabled boolean) returns jsonb language sql security invoker set search_path='' as $$select af_reading.set_enabled(p_enabled);$$;
create function public.af_reading_patch(p_ops jsonb) returns jsonb language sql security invoker set search_path='' as $$select af_reading.patch(p_ops);$$;
revoke all on all functions in schema af_reading from public,anon,authenticated;
grant execute on function af_reading.get_data(),af_reading.set_enabled(boolean),af_reading.patch(jsonb) to authenticated;
revoke all on function public.af_reading_get(),public.af_reading_enabled(boolean),public.af_reading_patch(jsonb) from public,anon,authenticated;
grant execute on function public.af_reading_get(),public.af_reading_enabled(boolean),public.af_reading_patch(jsonb) to authenticated;
