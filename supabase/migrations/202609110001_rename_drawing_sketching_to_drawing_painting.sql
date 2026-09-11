-- Rename the Surchobi course/category label from "Drawing and Sketching" to "Drawing and Painting".
-- This updates existing matching records while keeping IDs unchanged.

update public.categories
set name = 'Drawing and Painting'
where lower(name) = 'drawing and sketching';

update public.courses
set name = replace(name, 'Drawing and Sketching', 'Drawing and Painting')
where name ilike '%Drawing and Sketching%';

update public.courses
set category = 'Drawing and Painting'
where lower(coalesce(category, '')) = 'drawing and sketching';
