# Debug Environment Variable Not Being Picked Up

## Issue
After setting `NEXT_PUBLIC_API_URL=https://www.zenewe.ai` in `.env.local` and rebuilding, the app still uses `http://localhost:8000`.

## Possible Causes

### 1. `.env.local` File Format Issues

Check for these common problems:

```bash
# On EC2
cd /path/to/zeneme-next
cat -A .env.local
```

Look for:
- **Extra spaces**: `NEXT_PUBLIC_API_URL = https://...` (WRONG - no spaces around =)
- **Quotes**: `NEXT_PUBLIC_API_URL="https://..."` (Usually OK, but try without)
- **Line endings**: `^M` characters (Windows line endings - convert to Unix)
- **Missing newline at end**: File should end with a newline

**Correct format**:
```bash
NEXT_PUBLIC_API_URL=https://www.zenewe.ai
```

### 2. `.env.local` File Location

The file MUST be in the Next.js project root:

```bash
# Correct location
/path/to/zeneme-next/.env.local

# Wrong locations
/path/to/.env.local
/path/to/zeneme-next/src/.env.local
/path/to/zeneme-next/.next/.env.local
```

Verify:
```bash
cd /path/to/zeneme-next
ls -la .env.local
# Should show the file in current directory
```

### 3. Build Process Not Using `.env.local`

Check if the build process is reading the file:

```bash
cd /path/to/zeneme-next

# Add debug output to build
npm run build 2>&1 | grep -i "env\|public"
```

### 4. Multiple Environment Files

Next.js loads environment files in this order (later ones override earlier):
1. `.env` (all environments)
2. `.env.local` (all environments, ignored by git)
3. `.env.production` (production only)
4. `.env.production.local` (production only, ignored by git)

Check if other files are overriding:

```bash
cd /path/to/zeneme-next
ls -la .env*
```

If you see `.env.production` or `.env.production.local`, check their contents.

### 5. Build Cache Issues

Sometimes Next.js caches environment variables:

```bash
cd /path/to/zeneme-next

# Remove all caches
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build
```

## Step-by-Step Debug Process

### Step 1: Verify File Contents

```bash
cd /path/to/zeneme-next

# Check exact contents (including hidden characters)
cat -A .env.local

# Should show:
# NEXT_PUBLIC_API_URL=https://www.zenewe.ai$
# ($ indicates newline)
```

### Step 2: Fix File Format if Needed

```bash
# Create clean file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://www.zenewe.ai
NEXT_PUBLIC_PRODUCTION_MODE=true
EOF

# Verify
cat .env.local
```

### Step 3: Clean Build

```bash
# Remove everything
rm -rf .next node_modules/.cache

# Rebuild
npm run build

# Check build output for environment variables
npm run build 2>&1 | tee build.log
grep -i "public" build.log
```

### Step 4: Verify in Built Files

```bash
# Search for the value in built files
grep -r "https://www.zenewe.ai" .next/static/chunks/ | head -5

# If found, the env var is embedded correctly
# If not found, check for localhost:8000
grep -r "localhost:8000" .next/static/chunks/ | head -5
```

### Step 5: Check Runtime

```bash
# Restart the app
pm2 restart zeneme-next

# Check logs
pm2 logs zeneme-next --lines 50

# Look for any environment-related messages
```

## Alternative: Use next.config.ts

If `.env.local` continues to fail, you can hardcode it in `next.config.ts`:

```typescript
// zeneme-next/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'https://www.zenewe.ai',
    NEXT_PUBLIC_PRODUCTION_MODE: 'true',
  },
  // ... rest of config
};

export default nextConfig;
```

Then rebuild:
```bash
npm run build
pm2 restart zeneme-next
```

## Verification Commands

After rebuild, run these on EC2:

```bash
# 1. Check if localhost:8000 is still in build
cd /path/to/zeneme-next
grep -r "localhost:8000" .next/static/chunks/ | wc -l
# Should be 0

# 2. Check if production URL is in build
grep -r "zenewe.ai" .next/static/chunks/ | wc -l
# Should be > 0

# 3. Check build timestamp
ls -la .next/
# Should be recent (after you set .env.local)

# 4. Test in browser
# Open https://www.zenewe.ai
# Upload an image
# Check Network tab for the image URL
```

## If Still Not Working

Try this nuclear option:

```bash
cd /path/to/zeneme-next

# 1. Backup current state
cp -r .next .next.backup

# 2. Remove everything
rm -rf .next node_modules package-lock.json

# 3. Reinstall dependencies
npm install

# 4. Verify .env.local
cat .env.local

# 5. Build with verbose output
npm run build -- --debug

# 6. Restart
pm2 restart zeneme-next
```

## Contact for Help

If none of these work, provide:
1. Output of `cat -A .env.local`
2. Output of `ls -la .env*`
3. Output of `npm run build` (last 50 lines)
4. Output of `grep -r "localhost:8000" .next/static/chunks/ | wc -l`
5. Output of `grep -r "zenewe.ai" .next/static/chunks/ | wc -l`
