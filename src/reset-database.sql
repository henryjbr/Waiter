-- ATENCAO: este script apaga todas as contas e dados do projeto Supabase.
-- Rode somente no SQL Editor do projeto certo, logado como dono/admin.

truncate table
  public.restaurant_customers,
  public.restaurants,
  public.app_states,
  public.profiles
restart identity cascade;

truncate table auth.users restart identity cascade;

notify pgrst, 'reload schema';
