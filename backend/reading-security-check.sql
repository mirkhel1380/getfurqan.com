-- Synthetic users/sessions only. Everything, including test data, rolls back.
begin;
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();u uuid:=gen_random_uuid();sa uuid:=gen_random_uuid();sb uuid:=gen_random_uuid();su uuid:=gen_random_uuid();r jsonb;ops jsonb;
begin
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 (a,'reading-a-'||a||'@example.invalid',now(),'{"is_admin":true}'),
 (b,'reading-b-'||b||'@example.invalid',now(),'{}'),
 (u,'reading-unverified-'||u||'@example.invalid',null,'{}');
 insert into auth.sessions(id,user_id) values(sa,a),(sb,b),(su,u);
 insert into af_private.admins(user_id) values(b);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',sa)::text,true);
 execute 'set local role authenticated';
 r:=public.af_reading_get();if r->>'enabled'<>'false' or r->'items'<>'[]'::jsonb then raise exception 'FAIL default opt-in';end if;
 begin perform public.af_reading_patch('[{"kind":"bookmark","key":"2:255","value":true,"base":0}]');raise exception 'FAIL write before opt-in';exception when insufficient_privilege then null;end;
 perform public.af_reading_enabled(true);
 ops:='[{"kind":"bookmark","key":"2:255","value":true,"base":0},{"kind":"note","key":"13:28","value":"Private original note","base":0},{"kind":"goal","key":"goal","value":7,"base":0},{"kind":"read","key":"2026-10-29|2:255","value":true,"base":0},{"kind":"resume","key":"resume","value":{"key":"2:255","translation":"dari_badkhashani","updatedAt":"2026-10-29T12:00:00Z"},"base":0}]';
 r:=public.af_reading_patch(ops);if jsonb_array_length(r->'items')<>5 or exists(select 1 from jsonb_array_elements(r->'items')x where x->>'ok'<>'true') then raise exception 'FAIL valid writes';end if;
 r:=public.af_reading_patch(ops);if exists(select 1 from jsonb_array_elements(r->'items')x where x->>'revision'<>'1') then raise exception 'FAIL idempotent retry';end if;
 r:=public.af_reading_patch('[{"kind":"note","key":"13:28","value":"Stale device edit","base":0}]');if r#>>'{items,0,ok}'<>'false' or r#>>'{items,0,value}'<>'Private original note' then raise exception 'FAIL stale edit overwrote source';end if;
 r:=public.af_reading_patch('[{"kind":"note","key":"13:28","value":"Reviewed edit","base":1}]');if r#>>'{items,0,revision}'<>'2' then raise exception 'FAIL compare-and-set';end if;
 r:=public.af_reading_patch('[{"kind":"note","key":"13:28","value":null,"base":2}]');if r#>>'{items,0,revision}'<>'3' then raise exception 'FAIL delete marker';end if;
 r:=public.af_reading_patch('[{"kind":"note","key":"13:28","value":"Old edit after delete","base":2}]');if r#>>'{items,0,ok}'<>'false' or r#>'{items,0,value}'<>'null'::jsonb then raise exception 'FAIL stale resurrection';end if;
 begin perform public.af_reading_patch('[{"kind":"goal","key":"goal","value":8,"base":1},{"kind":"read","key":"2026-02-30|1:1","value":true,"base":0}]');raise exception 'FAIL invalid date';exception when invalid_parameter_value then null;end;
 r:=public.af_reading_get();if not exists(select 1 from jsonb_array_elements(r->'items')x where x->>'kind'='goal' and x->>'value'='7') then raise exception 'FAIL batch rollback';end if;
 begin perform public.af_reading_patch(jsonb_build_array(jsonb_build_object('kind','note','key','1:1','value',repeat('x',5001),'base',0)));raise exception 'FAIL note limit';exception when invalid_parameter_value then null;end;
 begin perform public.af_reading_patch('[{"kind":"resume","key":"resume","value":{"key":"1:1","translation":"test","updatedAt":null},"base":1}]');raise exception 'FAIL invalid resume';exception when invalid_parameter_value then null;end;
 begin perform public.af_reading_patch('[{"kind":"goal","key":"goal","value":1001,"base":1}]');raise exception 'FAIL invalid goal';exception when invalid_parameter_value then null;end;
 begin perform count(*) from af_reading.items;raise exception 'FAIL direct table read';exception when insufficient_privilege then null;end;
 perform public.af_reading_enabled(false);
 begin perform public.af_reading_patch('[{"kind":"bookmark","key":"1:1","value":true,"base":0}]');raise exception 'FAIL paused write';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','session_id',sb)::text,true);
 r:=public.af_reading_get();if r->'items'<>'[]'::jsonb then raise exception 'FAIL administrator saw other account';end if;
 perform public.af_reading_enabled(true);perform public.af_reading_patch('[{"kind":"note","key":"1:1","value":"Second account only","base":0}]');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',sa)::text,true);
 r:=public.af_reading_get();if exists(select 1 from jsonb_array_elements(r->'items')x where x->>'value'='Second account only') then raise exception 'FAIL account isolation';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',su)::text,true);
 begin perform public.af_reading_get();raise exception 'FAIL unverified account';exception when insufficient_privilege then null;end;
 execute 'reset role';update public.af_profiles set status='suspended' where id=a;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',sa)::text,true);execute 'set local role authenticated';
 begin perform public.af_reading_get();raise exception 'FAIL suspended account';exception when insufficient_privilege then null;end;
 execute 'reset role';update public.af_profiles set status='active' where id=a;delete from auth.sessions where id=sa;execute 'set local role authenticated';
 begin perform public.af_reading_get();raise exception 'FAIL revoked session';exception when invalid_authorization_specification then null;end;
 execute 'reset role';execute 'set local role anon';
 begin perform public.af_reading_get();raise exception 'FAIL anonymous access';exception when insufficient_privilege then null;end;
 execute 'reset role';
end;$$;
select 'PASS: opt-in, own-account isolation, no admin content access, strict live sessions, paused writes, compare-and-set conflicts, idempotent retries, deletion tombstones, validation and atomic batches' as reading_checks;
rollback;
