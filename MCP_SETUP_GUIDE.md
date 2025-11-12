# 🔌 MCP (Model Context Protocol) Setup Guide

**Project**: Stok Takip Sistemi
**Last Updated**: 2025-11-11

---

## 📋 Overview

This guide walks you through setting up MCP servers for the Stock Management System. MCP enables Claude Code to directly interact with databases, APIs, and external services.

**What is MCP?**
- Model Context Protocol developed by Anthropic
- Allows AI assistants to use external tools
- Secure, sandboxed execution
- Extends capabilities beyond code editing

**Benefits for This Project**:
- Direct database queries and optimization
- Automated testing with browser automation
- Real-time error tracking
- Team notifications

---

## 🎯 Recommended MCP Servers

### Priority Order:

| Priority | MCP Server | Use Case | Setup Time |
|----------|-----------|----------|------------|
| 🔴 **HIGH** | PostgreSQL | Database analysis & optimization | 10 min |
| 🔴 **HIGH** | Puppeteer | Automated E2E testing | 5 min |
| 🟡 **MEDIUM** | Sentry | Error tracking | 15 min |
| 🟡 **MEDIUM** | Slack | Team notifications | 10 min |
| 🟢 **LOW** | AWS S3 | File storage & backups | 15 min |

---

## 🚀 Quick Start (PostgreSQL MCP)

### Step 1: Install MCP Server

```bash
# Global installation (recommended)
npm install -g @modelcontextprotocol/server-postgres

# Or project-local installation
npm install --save-dev @modelcontextprotocol/server-postgres
```

### Step 2: Create MCP Configuration

Create `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "your_supabase_connection_string_here"
      }
    }
  }
}
```

### Step 3: Get Supabase Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy **Connection String** → **URI** format
5. Replace `[YOUR-PASSWORD]` with your actual password

**Example**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 4: Update Configuration

```bash
# Edit config file
nano ~/.claude/mcp.json

# Add your connection string (replace with actual value)
```

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "postgresql://postgres:YOUR_REAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
      }
    }
  }
}
```

### Step 5: Restart Claude Code

```bash
# If using VS Code extension, reload window
# If using CLI, restart session
```

### Step 6: Test Connection

Ask Claude Code:
```
"Can you query the products table and show me the schema?"
```

Expected response:
- Claude uses PostgreSQL MCP
- Shows table schema
- Lists columns and types

---

## 📦 Detailed MCP Server Setup

### 1. PostgreSQL MCP (Database)

**Purpose**: Direct database access for analysis and optimization

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Configuration** (`~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
      }
    }
  }
}
```

**What Claude Can Do**:
```sql
-- Run queries directly
SELECT * FROM products WHERE current_stock < minimum_stock;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products JOIN categories ON products.category_id = categories.id;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

**Use Cases**:
- ✅ Find missing indexes
- ✅ Optimize slow queries
- ✅ Check data integrity
- ✅ Generate migration scripts
- ✅ Database health reports

---

### 2. Puppeteer MCP (Browser Automation)

**Purpose**: Automated E2E testing and screenshots

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```

**Configuration**:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**What Claude Can Do**:
```javascript
// Test login flow
await page.goto('http://localhost:3001');
await page.type('#email', 'test@example.com');
await page.type('#password', 'password123');
await page.click('button[type="submit"]');
await page.waitForNavigation();

// Take screenshot
await page.screenshot({ path: 'dashboard.png' });

// Test product addition
await page.click('text=Add Product');
await page.fill('input[name="name"]', 'Test Product');
await page.fill('input[name="stock"]', '100');
await page.click('button:has-text("Save")');
```

**Use Cases**:
- ✅ Automated E2E testing
- ✅ Visual regression testing
- ✅ Performance profiling
- ✅ Screenshot comparison
- ✅ Form validation testing

---

### 3. Sentry MCP (Error Tracking)

**Purpose**: Production error monitoring and tracking

**Prerequisites**:
1. Create Sentry account: https://sentry.io/
2. Create new project
3. Get DSN (Data Source Name)
4. Get Auth Token

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-sentry
```

**Configuration**:
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_DSN": "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
        "SENTRY_AUTH_TOKEN": "your_auth_token_here",
        "SENTRY_ORG": "your-org-name",
        "SENTRY_PROJECT": "stok-takip"
      }
    }
  }
}
```

**Application Integration**:
```bash
# Install Sentry SDK
npm install @sentry/react
```

```typescript
// src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**What Claude Can Do**:
```javascript
// Get recent errors
const errors = await sentryAPI.getIssues({ limit: 10 });

// Analyze error trends
const stats = await sentryAPI.getProjectStats();

// Create issues from errors
await sentryAPI.createIssue({ title: "Critical Bug", description: "..." });
```

**Use Cases**:
- ✅ Monitor production errors
- ✅ Track error frequency
- ✅ Identify problematic releases
- ✅ User impact analysis
- ✅ Performance degradation alerts

---

### 4. Slack MCP (Team Notifications)

**Purpose**: Send notifications to team channels

**Prerequisites**:
1. Create Slack app: https://api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `chat:write.public`
3. Install app to workspace
4. Get Bot Token (`xoxb-...`)

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-slack
```

**Configuration**:
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token",
        "SLACK_TEAM_ID": "T1234567890"
      }
    }
  }
}
```

**What Claude Can Do**:
```javascript
// Send notification
await slack.chat.postMessage({
  channel: '#stock-alerts',
  text: 'Product "Domates" stock below minimum: 5 units remaining'
});

// Daily summary
await slack.chat.postMessage({
  channel: '#daily-reports',
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Daily Summary*\n• 45 stock movements\n• 12 new products\n• 3 low stock alerts"
      }
    }
  ]
});
```

**Use Cases**:
- ✅ Critical stock alerts
- ✅ Daily summary reports
- ✅ Error notifications
- ✅ Deployment notifications
- ✅ Team updates

---

### 5. AWS S3 MCP (File Storage)

**Purpose**: Automated backups and file storage

**Prerequisites**:
1. AWS account
2. Create S3 bucket
3. Get Access Key ID and Secret Access Key

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-aws
```

**Configuration**:
```json
{
  "mcpServers": {
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

**What Claude Can Do**:
```javascript
// Upload database backup
await s3.upload({
  Bucket: 'stok-takip-backups',
  Key: `backup-${new Date().toISOString()}.sql`,
  Body: backupData
});

// List backups
const backups = await s3.listObjects({
  Bucket: 'stok-takip-backups',
  Prefix: 'backup-'
});

// Download backup
const backup = await s3.getObject({
  Bucket: 'stok-takip-backups',
  Key: 'backup-2025-01-01.sql'
});
```

**Use Cases**:
- ✅ Automated daily backups
- ✅ Export file storage
- ✅ Report archiving
- ✅ Log file storage
- ✅ Backup retention management

---

## 🔒 Security Best Practices

### 1. Environment Variables

**Never commit secrets to Git!**

Use `.env` files (already in `.gitignore`):
```bash
# .env.mcp (create this file)
POSTGRES_URL=postgresql://...
SENTRY_DSN=https://...
SLACK_BOT_TOKEN=xoxb-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### 2. Read-Only Access

For database queries, use read-only credentials:

```sql
-- Create read-only role in Supabase
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE postgres TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create read-only user
CREATE USER claude_mcp WITH PASSWORD 'strong_password';
GRANT readonly TO claude_mcp;
```

Then use this user in MCP config:
```
postgresql://claude_mcp:strong_password@db.xxxxx.supabase.co:5432/postgres
```

### 3. Network Security

**Supabase**: Whitelist IP addresses (Project Settings → Database → Connection Pooling)

**AWS**: Use IAM roles with minimum privileges

### 4. Token Rotation

Rotate tokens every 90 days:
- Slack bot tokens
- AWS access keys
- Sentry auth tokens

---

## 🧪 Testing MCP Setup

### Test PostgreSQL MCP

Ask Claude:
```
"Run this query: SELECT COUNT(*) as product_count FROM products"
```

Expected: Claude executes query and shows result

### Test Puppeteer MCP

Ask Claude:
```
"Navigate to http://localhost:3001 and take a screenshot of the login page"
```

Expected: Screenshot saved

### Test Slack MCP

Ask Claude:
```
"Send a test message to #general channel saying 'MCP is working!'"
```

Expected: Message appears in Slack

---

## 🐛 Troubleshooting

### Issue: "MCP server not found"

**Solution**:
```bash
# Check if installed
npm list -g @modelcontextprotocol/server-postgres

# Reinstall if missing
npm install -g @modelcontextprotocol/server-postgres
```

### Issue: "Connection refused"

**Solution**:
- Check connection string
- Verify credentials
- Test with `psql` or database GUI

```bash
# Test PostgreSQL connection
psql "postgresql://user:pass@host:5432/db"
```

### Issue: "Permission denied"

**Solution**:
- Check user permissions in database
- Use read-only user for queries
- Grant necessary permissions

### Issue: "MCP config not found"

**Solution**:
```bash
# Create config directory
mkdir -p ~/.claude

# Create config file
touch ~/.claude/mcp.json

# Edit config
nano ~/.claude/mcp.json
```

---

## 📊 MCP Usage Examples

### Example 1: Database Health Check

**Ask Claude**:
```
"Check database health: find missing indexes, slow queries, and table sizes"
```

**Claude will**:
1. Query `pg_stat_user_indexes` for unused indexes
2. Query `pg_stat_statements` for slow queries
3. Query `pg_total_relation_size` for table sizes
4. Generate optimization report

### Example 2: Automated Testing

**Ask Claude**:
```
"Test the login flow: navigate to /login, enter test@example.com and password, click submit, verify redirect to /dashboard"
```

**Claude will**:
1. Open Puppeteer browser
2. Navigate to login page
3. Fill in credentials
4. Click submit
5. Verify navigation
6. Report results

### Example 3: Low Stock Alert

**Ask Claude**:
```
"Check for products below minimum stock and send Slack alert to #stock-alerts"
```

**Claude will**:
1. Query database for low stock products
2. Format message with product details
3. Send to Slack channel
4. Confirm delivery

---

## 🎓 Learning Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Building Custom MCP Servers](https://docs.anthropic.com/en/docs/build-with-claude/mcp)
- [MCP Security Guide](https://docs.anthropic.com/en/docs/build-with-claude/mcp#security)

---

## 📝 Maintenance

### Weekly Tasks
- [ ] Check MCP server versions
- [ ] Review security logs
- [ ] Rotate API tokens (if due)

### Monthly Tasks
- [ ] Update MCP server packages
- [ ] Review database query patterns
- [ ] Audit access permissions

### Quarterly Tasks
- [ ] Full security audit
- [ ] Performance benchmarking
- [ ] Update documentation

---

## 🚀 Next Steps

1. ✅ Set up PostgreSQL MCP (High Priority)
2. ✅ Set up Puppeteer MCP (High Priority)
3. ⏳ Set up Sentry MCP (Medium Priority)
4. ⏳ Set up Slack MCP (Medium Priority)
5. ⏳ Set up AWS S3 MCP (Low Priority)

**Estimated Total Setup Time**: 1-2 hours for all MCPs

---

**Last Updated**: 2025-11-11
**Maintained By**: Development Team
**Support**: See `MCP_CAPABILITIES.md` for advanced usage
