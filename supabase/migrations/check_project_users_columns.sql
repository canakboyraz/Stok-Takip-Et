-- Quick check: What columns exist in project_users table?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_users'
ORDER BY ordinal_position;
