-- One-time cleanup for existing menu category data.
-- Run this in the Supabase SQL Editor only when you want to remove all
-- category and subcategory options already saved in the database.

begin;

update public.restaurants as r
set
  menu_state = jsonb_set(
    jsonb_set(
      coalesce(r.menu_state, '{}'::jsonb),
      '{categories}',
      '[]'::jsonb,
      true
    ),
    '{items}',
    coalesce(
      (
        select jsonb_agg(item - 'categoryId' - 'subcategoryId')
        from jsonb_array_elements(coalesce(r.menu_state->'items', '[]'::jsonb)) as items(item)
      ),
      '[]'::jsonb
    ),
    true
  ),
  updated_at = now();

update public.app_states as a
set
  restaurant_state = jsonb_set(
    jsonb_set(
      coalesce(a.restaurant_state, '{}'::jsonb),
      '{categories}',
      '[]'::jsonb,
      true
    ),
    '{items}',
    coalesce(
      (
        select jsonb_agg(item - 'categoryId' - 'subcategoryId')
        from jsonb_array_elements(coalesce(a.restaurant_state->'items', '[]'::jsonb)) as items(item)
      ),
      '[]'::jsonb
    ),
    true
  ),
  updated_at = now();

update public.app_states as a
set
  admin_state = jsonb_set(
    coalesce(a.admin_state, '{}'::jsonb),
    '{restaurants}',
    coalesce(
      (
        select jsonb_agg(
          case
            when restaurant ? 'menuState' then
              jsonb_set(
                restaurant,
                '{menuState}',
                jsonb_set(
                  jsonb_set(
                    coalesce(restaurant->'menuState', '{}'::jsonb),
                    '{categories}',
                    '[]'::jsonb,
                    true
                  ),
                  '{items}',
                  coalesce(
                    (
                      select jsonb_agg(item - 'categoryId' - 'subcategoryId')
                      from jsonb_array_elements(coalesce(restaurant->'menuState'->'items', '[]'::jsonb)) as items(item)
                    ),
                    '[]'::jsonb
                  ),
                  true
                ),
                true
              )
            else restaurant
          end
        )
        from jsonb_array_elements(coalesce(a.admin_state->'restaurants', '[]'::jsonb)) as restaurants(restaurant)
      ),
      '[]'::jsonb
    ),
    true
  ),
  updated_at = now()
where a.admin_state ? 'restaurants';

commit;
