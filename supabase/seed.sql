-- Local seed. Runs on `supabase db reset` (local only).
-- Reference data (service categories, milestone templates, settings) is created by the
-- migrations. Public site content is seeded by `npm run seed:content`, and labelled
-- [DEV] fixture clients/projects by `npm run seed:dev` — both use the admin API so
-- auth users get created properly.
select 1;
