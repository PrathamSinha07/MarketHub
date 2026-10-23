-- ---------------------------------------------------------------------------
-- V3 - optional product imagery.
--
-- The storefront needs a place to store real product images. The column is
-- NULLABLE with no default, so:
--   * every existing row keeps working unchanged (image renders the
--     category-specific fallback until a seller supplies a URL), and
--   * old API clients that never send `imageUrl` are unaffected.
-- No data is written here; demo imagery is loaded only by the explicit,
-- development-only seeder (`scripts/Seed-DemoCatalog.ps1`), never by a
-- migration, so production schemas and data stay untouched.
-- ---------------------------------------------------------------------------

alter table products add column image_url varchar(500);
