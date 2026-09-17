# 🚀 MindMesh Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Vercel account (for frontend)
- Render account (for backend)
- Google Gemini API key
- OpenRouter API key

---

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/aman-vrma/Mind-Mesh.git
cd Mind-Mesh
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp ../.env.example .env

# Add your API keys to .env:
# GEMINI_API_KEY=your_gemini_api_key
# OPENROUTER_API_KEY=your_openrouter_api_key

# Start server
node server.js
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd client
npm install

# Create .env.local file
cp .env.example .env.local

# For local development, use:
# VITE_API_URL=http://localhost:5000

# Start dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## ☁️ Production Deployment

### Backend (Render)

1. **Create New Web Service** on Render
2. **Connect GitHub Repository**
3. **Configure Build Settings:**
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && node server.js`
   - **Root Directory:** `/`

4. **Add Environment Variables:**
   - `GEMINI_API_KEY` = your_gemini_key
   - `OPENROUTER_API_KEY` = your_openrouter_key
   - `PORT` = 5000 (auto-configured by Render)

5. **Deploy** and copy your backend URL (e.g., `https://mind-mesh-x29v.onrender.com`)

### Frontend (Vercel)

1. **Import Project** from GitHub
2. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Add Environment Variables:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-render-backend-url.onrender.com`
   - **Scope:** Production, Preview, Development

4. **Deploy** and your frontend will be live!

---

## 🔑 API Keys

### Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy and add to backend `.env`

### Get OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create API key
3. Copy and add to backend `.env`

---

## ✅ Verify Deployment

### Backend Health Check
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "active",
  "platform": "MindMesh Orchestration Engine"
}
```

### Frontend Check
Visit your Vercel URL and try a simple task like "Hello"

---

## 🐛 Troubleshooting

### Backend not connecting
- Check Render logs
- Verify environment variables are set
- Ensure API keys are valid

### Frontend shows connection error
- Verify `VITE_API_URL` in Vercel
- Check backend is running (health check)
- Look at browser console for errors

### API rate limits
- Gemini has rate limits (15 RPM for free tier)
- Backend has automatic retry logic with exponential backoff

---

## 📊 Monitoring

- **Backend Logs:** Render Dashboard → Your Service → Logs
- **Frontend Logs:** Vercel Dashboard → Your Project → Logs
- **Runtime Errors:** Check browser console

---

## 🔄 Updates & Redeployment

```bash
# Make changes
git add .
git commit -m "Your update message"
git push origin main
```

Both Vercel and Render will auto-deploy on push to main branch.

---

Built with ❤️ by Aman Verma
