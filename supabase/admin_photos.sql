-- Permite ao ADMINISTRADOR (pelo email) editar qualquer membro — para gerir
-- as fotos. Correr UMA vez no SQL Editor do Supabase.
-- (Se o administrador for outra pessoa, troca o email nas duas linhas.)

drop policy if exists "members_admin_update" on public.members;

create policy "members_admin_update"
  on public.members for update
  using ((auth.jwt() ->> 'email') = 'fernandobluego@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'fernandobluego@gmail.com');
