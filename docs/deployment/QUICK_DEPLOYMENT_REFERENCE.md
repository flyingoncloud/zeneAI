# Quick Deployment Reference Card

## 🏷️ Tag Information
- **Tag**: `v1.0.0-psychology-report-spec`
- **Branch**: `ai-chat-api-v2`
- **GitHub**: https://github.com/flyingoncloud/zeneAI

## 🚀 One-Command Deployment (EC2)

```bash
# Clone and setup
git clone https://github.com/flyingoncloud/zeneAI.git && \
cd zeneAI && \
git checkout v1.0.0-psychology-report-spec && \
cd ai-chat-api && \
chmod +x setup_database.sh && \
./setup_database.sh
```

## 📋 Essential Commands

### Database Setup
```bash
cd ai-chat-api
./setup_database.sh
```

### Backend Setup
```bash
cd ai-chat-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd zeneme-next
npm install
npm run dev
```

## 🔑 Required Configuration

Edit `ai-chat-api/.env`:
```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db
CORS_ORIGINS=http://localhost:3000,http://your-domain.com
```

## ✅ Verification

```bash
# Backend health
curl http://localhost:8000/

# Database tables
psql -U chat_user -d chat_db -h localhost -c "\dt"

# Frontend
open http://localhost:3000
```

## 📚 Full Documentation

- `DEPLOYMENT_GUIDE_v1.0.0.md` - Complete guide
- `GIT_TAG_DEPLOYMENT_SUMMARY.md` - Detailed summary
- `EC2_INSTANCE_RECOMMENDATIONS.md` - EC2 sizing

## 💰 Cost Estimates

- Budget: $30/month (t3.medium)
- Recommended: $70/month (m5.large)
- Production: $140/month (m5.xlarge)

## 🆘 Quick Troubleshooting

**Database error?**
```bash
cd ai-chat-api && ./setup_database.sh
```

**CORS error?**
```bash
# Check .env has: CORS_ORIGINS=http://localhost:3000
# Restart: python run.py
```

**Chinese fonts missing?**
```bash
sudo apt install -y fonts-noto-cjk
python test_chinese_fonts.py
```

## 📞 Support Files

- `REPORT_GENERATION_FIXES.md`
- `CHINESE_FONT_FIX.md`
- `MATPLOTLIB_BACKEND_FIX.md`
