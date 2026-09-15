-- meal_slot: café da manhã, almoço, lanche, jantar, ceia
ALTER TABLE public.food_entries ALTER COLUMN meal_slot DROP DEFAULT;
ALTER TABLE public.food_entries ALTER COLUMN meal_slot TYPE text USING meal_slot::text;

UPDATE public.food_entries SET meal_slot = 'afternoon_snack' WHERE meal_slot = 'snack';
UPDATE public.food_entries SET meal_slot = 'breakfast' WHERE meal_slot = 'other';

DROP TYPE public.meal_slot;

CREATE TYPE public.meal_slot AS ENUM (
  'breakfast',
  'lunch',
  'afternoon_snack',
  'dinner',
  'supper'
);

ALTER TABLE public.food_entries
  ALTER COLUMN meal_slot TYPE public.meal_slot
  USING meal_slot::public.meal_slot;

ALTER TABLE public.food_entries
  ALTER COLUMN meal_slot SET DEFAULT 'lunch';
