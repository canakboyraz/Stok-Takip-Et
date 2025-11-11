# 🔒 Security Documentation

## Overview

This document outlines the security measures, vulnerabilities fixed, and best practices for the Stok Takip Sistemi project.

## Security Issues Fixed (2025-01-11)

### Critical Issues Resolved

#### 1. **auth_users_exposed** ❌ → ✅

**Issue:**
- `project_users_view` was exposing `auth.users` table to anonymous and authenticated users
- This could potentially leak sensitive user information

**Fix:**
- Removed direct reference to `auth.users` table
- Recreated view to only use public fields from `project_users` table
- Added proper RLS (Row Level Security) policies
- Users can only see their own project memberships

**Migration:**
```sql
-- Before: DANGEROUS
CREATE VIEW project_users_view AS
SELECT * FROM auth.users JOIN project_users...

-- After: SAFE
CREATE VIEW project_users_view AS
SELECT pu.*, p.name FROM project_users pu
LEFT JOIN projects p...
```

#### 2. **security_definer_view** ❌ → ✅

**Issue:**
- 8 views were defined with `SECURITY DEFINER` property
- This bypasses RLS policies and runs with creator's permissions
- Potential privilege escalation vulnerability

**Affected Views:**
1. `events_view`
2. `personnel_stats`
3. `movement_stats`
4. `project_users_view`
5. `recipe_ingredients_view`
6. `expense_stats`
7. `inventory_stats`
8. `reversible_operations`

**Fix:**
- Recreated all views with `security_invoker = true`
- This ensures queries run with the calling user's permissions
- RLS policies are now properly enforced

**Migration:**
```sql
-- Before: DANGEROUS
CREATE VIEW my_view AS SELECT...

-- After: SAFE
CREATE VIEW my_view
  WITH (security_invoker = true) AS
SELECT...
```

## Row Level Security (RLS) Policies

### Enabled Tables

All tables have RLS enabled to ensure data isolation:

- ✅ `projects`
- ✅ `project_users`
- ✅ `products`
- ✅ `categories`
- ✅ `stock_movements`
- ✅ `recipes`
- ✅ `menus`
- ✅ `personnel`
- ✅ `expenses`
- ✅ `activities`
- ✅ `timesheets`

### Example RLS Policies

```sql
-- Users can only view their own project memberships
CREATE POLICY "Users can view their own project memberships"
  ON project_users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only access data from their projects
CREATE POLICY "Users can access their project data"
  ON products FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_users
      WHERE user_id = auth.uid()
    )
  );
```

## Security Best Practices

### ✅ DO

1. **Always use RLS policies** for data access control
2. **Use `security_invoker = true`** when creating views
3. **Never expose `auth.users`** directly in views
4. **Validate user input** on both client and server side
5. **Use prepared statements** to prevent SQL injection
6. **Audit permissions regularly** using Supabase linter
7. **Keep dependencies updated** to patch vulnerabilities
8. **Use environment variables** for sensitive data
9. **Implement rate limiting** for API endpoints
10. **Log security events** for monitoring

### ❌ DON'T

1. **Don't use `SECURITY DEFINER`** unless absolutely necessary
2. **Don't expose `auth.users`** in public views
3. **Don't store sensitive data** in localStorage
4. **Don't commit `.env` files** to version control
5. **Don't disable RLS** on production tables
6. **Don't use `anon` role** for sensitive operations
7. **Don't trust client-side validation** alone
8. **Don't hardcode secrets** in code
9. **Don't skip security audits**
10. **Don't ignore linter warnings**

## Authentication & Authorization

### Authentication Flow

```
1. User submits email/password
   ↓
2. Supabase Auth validates credentials
   ↓
3. Returns JWT token
   ↓
4. Client stores token (httpOnly cookie recommended)
   ↓
5. All API requests include token
   ↓
6. RLS policies enforce data access
```

### Role-Based Access Control

**Roles:**
- `owner`: Full access to project (admin)
- `admin`: Manage project settings and users
- `editor`: Create/edit data
- `viewer`: Read-only access

**Implementation:**
```sql
-- Check user role in RLS policy
CREATE POLICY "Editors can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_id = products.project_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
  );
```

## Data Protection

### Sensitive Data Handling

**Protected Information:**
- User passwords (hashed by Supabase Auth)
- User emails (only visible to owner)
- Project data (isolated by RLS)
- Activity logs (project-specific)

**Encryption:**
- At rest: Supabase provides automatic encryption
- In transit: All connections use HTTPS/TLS
- Tokens: JWT tokens signed with secret key

## Vulnerability Scanning

### Supabase Database Linter

Run regularly to detect security issues:

```bash
# In Supabase Dashboard
Database → Database Linter

# Check for:
- auth_users_exposed
- security_definer_view
- rls_disabled
- exposed_secrets
- function_search_path
```

### NPM Audit

Check for vulnerable dependencies:

```bash
npm audit

# Fix issues
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

## Incident Response

### If a Security Issue is Found

1. **Assess severity** (Critical/High/Medium/Low)
2. **Create private issue** (don't expose publicly yet)
3. **Develop fix** in private branch
4. **Test thoroughly** in staging environment
5. **Deploy fix** to production
6. **Notify affected users** if data was exposed
7. **Document incident** for future reference
8. **Update security policies** to prevent recurrence

## Compliance

### GDPR Considerations

- User data is stored in EU region (if applicable)
- Users can request data deletion
- Privacy policy available
- Cookie consent implemented
- Data breach notification process in place

### Data Retention

- User accounts: Retained until deletion request
- Activity logs: 90 days
- Audit logs: 1 year
- Backups: 30 days

## Security Contacts

For security issues, please contact:
- **Email:** [security@example.com]
- **GitHub:** Create private security advisory
- **Response Time:** Within 24 hours for critical issues

## Changelog

### 2025-01-11
- ✅ Fixed `auth_users_exposed` vulnerability
- ✅ Fixed 8 `security_definer_view` vulnerabilities
- ✅ Added comprehensive security documentation
- ✅ Implemented proper RLS policies
- ✅ Removed anon access to sensitive views

### Future Enhancements
- [ ] Implement 2FA (Two-Factor Authentication)
- [ ] Add IP-based rate limiting
- [ ] Set up automated security scanning in CI/CD
- [ ] Implement audit log viewer
- [ ] Add CSRF protection
- [ ] Set up security headers (CSP, HSTS, etc.)

---

<div align="center">
  <sub>Security is everyone's responsibility. Report issues promptly and follow best practices.</sub>
</div>
