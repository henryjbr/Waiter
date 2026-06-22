-- ATENCAO: este script apaga todas as contas e dados do projeto Supabase.
-- Rode somente no SQL Editor do projeto certo.

truncate table
  public.restaurant_customers,
  public.restaurants,
  public.app_states,
  public.profiles
restart identity cascade;

delete from auth.users;

notify pgrst, 'reload schema';
