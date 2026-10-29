# Al Furqan accounts

## Deployment and current state

The new account pages use a separate Supabase project `xtkdiziasltmgwqqnkfn`.
The Affimaro database and its users are not shared with this website.
The public configuration is in `dist/auth-config.js` in the Sites source checkout
(or `auth-config.js` at the root of the GitHub Pages mirror). Only the publishable key
is shipped to the browser. `registrationReady` is deliberately false until email
delivery and redirects have been configured and verified.

The schema in `backend/schema.sql` has been applied to the remote project.
The owner explicitly approved the exact email in the conversation. That email
is reserved in the private allowlist, outside tracked source. Administrator
membership is granted only after that email is verified. No account is treated
as verified merely because an invitation was requested. Consult the Auth user
record for the live invitation/verification state.

## Authentication settings to finish in Supabase

1. Authentication → URL Configuration:
   - Default Site URL: `https://getfurqan.online/auth-callback.html?mode=invite`
     (the destination for the built-in administrative invitation template).
   - Redirect allowlist: `https://getfurqan.online/auth-callback.html`
   - Also allow `https://getfurqan.online/auth-callback.html?mode=confirm`,
     `https://getfurqan.online/auth-callback.html?mode=recovery` and
     `https://getfurqan.online/auth-callback.html?mode=invite`.
   - Do not use wildcard production domains or localhost fallbacks.
2. Authentication → Email / SMTP:
   configure an authorized custom SMTP service or Send Email Hook for the
   domain. Supabase's built-in mailer sends only to project team addresses;
   it is not sufficient for public registration.
   Enter SMTP secrets in Supabase, never in the repository or public config.
3. Keep email confirmation enabled. Require a minimum password length of 12
   on the server, matching the signup form. Review email rate limits for the
   expected audience. If available for the plan, enable leaked password checks.
4. Test signup with an address controlled by the owner, confirmation in the
   same browser, sign-in, password recovery, and sign-out. PKCE links must be
   opened in the browser where signup or reset was requested.
5. Only after the checks pass, change `registrationReady` to true and deploy.
   Signup and signup-resend buttons remain paused. Password recovery is enabled
   for the existing team-email account flow; default-mailer restrictions still
   apply until custom SMTP is configured.

Production email redirects always use the canonical GitHub Pages domain.
A localhost or private Sites preview must not receive production auth callbacks.
The native Sites project's owner-only access is separate from app accounts.

## Activate the owner (exact email approval has been received)

Do not put the real owner email in tracked source. In one server-side SQL
transaction, add the approved lowercase email to `af_private.owner_emails`.
A trigger grants membership in `af_private.admins` after that email is confirmed.
If the owner account is already confirmed, grant membership by selecting the
matching **verified** `auth.users` row inside the same authorized transaction.
An unverified email must never receive administrator privileges.
The owner sets their own password through the signup form.
Do not create passwords, read password hashes or ask for credentials in chat.

The owner's `/account.html` displays an Administration link after the backend
confirms membership. `/admin.html` itself is only a static shell; every users,
audit and access-change RPC independently checks the live verified session,
account status and private administrator membership.

## Access model

- Public Quran tools remain open without an account.
- User profiles are private. Authenticated users can read only their own row.
- Profile editing cannot change access status or administrator membership.
- No privilege is inferred from `user_metadata` or a frontend flag.
- `af_private` must not be added to PostgREST's exposed schemas.
- Public RPC wrappers use SECURITY INVOKER. Privileged implementations are in
  the private schema with fixed search paths, explicit grants and live checks.
- Suspension blocks protected Al Furqan account APIs immediately. It does not
  claim to ban public reading or revoke the provider's password/session itself.
- Administrator accounts cannot be suspended through this panel.
- Status changes and reasons are recorded in a private audit log.
- Names and audit reasons are rendered using textContent, never interpolated HTML.
- Bookmarks, reading progress and notes remain browser-local. Account sign-in
  does not provide cloud synchronization.

## Validation already completed

`backend/security-check.sql` passes against the remote project in a transaction
that is rolled back. It checks anonymous denial, ordinary-user denial of admin
APIs, profile isolation, metadata privilege escalation, verified sessions,
suspension/restoration, audit records and revocation of sessions. It sends no
emails and leaves no test users or administrator memberships behind.

Supabase's security advisor reports only three informational no-policy notices
for private tables. These tables intentionally have no direct user grants and
are inaccessible except through the checked functions. A later advisor check also reports leaked-password protection disabled; enable
that optional protection when supported by the project plan. Public email
delivery is still an outstanding live test.

The Supabase JS SDK is pinned at 2.118.0 and vendored locally with its MIT license.
Run `npm ci` followed by `npm run vendor:auth` to reproduce vendor assets.

## Invitation callback

The default invitation template cannot be customized on this free project
without custom SMTP. Its default redirect is therefore the invitation callback
on the canonical domain. Invite callbacks use the SDK's implicit flow, as
required by server-created email invitations; signup/recovery retain PKCE.
The callback validates the provider user and protected account RPC before
showing password setup, removes callback fragments from history, and requires
12–128 characters. The owner sets the password themselves.

URL allowlist and minimum password length 12 were configured in the dashboard;
email confirmation remains enabled. Public registration remains disabled in the
UI pending custom SMTP. `scripts/check-auth-invite.mjs` validates callback
success, missing/unverified sessions, mismatch rejection and URL cleanup with
mock data; it never handles the owner's real password or email token.

## Signup availability and request states

Public registration is still gated on custom email delivery. When unavailable,
the signup form is hidden before visitors enter personal details, and a short
unavailability message is displayed. Sign-in and existing-account recovery
remain available. The waiting cursor is used only for an active request.
Network fetches abort after 30 seconds; login form operations stop waiting after
35 seconds, restore the controls, and display an actionable error. Account
assets use a versioned URL so older paused-registration scripts are refreshed.
