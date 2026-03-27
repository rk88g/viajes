alter table public.site_settings
  add column if not exists homepage_content jsonb not null default '{}'::jsonb;

update public.site_settings
set homepage_content = coalesce(homepage_content, '{}'::jsonb)
where id = 1;
