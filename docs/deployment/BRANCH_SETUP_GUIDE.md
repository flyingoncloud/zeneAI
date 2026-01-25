# Branch Setup Guide - ai-chat-api-v2

## Quick Start After Checking Out Branch

When you check out the `ai-chat-api-v2` branch, you need to install dependencies because `node_modules` is not tracked in git (which is correct).

### Frontend Setup (zeneme-next)

```bash
cd zeneme-next
npm install
npm run dev
```

The frontend will be available at: http://localhost:3000

### Backend Setup (ai-chat-api)

```bash
cd ai-chat-api

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the server
python run.py
```

The backend API will be available at: http://localhost:8000

### Why You Got the Error

**Error**: `Cannot find module 'next/dist/compiled/cookie'`

**Cause**: The `node_modules` directory was not present because:
1. `node_modules` is correctly in `.gitignore` (it should never be committed)
2. When you check out a branch, git doesn't create `node_modules`
3. You need to run `npm install` to download dependencies

**Solution**: Always run `npm install` after checking out a branch with a Node.js project.

### Complete Setup Checklist

- [ ] Check out branch: `git checkout ai-chat-api-v2`
- [ ] Install frontend dependencies: `cd zeneme-next && npm install`
- [ ] Install backend dependencies: `cd ai-chat-api && pip install -r requirements.txt`
- [ ] Configure backend: `cp ai-chat-api/.env.example ai-chat-api/.env` and edit
- [ ] Start backend: `cd ai-chat-api && python run.py`
- [ ] Start frontend: `cd zeneme-next && npm run dev`
- [ ] Access app: http://localhost:3000

### What's in .gitignore

These directories are correctly excluded from git:

```
# Node.js
node_modules/
.next/

# Python
__pycache__/
*.pyc
.env
venv/
*.db
```

This is **correct behavior** - dependencies should be installed locally, not committed to git.

### Troubleshooting

**Problem**: Frontend won't start, missing module errors
**Solution**:
```bash
cd zeneme-next
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Backend won't start, missing Python packages
**Solution**:
```bash
cd ai-chat-api
pip install -r requirements.txt
```

**Problem**: Backend database errors
**Solution**: The database is auto-created on first run. Just make sure you have the `.env` file configured.

### Branch Status

✅ All source code files committed
✅ All configuration files committed
✅ Dependencies listed in package.json and requirements.txt
✅ .gitignore properly configured
✅ Ready to run after `npm install` and `pip install`

The branch is working correctly - you just need to install dependencies after checkout!
