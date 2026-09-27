# Provisioning studio (admin) access

There is no way to become an admin from the website. Staff access is a row in `staff_roles`,
which only the service role can write. Grant it from a trusted machine that has the project's
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## First admin

```bash
npm run grant-admin -- --email you@yourdomain --role owner --create
```

- `--create` makes the account if it doesn't exist and prints a **one-time sign-in link in the
  terminal** (not emailed). Open it and choose a password. The link expires in about an hour.
- Without `--create`, the account must already exist.

## More staff, or removing access

```bash
npm run grant-admin -- --email colleague@yourdomain --role admin
npm run grant-admin -- --email colleague@yourdomain --revoke
```

Every grant is written to the audit log.

## Alternative: SQL editor

In the Supabase dashboard → SQL editor (runs as the service role):

```sql
insert into public.staff_roles (user_id, role)
select id, 'owner' from public.profiles where lower(email) = lower('you@yourdomain');
```

## Notes

- Use a studio email for staff accounts. The invite flow refuses to send a client invitation to
  an email that belongs to a staff account.
- Staff can also see the client portal (useful for checking what a client sees), but staff
  actions always happen in `/admin`.
