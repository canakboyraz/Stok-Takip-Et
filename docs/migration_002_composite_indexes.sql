-- ============================================================================
-- COMPOSITE INDEX MIGRATION
-- ============================================================================
-- Purpose: Add composite indexes for common query patterns
-- Impact: Further optimize dashboard and reporting queries
-- Prerequisite: migration_001_critical_indexes.sql should be applied first
-- ============================================================================

-- ============================================================================
-- PART 1: Dashboard Query Optimization
-- ============================================================================

-- Events dashboard: Filter by project + status, order by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_project_status_date
  ON events(project_id, status, date DESC);

-- Menus dashboard: Filter by project + status, order by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menus_project_status_date
  ON menus(project_id, status, date DESC);

-- Products inventory: Filter by project + category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_project_category
  ON products(project_id, category_id)
  WHERE deleted_at IS NULL;

-- Recipes: Filter by project + category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_project_category
  ON recipes(project_id, category);

-- ============================================================================
-- PART 2: Reporting Query Optimization
-- ============================================================================

-- Stock movements report: Project + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_project_date
  ON stock_movements(project_id, created_at DESC);

-- Bulk movements report: Project + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bulk_movements_project_date
  ON bulk_movements(project_id, created_at DESC);

-- Expense report: Project + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_project_date
  ON expenses(project_id, created_at DESC);

-- Activity log: User + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_user_date
  ON activities(user_id, created_at DESC);

-- Activity log: Project + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_project_date
  ON activities(project_id, created_at DESC);

-- Personnel timesheet: Personnel + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_personnel_date
  ON timesheets(personnel_id, date DESC);

-- ============================================================================
-- PART 3: Customer & Event Management Optimization
-- ============================================================================

-- Events by customer + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_customer_status
  ON events(customer_id, status);

-- Events by menu (for menu usage analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_menu_status
  ON events(menu_id, status)
  WHERE menu_id IS NOT NULL; -- Partial index, only events with menu

-- Customers by project (with contact info sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_project_name
  ON customers(project_id, name);

-- ============================================================================
-- PART 4: Inventory Management Optimization
-- ============================================================================

-- Products: Project + stock level (for low stock alerts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_project_stock
  ON products(project_id, current_stock)
  WHERE deleted_at IS NULL AND current_stock < minimum_stock;

-- Stock movements: Product + date (for product history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_product_date
  ON stock_movements(product_id, created_at DESC);

-- ============================================================================
-- PART 5: Recipe & Menu System Optimization
-- ============================================================================

-- Recipe ingredients: Composite for JOIN optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipe_ingredients_recipe_product
  ON recipe_ingredients(recipe_id, product_id);

-- Menu items: Composite for JOIN optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_menu_recipe
  ON menu_items(menu_id, recipe_id);

-- ============================================================================
-- PART 6: Partial Indexes for Active Records
-- ============================================================================

-- Only active/pending events (most queries filter these)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_active
  ON events(project_id, date DESC)
  WHERE status IN ('pending', 'confirmed');

-- Only active menus
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menus_active
  ON menus(project_id, date DESC)
  WHERE status IN ('draft', 'planned', 'active');

-- Only completed events (for reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_completed
  ON events(project_id, date DESC)
  WHERE status = 'completed';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check composite index usage:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   pg_size_pretty(pg_relation_size(indexname::regclass)) as size
-- FROM pg_stat_user_indexes
-- WHERE indexname LIKE 'idx_%project%' OR indexname LIKE 'idx_%active%'
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Composite indexes are ordered by selectivity (most selective first)
-- 2. Partial indexes reduce index size and improve performance
-- 3. These indexes complement single-column indexes from migration_001
-- 4. Monitor query patterns and adjust as needed
