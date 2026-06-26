-- TEMPORÁRIO: permite carregar fotos em massa. Correr ANTES do upload.
-- ⚠️ Enquanto isto estiver ativo, qualquer pessoa pode mudar fotos.
-- Correr o temp_close_photos.sql LOGO a seguir ao upload terminar.
create policy "temp_anon_photo_upload" on public.members
  for update using (true) with check (true);
