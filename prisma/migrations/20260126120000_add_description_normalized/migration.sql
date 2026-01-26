CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE "incomes" ADD COLUMN "description_normalized" VARCHAR(255);
ALTER TABLE "expenses" ADD COLUMN "description_normalized" VARCHAR(255);
ALTER TABLE "transfers" ADD COLUMN "description_normalized" VARCHAR(255);

UPDATE "incomes"
SET "description_normalized" = TRIM(REGEXP_REPLACE(LOWER(unaccent("description")), '\\s+', ' ', 'g'));

UPDATE "expenses"
SET "description_normalized" = TRIM(REGEXP_REPLACE(LOWER(unaccent("description")), '\\s+', ' ', 'g'));

UPDATE "transfers"
SET "description_normalized" = TRIM(REGEXP_REPLACE(LOWER(unaccent("description")), '\\s+', ' ', 'g'));

ALTER TABLE "incomes" ALTER COLUMN "description_normalized" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "description_normalized" SET NOT NULL;
ALTER TABLE "transfers" ALTER COLUMN "description_normalized" SET NOT NULL;
