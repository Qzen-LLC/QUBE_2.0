-- Fix user roles: Users with organizationId should be ORG_USER or ORG_ADMIN, not USER
-- This script updates any existing users who have an organizationId but are assigned the USER role

-- Update users who have organizationId but are assigned USER role to ORG_USER
UPDATE "User" 
SET role = 'ORG_USER'::"UserRole"
WHERE "organizationId" IS NOT NULL 
  AND role = 'USER'::"UserRole"
  AND role != 'ORG_ADMIN'::"UserRole";

-- Log the changes
SELECT 
  id,
  email,
  role as new_role,
  "organizationId",
  "createdAt"
FROM "User" 
WHERE "organizationId" IS NOT NULL 
  AND role = 'ORG_USER'::"UserRole"
ORDER BY "createdAt" DESC;

-- Show summary of role distribution
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN "organizationId" IS NOT NULL THEN 1 END) as with_org,
  COUNT(CASE WHEN "organizationId" IS NULL THEN 1 END) as without_org
FROM "User" 
GROUP BY role
ORDER BY role;
