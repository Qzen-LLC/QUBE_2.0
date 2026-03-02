import { prismaClient } from '@/utils/db';

async function main() {
  console.log('Fixing UseCase.businessFunction column values...');

  // 1) Attempt to coerce array-typed values to text using direct SQL
  // This safely handles cases where the column is currently text[]
  // or where individual rows contain array values due to prior schema drift.
  try {
    await prismaClient.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- If the column type is text[], convert it to text taking the first element
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'UseCase'
            AND column_name = 'businessFunction'
            AND udt_name = '_text'
        ) THEN
          ALTER TABLE "UseCase"
          ALTER COLUMN "businessFunction" TYPE TEXT
          USING (CASE
            WHEN "businessFunction" IS NULL THEN ''
            WHEN array_length("businessFunction", 1) >= 1 THEN ("businessFunction")[1]::text
            ELSE ''
          END);
        END IF;
      END
      $$;
    `);
  } catch (e) {
    console.error('Error coercing column type to TEXT:', e);
  }

  // 2) For safety, coerce any array-like values at the row level if the column is already TEXT
  //    This covers cases where Postgres still returns array values unexpectedly.
  try {
    await prismaClient.$executeRawUnsafe(`
      UPDATE "UseCase"
      SET "businessFunction" = (
        CASE
          WHEN (to_jsonb("businessFunction") ->> '0') IS NOT NULL THEN (to_jsonb("businessFunction") ->> '0')
          ELSE COALESCE("businessFunction"::text, '')
        END
      )
      WHERE jsonb_typeof(to_jsonb("businessFunction")) = 'array';
    `);
  } catch (e) {
    console.error('Error normalizing array rows to TEXT:', e);
  }

  // 3) Replace any remaining NULLs with empty string to avoid non-null errors in reads
  try {
    await prismaClient.$executeRawUnsafe(`
      UPDATE "UseCase" SET "businessFunction" = '' WHERE "businessFunction" IS NULL;
    `);
  } catch (e) {
    console.error('Error filling NULL businessFunction values:', e);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });


