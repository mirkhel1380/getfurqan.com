-- Public aggregate counts. No account identity, email, IP, or reflection text is collected.
create schema if not exists af_metrics;
revoke all on schema af_metrics from public, anon, authenticated;
grant usage on schema af_metrics to anon, authenticated;
create table af_metrics.ayah_totals (
 verse text primary key check (verse in ('13:28','2:153','2:152','94:5','39:53','3:134','17:9','49:13')),
 views bigint not null default 0 check (views >= 0),
 day date not null default (now() at time zone 'UTC')::date,
 day_views integer not null default 0 check(day_views >= 0)
);
create table af_metrics.ayah_view_tokens (
 verse text not null references af_metrics.ayah_totals(verse),
 day date not null,
 token uuid not null,
 primary key(verse,day,token)
);
create index ayah_view_tokens_day_idx on af_metrics.ayah_view_tokens(day);
alter table af_metrics.ayah_totals enable row level security;
alter table af_metrics.ayah_view_tokens enable row level security;
revoke all on all tables in schema af_metrics from public, anon, authenticated;
-- Intentionally no direct table policies: the aggregate-only RPC is the access boundary.
create or replace function af_metrics.ayah_views(p_verse text,p_token uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n bigint; added integer; utc_day date := (now() at time zone 'UTC')::date; d date; daily integer;
begin
 if p_verse is null or not (p_verse=any(array['13:28','2:153','2:152','94:5','39:53','3:134','17:9','49:13'])) then
  raise exception 'Unsupported featured ayah' using errcode='22023';
 end if;
 if p_token is null then
  select coalesce(t.views,0) into n from af_metrics.ayah_totals t where t.verse=p_verse;
  return jsonb_build_object('views',coalesce(n,0));
 end if;
 insert into af_metrics.ayah_totals(verse) values(p_verse) on conflict do nothing;
 -- Serialize per ayah, including duplicate requests from different tabs.
 select t.views,t.day,t.day_views into n,d,daily from af_metrics.ayah_totals t where t.verse=p_verse for update;
 if d<>utc_day then daily:=0; end if;
 if daily>=100000 then return jsonb_build_object('views',n); end if;
 insert into af_metrics.ayah_view_tokens(verse,day,token) values(p_verse,utc_day,p_token) on conflict do nothing;
 get diagnostics added=row_count;
 if added=1 then
  n:=n+1;
  update af_metrics.ayah_totals set views=n,day=utc_day,day_views=daily+1 where verse=p_verse;
 end if;
 -- Bounded retention work; deduplication tokens expire after 30 days.
 delete from af_metrics.ayah_view_tokens where (verse,day,token) in
  (select t.verse,t.day,t.token from af_metrics.ayah_view_tokens t where t.day<utc_day-30 limit 100);
 return jsonb_build_object('views',n);
end $$;
revoke all on function af_metrics.ayah_views(text,uuid) from public, anon, authenticated;
grant execute on function af_metrics.ayah_views(text,uuid) to anon,authenticated;
create or replace function public.af_ayah_views(p_verse text,p_token uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
 select af_metrics.ayah_views(p_verse,p_token)
$$;
revoke all on function public.af_ayah_views(text,uuid) from public;
grant execute on function public.af_ayah_views(text,uuid) to anon,authenticated;
notify pgrst,'reload schema';
