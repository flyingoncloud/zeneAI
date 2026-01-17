# How to Clean Large Files from Git History

## Problem
GitHub rejected your push because `zene-edu/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node` (109.62 MB) exceeds the 100 MB limit.

The issue is that `node_modules` and `.next` directories were accidentally committed to Git history in previous commits.

## Solution: Use BFG Repo Cleaner

### Step 1: Install BFG Repo Cleaner

```bash
# On macOS with Homebrew
brew install bfg

# Or download directly
# Visit: https://rtyley.github.io/bfg-repo-cleaner/
```

### Step 2: Create a Fresh Clone (Backup)

```bash
# Create a backup of your current repo
cd ..
cp -r zeneAI zeneAI-backup

# Create a fresh bare clone for cleaning
git clone --mirror https://github.com/flyingoncloud/zeneAI.git zeneAI-clean.git
cd zeneAI-clean.git
```

### Step 3: Remove Large Files and Directories

```bash
# Remove all node_modules directories from history
bfg --delete-folders node_modules

# Remove all .next directories from history
bfg --delete-folders .next

# Remove files larger than 100MB
bfg --strip-blobs-bigger-than 100M
```

### Step 4: Clean Up and Garbage Collect

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Force Push to GitHub

```bash
git push --force
```

### Step 6: Update Your Local Repository

```bash
cd ../zeneAI
git fetch origin
git reset --hard origin/ai-chat-api
```

## Alternative: Simpler Approach (If You Don't Mind Losing History)

If you don't need the commit history on the `ai-chat-api` branch, you can:

1. Create a new branch from main/master
2. Copy only the files you need (excluding node_modules and .next)
3. Commit and push the new branch
4. Delete the old `ai-chat-api` branch

### Commands for Alternative Approach:

```bash
# Checkout main branch
git checkout main  # or master

# Create a new clean branch
git checkout -b ai-chat-api-clean

# Copy your latest changes (they're already in your working directory)
# The updated .gitignore will prevent node_modules and .next from being added

# Add only the files you want
git add ai-chat-api/
git add zeneme-next/
git add zeneAI-backend/
git add zeneAI-frontend/
git add *.md
git add .gitignore

# Check what's being added (make sure no node_modules or .next)
git status

# Commit
git commit -m "Clean commit: Add all project files without node_modules and build artifacts"

# Push the new branch
git push -u origin ai-chat-api-clean

# On GitHub, you can then:
# 1. Create a PR from ai-chat-api-clean to main
# 2. Or rename ai-chat-api-clean to ai-chat-api after deleting the old branch
```

## Prevention

The root `.gitignore` has been updated to include:
- `node_modules/`
- `.next/`
- Other common build artifacts

Make sure to run `npm install` or `yarn install` after cloning to regenerate node_modules locally.
