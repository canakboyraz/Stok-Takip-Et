-- Migration: Fix Critical Security Issues (v3 - Correct table structure)
-- Date: 2025-01-11
-- Description: Fix auth_users_exposed and security_definer_view issues

-- =====================================================
-- ISSUE 1: Fix auth_users_exposed in project_users_view
-- =====================================================

-- Drop existing view
DROP VIEW IF EXISTS public.project_users_view CASCADE;

-- Recreate view with security_invoker
-- Note: Uses project_permissions table (NOT project_users!)
-- Joins with auth.users to get emails, but with security_invoker it respects RLS
CREATE OR REPLACE VIEW public.project_users_view
  WITH (security_invoker = true) AS
SELECT
  pp.id as permission_id,
  pp.project_id,
  p.name as project_name,
  pp.user_id,
  u.email as user_email,
  pp.permission_level,
  pp.granted_by,
  g.email as granted_by_email,
  pp.created_at
FROM public.project_permissions pp
JOIN public.projects p ON pp.project_id = p.id
LEFT JOIN auth.users u ON pp.user_id = u.id::text
LEFT JOIN auth.users g ON pp.granted_by = g.id::text;

-- Enable RLS on the underlying table if not already enabled
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for project_permissions table
DROP POLICY IF EXISTS "Users can view project permissions" ON public.project_permissions;
CREATE POLICY "Users can view project permissions"
  ON public.project_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp2
      WHERE pp2.project_id = project_permissions.project_id
        AND pp2.user_id = auth.uid()::text
    )
  );

-- =====================================================
-- ISSUE 2: Fix security_definer_view issues
-- =====================================================

-- 1. Fix events_view
DROP VIEW IF EXISTS public.events_view CASCADE;
CREATE OR REPLACE VIEW public.events_view
  WITH (security_invoker = true) AS
SELECT
  e.*,
  p.name as project_name
FROM public.events e
LEFT JOIN public.projects p ON p.id = e.project_id;

-- 2. Fix personnel_stats
DROP VIEW IF EXISTS public.personnel_stats CASCADE;
CREATE OR REPLACE VIEW public.personnel_stats
  WITH (security_invoker = true) AS
SELECT
  personnel_id,
  COUNT(*) as total_days,
  SUM(hours_worked) as total_hours,
  AVG(hours_worked) as avg_hours
FROM public.timesheets
GROUP BY personnel_id;

-- 3. Fix movement_stats
DROP VIEW IF EXISTS public.movement_stats CASCADE;
CREATE OR REPLACE VIEW public.movement_stats
  WITH (security_invoker = true) AS
SELECT
  product_id,
  movement_type,
  COUNT(*) as total_movements,
  SUM(quantity) as total_quantity
FROM public.stock_movements
GROUP BY product_id, movement_type;

-- 4. Fix recipe_ingredients_view
DROP VIEW IF EXISTS public.recipe_ingredients_view CASCADE;
CREATE OR REPLACE VIEW public.recipe_ingredients_view
  WITH (security_invoker = true) AS
SELECT
  ri.*,
  p.name as product_name,
  r.name as recipe_name
FROM public.recipe_ingredients ri
LEFT JOIN public.products p ON p.id = ri.product_id
LEFT JOIN public.recipes r ON r.id = ri.recipe_id;

-- 5. Fix expense_stats
DROP VIEW IF EXISTS public.expense_stats CASCADE;
CREATE OR REPLACE VIEW public.expense_stats
  WITH (security_invoker = true) AS
SELECT
  project_id,
  category,
  DATE_TRUNC('month', date) as month,
  COUNT(*) as total_expenses,
  SUM(amount) as total_amount
FROM public.expenses
GROUP BY project_id, category, DATE_TRUNC('month', date);

-- 6. Fix inventory_stats
DROP VIEW IF EXISTS public.inventory_stats CASCADE;
CREATE OR REPLACE VIEW public.inventory_stats
  WITH (security_invoker = true) AS
SELECT
  project_id,
  COUNT(*) as total_products,
  SUM(stock_quantity) as total_stock,
  SUM(stock_quantity * price) as total_value,
  COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count
FROM public.products
GROUP BY project_id;

-- 7. Fix reversible_operations
DROP VIEW IF EXISTS public.reversible_operations CASCADE;
CREATE OR REPLACE VIEW public.reversible_operations
  WITH (security_invoker = true) AS
SELECT
  id,
  operation_type,
  operation_data,
  created_at,
  is_reversed,
  reversed_at,
  project_id
FROM public.operations
WHERE is_reversed = false;

-- =====================================================
-- Grant appropriate permissions
-- =====================================================

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.events_view TO authenticated;
GRANT SELECT ON public.personnel_stats TO authenticated;
GRANT SELECT ON public.movement_stats TO authenticated;
GRANT SELECT ON public.project_users_view TO authenticated;
GRANT SELECT ON public.recipe_ingredients_view TO authenticated;
GRANT SELECT ON public.expense_stats TO authenticated;
GRANT SELECT ON public.inventory_stats TO authenticated;
GRANT SELECT ON public.reversible_operations TO authenticated;

-- Revoke from anon users for security
REVOKE ALL ON public.project_users_view FROM anon;
REVOKE ALL ON public.events_view FROM anon;
REVOKE ALL ON public.personnel_stats FROM anon;
REVOKE ALL ON public.movement_stats FROM anon;
REVOKE ALL ON public.recipe_ingredients_view FROM anon;
REVOKE ALL ON public.expense_stats FROM anon;
REVOKE ALL ON public.inventory_stats FROM anon;
REVOKE ALL ON public.reversible_operations FROM anon;

-- =====================================================
-- Add comments for documentation
-- =====================================================

COMMENT ON VIEW public.project_users_view IS
  'Secure view of project permissions with user emails. Uses security_invoker to respect RLS. Joins with auth.users safely.';

COMMENT ON VIEW public.events_view IS
  'Events view with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.personnel_stats IS
  'Personnel statistics with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.movement_stats IS
  'Stock movement statistics with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.recipe_ingredients_view IS
  'Recipe ingredients view with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.expense_stats IS
  'Expense statistics with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.inventory_stats IS
  'Inventory statistics with security_invoker to respect RLS policies.';

COMMENT ON VIEW public.reversible_operations IS
  'Reversible operations view with security_invoker to respect RLS policies.';
