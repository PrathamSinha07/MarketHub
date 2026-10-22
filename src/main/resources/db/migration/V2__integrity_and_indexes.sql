-- ---------------------------------------------------------------------------
-- V2 - integrity and performance follow-ups on top of the V1 baseline.
--
-- Rules (see V1 header): never edit an applied migration; every schema change
-- ships in its own versioned file and with the matching entity change.
--
-- NOTE FOR EXISTING DATABASES: uq_users_email_lower fails if two rows differ
-- only by email letter-case. The application has always stored/looked up
-- emails after lower-casing them (AuthServiceImpl), so such rows can only
-- predate that behaviour. De-duplicate them before applying this migration:
--
--   SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;
-- ---------------------------------------------------------------------------

-- Registration and login normalize emails to lower-case; enforce it in the
-- schema too so a race between two identical registrations can never create
-- case-variant duplicates.
create unique index uq_users_email_lower on users (lower(email));

-- The public catalog filters by category and the seller dashboard lists by
-- seller; both were unindexed full scans.
create index idx_products_seller_id on products (seller_id);
create index idx_products_category_id on products (category_id);

-- event_id already has the unique constraint uk_webhook_events_event_id;
-- the extra non-unique index was pure write amplification.
drop index idx_webhook_events_event_id;
