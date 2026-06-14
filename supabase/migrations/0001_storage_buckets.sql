-- =============================================================================
-- Africœur — Buckets de stockage Supabase + politiques d'accès
-- =============================================================================
-- À exécuter dans l'éditeur SQL Supabase (Cloud) ou via `supabase db push`.
-- Le schéma métier relationnel est géré par Django (migrations Django).
-- Ce fichier ne configure QUE le stockage (médias publics / documents légaux).
-- -----------------------------------------------------------------------------

-- 1) Bucket public : photos de couverture, vidéos de présentation, dérivés floutés.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  209715200, -- 200 Mo (vidéo 5 min ~150 Mo)
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do nothing;

-- 2) Bucket privé : devis médicaux, formulaires de décharge, justificatifs.
--    Jamais public — accès via URLs signées générées côté serveur (service_role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'legal-docs',
  'legal-docs',
  false,
  52428800, -- 50 Mo
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Politiques RLS sur storage.objects
-- -----------------------------------------------------------------------------

-- Lecture publique du bucket public-media.
drop policy if exists "public-media lisible par tous" on storage.objects;
create policy "public-media lisible par tous"
  on storage.objects for select
  using (bucket_id = 'public-media');

-- Téléversement public-media réservé aux utilisateurs authentifiés (partenaires).
drop policy if exists "public-media écriture authentifiée" on storage.objects;
create policy "public-media écriture authentifiée"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public-media');

-- legal-docs : aucune lecture publique. Seul le service_role (backend Django)
-- accède aux documents et génère des URLs signées. Aucune policy 'select' publique
-- n'est créée volontairement → bucket strictement privé.
drop policy if exists "legal-docs écriture authentifiée" on storage.objects;
create policy "legal-docs écriture authentifiée"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'legal-docs');
