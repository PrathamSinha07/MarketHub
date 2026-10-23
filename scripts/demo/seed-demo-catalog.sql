-- ---------------------------------------------------------------------------
-- MarketHub DEVELOPMENT-ONLY demo catalog
--
-- Applied exclusively by `scripts/Seed-DemoCatalog.ps1` (never by Flyway, so
-- no demo row can ever reach a production schema). Safe to re-run: every row
-- is keyed by a fixed slug/email/id and updated in place.
--
-- Prerequisites:
--   * the target database is a LOCAL development database, and
--   * the backend has been started once against it (Flyway V1..V3 applied).
--
-- Demo accounts (all share the development-only password `markethub-demo`):
--   demo.northwind@demo.markethub.local    (seller - Northwind Supply Co.)
--   demo.lumen@demo.markethub.local        (seller - Lumen Studio)
--   demo.trailhead@demo.markethub.local    (seller - Trailhead Outfitters)
--   demo.paperandpine@demo.markethub.local (seller - Paper & Pine)
--
-- Product photos live in frontend/public/demo/products/ and carry their own
-- attribution file (ATTRIBUTION.md, Wikimedia Commons licenses).
-- ---------------------------------------------------------------------------

begin;

-- 1) Hide leftover automated-test products from the public catalog. They are
--    archived, never deleted, so any test that owns them still finds them.
--    The last three families are leftovers of the early HTTP smoke tests
--    (they do not carry the usual "IT "/"QA " prefixes).
update products
set status = 'ARCHIVED', updated_at = now()
where status in ('ACTIVE', 'OUT_OF_STOCK')
  and (name like 'IT %' or name like 'QA %'
       or name like 'Smoke Test %' or name like 'HttpClient Widget %' or name = 'Dup');

-- 1b) Remove leftover automated-test categories (created on demand by the
--     suites via API, so deleting them is safe - they are recreated when a
--     test needs one again). Re-home their archived products first so the
--     foreign key stays satisfied. The old "Books" smoke-test category is
--     handled by product name so a hypothetical real Books category with
--     real products would never be touched.
update products p
set category_id = 2
from categories c
where p.category_id = c.id
  and (c.name like 'IT %' or c.name like 'QA %'
       or (c.name = 'Books'
           and (p.name like 'Smoke Test %' or p.name like 'HttpClient Widget %' or p.name = 'Dup')));

delete from categories c
where (c.name like 'IT %' or c.name like 'QA %')
  and not exists (select 1 from products p where p.category_id = c.id);

-- 2) Demo categories. Fixed ids: the Playwright suite expects
--    Electronics to be category id 2.
insert into categories (id, name, slug, parent_id, created_at, updated_at) values
  (2, 'Electronics',         'electronics',         null, now(), now()),
  (3, 'Home & Kitchen',      'home-kitchen',        null, now(), now()),
  (4, 'Sports & Outdoors',   'sports-outdoors',     null, now(), now()),
  (5, 'Office & Stationery', 'office-stationery',   null, now(), now()),
  (6, 'Bags & Accessories',  'bags-accessories',    null, now(), now())
on conflict (id) do update
  set name = excluded.name, slug = excluded.slug, updated_at = now();

-- 3) Demo sellers. Ids 9001+ keep them clear of test-created rows.
insert into users (id, email, password_hash, first_name, last_name, role, enabled, created_at, updated_at) values
  (9001, 'demo.northwind@demo.markethub.local',   '$2a$10$Sjh82jy3eSBpF3xcBhXtpOCMhGVoF0GqgpC/Mg6wcaks7mabE9rFa', 'Dana',  'Northwind', 'ROLE_SELLER', true, now(), now()),
  (9002, 'demo.lumen@demo.markethub.local',       '$2a$10$Sjh82jy3eSBpF3xcBhXtpOCMhGVoF0GqgpC/Mg6wcaks7mabE9rFa', 'Lena',  'Moreau',    'ROLE_SELLER', true, now(), now()),
  (9003, 'demo.trailhead@demo.markethub.local',   '$2a$10$Sjh82jy3eSBpF3xcBhXtpOCMhGVoF0GqgpC/Mg6wcaks7mabE9rFa', 'Theo',  'Ashford',   'ROLE_SELLER', true, now(), now()),
  (9004, 'demo.paperandpine@demo.markethub.local','$2a$10$Sjh82jy3eSBpF3xcBhXtpOCMhGVoF0GqgpC/Mg6wcaks7mabE9rFa', 'Priya', 'Delgado',  'ROLE_SELLER', true, now(), now())
on conflict (id) do update
  set email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name,
      enabled = true, updated_at = now();

insert into seller_profiles (id, user_id, store_name, store_description, created_at, updated_at) values
  (9001, 9001, 'Northwind Supply Co.', 'Everyday tech essentials, chosen for durable daily use.', now(), now()),
  (9002, 9002, 'Lumen Studio',         'Lighting and calm workspace pieces for focused work.',   now(), now()),
  (9003, 9003, 'Trailhead Outfitters', 'Field-tested gear for trails, water and weekend trips.', now(), now()),
  (9004, 9004, 'Paper & Pine',         'Paper goods and desk objects in honest materials.',      now(), now())
on conflict (id) do update
  set store_name = excluded.store_name, store_description = excluded.store_description, updated_at = now();

-- 4) Demo products (16 across 5 categories). Three items deliberately carry
--    no image so the storefront's category-specific fallback design is
--    visible in the demo. Photos match the product each row describes.
insert into products (id, name, slug, description, price, stock_quantity, status, image_url, category_id, seller_id, created_at, updated_at) values
  (9001, 'Luna Compact Mechanical Keyboard', 'luna-compact-mechanical-keyboard',
   'A compact 68-key mechanical keyboard with hot-swappable switches, PBT keycaps and a detachable USB-C cable.',
   89.00, 24, 'ACTIVE', '/demo/products/luna-keyboard.jpg', 2, 9001, now(), now()),
  (9002, 'Vertex Wireless Mouse', 'vertex-wireless-mouse',
   'An ambidextrous wireless mouse with a precision 4000 DPI sensor, silent clicks and a three-month battery life.',
   34.50, 40, 'ACTIVE', '/demo/products/vertex-mouse.jpg', 2, 9001, now(), now()),
  (9003, 'Nimbus Portable Speaker', 'nimbus-portable-speaker',
   'A rugged portable Bluetooth speaker with deep bass, a carry handle and water-resistant fabric.',
   59.00, 18, 'ACTIVE', '/demo/products/nimbus-speaker.jpg', 2, 9001, now(), now()),
  (9004, 'Studio Reference Headphones', 'studio-reference-headphones',
   'Open-back over-ear reference headphones with a wide soundstage and replaceable ear cushions.',
   74.00, 12, 'ACTIVE', '/demo/products/studio-headphones.jpg', 2, 9002, now(), now()),
  (9005, 'Arc LED Desk Lamp', 'arc-led-desk-lamp',
   'A dimmable LED desk lamp with a slim head, touch controls and a weighted base.',
   47.00, 5, 'ACTIVE', '/demo/products/arc-desk-lamp.jpg', 2, 9002, now(), now()),
  (9006, 'Aero Laptop Cooling Pad', 'aero-laptop-cooling-pad',
   'A slim laptop cooling pad with dual quiet fans and a vented top that keeps notebooks cool. Currently out of stock.',
   34.00, 0, 'ACTIVE', '/demo/products/aero-laptop-stand.jpg', 2, 9002, now(), now()),
  (9007, 'Ember Glass Electric Kettle', 'ember-glass-electric-kettle',
   'A 1.7 litre cordless glass electric kettle with a blue-tinted body, auto shut-off and a removable spout filter.',
   32.00, 16, 'ACTIVE', '/demo/products/kettle-pourover.jpg', 3, 9002, now(), now()),
  (9008, 'Ridge Stoneware Espresso Cup', 'ridge-stoneware-espresso-cup',
   'A hand-glazed stoneware espresso cup with a matching saucer, sized for a double shot.',
   16.00, 30, 'ACTIVE', '/demo/products/stoneware-mugs.jpg', 3, 9002, now(), now()),
  (9009, 'Pantry Glass Storage Jars', 'pantry-glass-storage-jars',
   'Clear glass pantry jars with lids, sized for staples, coffee and dry goods.',
   24.00, 22, 'ACTIVE', '/demo/products/storage-jars.jpg', 3, 9002, now(), now()),
  (9010, 'Trailhead Insulated Bottle', 'trailhead-insulated-bottle',
   'A double-wall stainless bottle that keeps drinks cold for 24 hours, with a leak-proof cap.',
   26.00, 35, 'ACTIVE', '/demo/products/trailhead-bottle.jpg', 4, 9003, now(), now()),
  (9011, 'Summit 22L Daypack', 'summit-22l-daypack',
   'A 22-litre daypack with padded shoulder straps, a breathable back panel and a side mesh pocket.',
   68.00, 14, 'ACTIVE', '/demo/products/summit-daypack.jpg', 4, 9003, now(), now()),
  (9012, 'Align Everyday Yoga Mat', 'align-everyday-yoga-mat',
   'A 5 mm non-slip yoga mat with a textured surface and a carrying strap.',
   38.00, 26, 'ACTIVE', '/demo/products/yoga-mat.jpg', 4, 9003, now(), now()),
  (9013, 'Fieldnote Hardcover Notebook', 'fieldnote-hardcover-notebook',
   'A pocket-size hardcover notebook with 160 ruled pages and an elastic closure.',
   16.00, 48, 'ACTIVE', '/demo/products/fieldnote-notebook.jpg', 5, 9004, now(), now()),
  (9014, 'Grove Desk Organizer', 'grove-desk-organizer',
   'A solid-oak desk organizer with compartments for pens, cards and a phone stand.',
   32.00, 9, 'ACTIVE', null, 5, 9004, now(), now()),
  (9015, 'Harbor Canvas Tote', 'harbor-canvas-tote',
   'A heavyweight canvas tote with reinforced handles and an interior pocket.',
   34.00, 20, 'ACTIVE', null, 6, 9004, now(), now()),
  (9016, 'Leather Card Wallet', 'leather-card-wallet',
   'A slim full-grain leather card wallet with four slots and a centre pocket.',
   29.00, 2, 'ACTIVE', null, 6, 9003, now(), now())
on conflict (id) do update
  set name = excluded.name, slug = excluded.slug, description = excluded.description,
      price = excluded.price, stock_quantity = excluded.stock_quantity, status = excluded.status,
      image_url = excluded.image_url, category_id = excluded.category_id,
      seller_id = excluded.seller_id, updated_at = now();

-- 5) Deterministic listing order: stagger creation time so the demo keyboard
--    leads "New arrivals" (all rows would otherwise share one timestamp).
update products
set created_at = now() - ((id - 9001) * interval '1 hour')
where id between 9001 and 9016;

-- 6) Keep identity sequences clear of the fixed demo ids.
select setval(pg_get_serial_sequence('users', 'id'),           GREATEST((select max(id) from users),           9100));
select setval(pg_get_serial_sequence('seller_profiles', 'id'), GREATEST((select max(id) from seller_profiles), 9100));
select setval(pg_get_serial_sequence('products', 'id'),        GREATEST((select max(id) from products),        9100));
select setval(pg_get_serial_sequence('categories', 'id'),      GREATEST((select max(id) from categories),      100));

commit;
