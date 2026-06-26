-- Fecha a permissão temporária de upload de fotos. Correr DEPOIS do upload.
drop policy if exists "temp_anon_photo_upload" on public.members;
