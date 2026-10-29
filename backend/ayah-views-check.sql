begin;
set local role anon;
do $$declare before_n bigint;first_n bigint;duplicate_n bigint;second_n bigint;other_n bigint;begin
 before_n:=(public.af_ayah_views('13:28',null)->>'views')::bigint;
 first_n:=(public.af_ayah_views('13:28','e6f5169e-0000-4000-8000-000000000001')->>'views')::bigint;
 duplicate_n:=(public.af_ayah_views('13:28','e6f5169e-0000-4000-8000-000000000001')->>'views')::bigint;
 second_n:=(public.af_ayah_views('13:28','e6f5169e-0000-4000-8000-000000000002')->>'views')::bigint;
 if first_n<>before_n+1 or duplicate_n<>first_n or second_n<>first_n+1 then raise exception 'Count/deduplication failed';end if;
 other_n:=(public.af_ayah_views('94:5',null)->>'views')::bigint;
 if (public.af_ayah_views('94:5','e6f5169e-0000-4000-8000-000000000001')->>'views')::bigint<>other_n+1 then raise exception 'Per-verse isolation failed';end if;
 begin perform public.af_ayah_views('999:999',null);raise exception 'Invalid verse accepted';exception when invalid_parameter_value then null;end;
 begin perform public.af_ayah_views(null,null);raise exception 'Null verse accepted';exception when invalid_parameter_value then null;end;
 begin perform * from af_metrics.ayah_view_tokens;raise exception 'Tokens exposed';exception when insufficient_privilege then null;end;
 begin update af_metrics.ayah_totals set views=10000;raise exception 'Count write allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
-- Force a UTC day boundary without changing the clock. The same token is valid on a new day.
update af_metrics.ayah_view_tokens set day=(now() at time zone 'UTC')::date-1 where verse='13:28';
update af_metrics.ayah_totals set day=(now() at time zone 'UTC')::date-1,day_views=100000 where verse='13:28';
set local role authenticated;
do $$declare n bigint;begin
 n:=(public.af_ayah_views('13:28',null)->>'views')::bigint;
 if (public.af_ayah_views('13:28','e6f5169e-0000-4000-8000-000000000001')->>'views')::bigint<>n+1 then raise exception 'Day rollover failed';end if;
end$$;
reset role;
rollback;
select 'PASS: deduplication, exact increments, verse isolation, UTC rollover, public roles, invalid input, private token/count permissions; all synthetic changes rolled back' as result;
