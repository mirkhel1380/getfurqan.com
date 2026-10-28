-- Integration checks use temporary synthetic auth rows in ONE transaction.
-- No emails are sent. All rows and test privileges are rolled back.
begin;
do $$
declare a uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); unverified uuid:=gen_random_uuid(); sa uuid:=gen_random_uuid(); su uuid:=gen_random_uuid(); sn uuid:=gen_random_uuid(); result jsonb;
begin
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 (a,'admin-test@example.invalid',now(),'{"display_name":"Admin test"}'),
 (u,'user-test@example.invalid',now(),'{"display_name":"User test","is_admin":true}'),
 (unverified,'unverified-test@example.invalid',null,'{}');
 insert into auth.sessions(id,user_id) values(sa,a),(su,u),(sn,unverified);
 insert into af_private.admins(user_id) values(a);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',su)::text,true);
 execute 'set local role authenticated';
 result:=public.af_me();
 if result->>'is_admin'<>'false' then raise exception 'FAIL: metadata escalation';end if;
 if (select count(*) from public.af_profiles)<>1 then raise exception 'FAIL: profile isolation';end if;
 begin perform public.af_admin_users();raise exception 'FAIL: regular user could read admin users';exception when insufficient_privilege then null;end;
 begin perform public.af_admin_status(a,'suspended','test');raise exception 'FAIL: user could change status';exception when insufficient_privilege then null;end;
 begin update public.af_profiles set status='active' where id=u;raise exception 'FAIL: direct profile write allowed';exception when insufficient_privilege then null;end;
 perform public.af_update_profile('Updated name');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',unverified,'role','authenticated','session_id',sn)::text,true);
 begin perform public.af_me();raise exception 'FAIL: unverified user allowed';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',sa)::text,true);
 result:=public.af_admin_users('user-test',1);
 if (result->>'total')::int<>1 then raise exception 'FAIL: admin search';end if;
 begin perform public.af_admin_status(a,'suspended','test');raise exception 'FAIL: self suspension allowed';exception when insufficient_privilege then null;end;
 perform public.af_admin_status(u,'suspended','security test');
 if jsonb_array_length(public.af_admin_audit())<>1 then raise exception 'FAIL: missing audit';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',su)::text,true);
 begin perform public.af_me();raise exception 'FAIL: suspended access allowed';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',sa)::text,true);
 perform public.af_admin_status(u,'active','security test restore');
 execute 'reset role';
 delete from auth.sessions where id=su;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',su)::text,true);
 execute 'set local role authenticated';
 begin perform public.af_me();raise exception 'FAIL: revoked session allowed';exception when invalid_authorization_specification then null;end;
 execute 'reset role';
 execute 'set local role anon';
 begin perform public.af_admin_users();raise exception 'FAIL: anonymous admin access';exception when insufficient_privilege then null;end;
 execute 'reset role';
end;$$;
select 'PASS: profile isolation, metadata escalation, admin search, status changes, audit, unverified, suspended, revoked and anonymous access' as checks;
rollback;
