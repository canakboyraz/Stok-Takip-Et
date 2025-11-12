# 🚀 CI/CD Pipeline Guide

## Overview

This project uses **GitHub Actions** for automated continuous integration and deployment. Every push and pull request triggers automated checks to ensure code quality, security, and performance.

---

## 📋 Pipeline Stages

### Workflow: `ci.yml`

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬───────────────┐
       │              │              │               │
       ▼              ▼              ▼               ▼
   ┌────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │  Lint  │   │Security │   │   Test   │   │ DB Check │
   └───┬────┘   └────┬────┘   └────┬─────┘   └─────┬────┘
       │             │              │               │
       └─────────────┴──────┬───────┴───────────────┘
                            ▼
                       ┌────────┐
                       │ Build  │
                       └────┬───┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌───────────┐  ┌──────────┐  ┌──────────┐
      │  Bundle   │  │Perf Check│  │  Deploy  │
      │ Analysis  │  │          │  │          │
      └───────────┘  └──────────┘  └──────────┘
```

---

## 🔍 Jobs Breakdown

### 1. **Lint & Format Check** (1-2 min)
- Runs ESLint on all TypeScript/TSX files
- Checks TypeScript compilation
- **Pass criteria**: No linting errors, TypeScript compiles

```bash
# Run locally
npm run lint
npm run type-check
```

### 2. **Security Audit** (1-2 min)
- Runs `npm audit` for dependency vulnerabilities
- Flags HIGH and CRITICAL vulnerabilities
- Uploads audit results as artifacts

```bash
# Run locally
npm audit
```

**Artifacts**: `npm-audit-results` (JSON format, 30 days retention)

### 3. **Automated Tests** (3-5 min)
- Runs all Jest tests with coverage
- Coverage threshold: 80% (functions, lines, statements), 75% (branches)
- Uploads coverage to Codecov
- **Pass criteria**: All tests pass, coverage meets threshold

```bash
# Run locally
npm run test:ci
npm run test:coverage
```

**Artifacts**: `coverage-report` (HTML/lcov, 30 days retention)

### 4. **Build Application** (2-3 min)
- Compiles TypeScript and bundles React app
- Creates production-optimized build
- **Pass criteria**: Build completes successfully

```bash
# Run locally
npm run build
```

**Artifacts**: `build-output` (build directory, 7 days retention)

### 5. **Bundle Size Analysis** (1 min, PR only)
- Analyzes JavaScript bundle size
- Comments on PR with size report
- **Pass criteria**: Informational only

**PR Comment Example**:
```
📦 Bundle Size Report
Total Build Size: 1.2MB
JS Bundle Size: 450KB

<details>
<summary>View detailed breakdown</summary>
main.chunk.js: 180KB
vendor.chunk.js: 270KB
</details>
```

### 6. **Database Migration Check** (< 1 min)
- Validates SQL syntax in migration files
- Checks for dangerous operations (DROP DATABASE)
- Lists all migration files
- **Pass criteria**: No dangerous SQL operations

### 7. **Dependency Check** (1 min, main branch only)
- Checks for outdated npm packages
- Reports major version updates available
- **Pass criteria**: Informational only

### 8. **Performance Budget** (< 1 min)
- Enforces bundle size limits:
  - JS Bundle: ≤ 500KB
  - CSS Bundle: ≤ 50KB
  - Total: ≤ 2MB
- **Pass criteria**: All budgets met

### 9. **Deploy to Production** (2-5 min, main branch only)
- Triggers on merge to `main`
- Deploys to production environment
- **Pass criteria**: All previous jobs pass

### 10. **Deploy to Staging** (2-5 min, develop branch only)
- Triggers on push to `develop`
- Deploys to staging environment
- **Pass criteria**: Build and test jobs pass

---

## 📊 Workflow Status

### Check Status

View workflow runs:
```bash
https://github.com/YOUR-USERNAME/Stok-Takip-Et/actions
```

### Branch Protection Rules

Recommended settings for `main` branch:
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass:
  - `lint`
  - `test`
  - `build`
  - `performance-budget`
- ✅ Require branches to be up to date
- ✅ Include administrators

---

## 🔐 Secrets Configuration

Required GitHub Secrets (Settings → Secrets → Actions):

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `CODECOV_TOKEN` | Codecov upload token | Code coverage reports |
| `DEPLOYMENT_TOKEN` | Hosting platform token | Production deployment |
| `SUPABASE_URL` | Supabase project URL | (Optional) Integration tests |
| `SUPABASE_ANON_KEY` | Supabase anon key | (Optional) Integration tests |

### Setting Secrets

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

---

## 🎯 Triggering Workflows

### Automatic Triggers

**Main CI Workflow** (`.github/workflows/ci.yml`):
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**CodeQL Security** (`.github/workflows/codeql.yml`):
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Schedule: Every Monday at 00:00 UTC

### Manual Trigger

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch and run

---

## 📝 Local CI Simulation

Run the same checks locally before pushing:

```bash
# 1. Lint check
npm run lint

# 2. Type check
npm run type-check

# 3. Run tests with coverage
npm run test:coverage

# 4. Security audit
npm audit

# 5. Build
npm run build

# 6. Check bundle size
npm run build:analyze
```

**Pre-commit Hook** (optional):
```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint && npm run type-check && npm test -- --watchAll=false
```

---

## 🚨 Troubleshooting

### Build Fails on CI but Works Locally

**Problem**: Different Node versions
```bash
# Check local version
node --version

# Match CI version (see ci.yml)
# CI uses: Node 18
```

**Solution**: Use `nvm` to match versions
```bash
nvm install 18
nvm use 18
npm ci
npm run build
```

### Tests Pass Locally but Fail on CI

**Problem**: Environment differences

**Solution**: Run tests in CI mode locally
```bash
CI=true npm test -- --coverage --watchAll=false
```

### Security Audit Fails

**Problem**: Vulnerable dependencies

**Solution**: Update dependencies
```bash
# Automatic fix (low/moderate)
npm audit fix

# Manual fix (high/critical)
npm audit
npm update <package-name>
```

### Bundle Size Exceeds Budget

**Problem**: Bundle too large

**Solution**: Implement lazy loading
```bash
# See PERFORMANCE_ANALYSIS_REPORT.md
# Implement React.lazy for routes
```

---

## 📈 Performance Metrics

### Current CI/CD Performance

| Metric | Target | Current |
|--------|--------|---------|
| Total Pipeline Time | < 15 min | ~12 min |
| Test Execution | < 5 min | ~3 min |
| Build Time | < 3 min | ~2 min |
| Deploy Time | < 5 min | N/A (not configured) |

### Optimization Tips

1. **Cache Dependencies**
   - Already enabled via `cache: 'npm'` in setup-node
   - Reduces install time from 2 min to 30 sec

2. **Parallel Jobs**
   - Lint, Security, Test run in parallel
   - Reduces total time by 60%

3. **Skip Redundant Jobs**
   - Use `if` conditions to skip jobs
   - Example: Bundle analysis only on PR

---

## 🔄 Deployment Strategies

### Production Deployment (Main Branch)

**Strategy**: Blue-Green Deployment
1. Build new version
2. Deploy to green environment
3. Run smoke tests
4. Switch traffic to green
5. Keep blue for rollback

**Platforms Supported**:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Firebase Hosting
- GitHub Pages

### Staging Deployment (Develop Branch)

**Strategy**: Continuous Deployment
- Every push to `develop` deploys to staging
- Automatic database migrations
- Feature flags for testing

---

## 📊 Monitoring & Alerts

### GitHub Actions Notifications

**Email Notifications**:
- Workflow failures
- Deployment status

**Slack Integration** (optional):
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Status Badges

Add to README.md:
```markdown
![CI](https://github.com/YOUR-USERNAME/Stok-Takip-Et/workflows/CI/badge.svg)
![CodeQL](https://github.com/YOUR-USERNAME/Stok-Takip-Et/workflows/CodeQL/badge.svg)
```

---

## 🎓 Best Practices

### Commit Messages

Use conventional commits:
```
feat: add lazy loading for routes
fix: resolve bundle size issue
test: add component tests for Login
docs: update CI/CD guide
chore: update dependencies
```

### Pull Request Workflow

1. Create feature branch: `feature/my-feature`
2. Make changes
3. Run local checks: `npm run lint && npm test`
4. Push and create PR
5. Wait for CI checks
6. Address any failures
7. Request review
8. Merge after approval

### Handling Failed Checks

1. **View logs**: Click "Details" on failed check
2. **Reproduce locally**: Run same command
3. **Fix issue**: Make changes
4. **Push fix**: CI re-runs automatically

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Integration](https://docs.codecov.com/docs)
- [CodeQL Security](https://codeql.github.com/)
- [Bundle Analysis](https://create-react-app.dev/docs/analyzing-the-bundle-size/)

---

## 🔧 Customization

### Adding New Jobs

Edit `.github/workflows/ci.yml`:

```yaml
new-job:
  name: My New Job
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: echo "Hello World"
```

### Changing Deployment Target

Update `deploy-production` job:

```yaml
- name: Deploy to Vercel
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Adding Pre-release Channel

Create new workflow: `.github/workflows/prerelease.yml`

---

**Last Updated**: 2025-11-11
**Maintainer**: Development Team
**CI/CD Platform**: GitHub Actions
