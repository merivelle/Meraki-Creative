-- Short line shown large in the homepage testimonials; the full quote sits beneath it.
alter table public.testimonials add column if not exists pull_quote text;
