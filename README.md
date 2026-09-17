# 🧠 **MindMesh**

> **Where AI minds collaborate to produce better answers.**

MindMesh is a multi-AI orchestration platform where multiple AI models collaborate in real time. One AI analyzes and proposes a solution, another AI reviews it, and the orchestration engine synthesizes the final response.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://mind-mesh-one-mu.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-API-green?style=for-the-badge)](https://mind-mesh-x29v.onrender.com/api/health)

---

## ✨ Features

- 🤖 **Multi-AI Collaboration** - AI 1 (Architect) + AI 2 (Reviewer) workflow
- 🧠 **Intelligent Orchestration** - Convergence detection and multi-round refinement
- ⚡ **Real-time SSE Streaming** - Live updates as AIs collaborate
- 🔄 **Auto-Reconnection** - Smart retry logic with exponential backoff
- 💬 **Live Dialogue Visualization** - See AI-to-AI conversation in real-time
- 📊 **Collaboration Pipeline** - Visual progress tracking
- 📝 **AI-Generated Consensus** - Synthesized final answer
- 🕒 **Session History** - Persistent localStorage (last 20 sessions)
- 📱 **Mobile Responsive** - Works beautifully on all devices
- 🌐 **Cloud Deployment** - Production-ready on Vercel + Render

---

## 🏗️ Architecture

```
User
  ↓
MindMesh Orchestrator
  ↓
AI 1 (Gemini) → Initial Analysis
  ↓
AI 2 (OpenRouter) → Review + Convergence Check
  ↓
[If CONTINUE] → AI 1 Revision → AI 2 Re-evaluate
  ↓
[Loop up to 4 rounds or until AGREE]
  ↓
AI 1 → Final Synthesis
  ↓
User
```

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 19** - Modern UI library
- ⚡ **Vite 8** - Lightning-fast build tool
- 🎨 **Tailwind CSS 4** - Utility-first styling
- 🎯 **Lucide React** - Beautiful icons
- 📝 **React Markdown** - Rich text rendering
- 🔌 **Server-Sent Events** - Real-time streaming

### Backend
- 🟢 **Node.js** - JavaScript runtime
- 🚂 **Express 5** - Web framework
- 🤖 **Google Gemini** - AI Architect (via @google/genai)
- 🌐 **OpenRouter** - AI Reviewer (via OpenAI SDK)
- 🔄 **SSE Streaming** - Real-time event delivery
- 📊 **Smart Orchestration** - Multi-round collaboration logic

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get it here](https://aistudio.google.com/app/apikey))
- OpenRouter API key ([Get it here](https://openrouter.ai/keys))

### 1. Clone Repository
```bash
git clone https://github.com/aman-vrma/Mind-Mesh.git
cd Mind-Mesh
```

### 2. Setup Backend
```bash
cd server
npm install

# Create .env file
cp ../.env.example .env

# Add your API keys to .env
# GEMINI_API_KEY=your_key_here
# OPENROUTER_API_KEY=your_key_here

# Start server
node server.js
```

Server runs on `http://localhost:5000`

### 3. Setup Frontend
```bash
cd client
npm install

# Create environment file
cp .env.example .env.local

# .env.local content:
# VITE_API_URL=http://localhost:5000

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🌐 Live Demo

**Frontend:** [mind-mesh-one-mu.vercel.app](https://mind-mesh-one-mu.vercel.app/)  
**Backend API:** [mind-mesh-x29v.onrender.com](https://mind-mesh-x29v.onrender.com)

Try asking: *"Design a secure authentication system"* or *"Explain quantum computing"*

---

## 📁 Project Structure

```
MindMesh/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # UI Components
│   │   │   ├── AIAgentCard.jsx
│   │   │   ├── CollaborationTimeline.jsx
│   │   │   ├── FinalConsensus.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MessageComposer.jsx
│   │   │   ├── OrchestratorCore.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatusIndicator.jsx
│   │   ├── App.jsx           # Main App Component
│   │   ├── main.jsx          # Entry Point
│   │   └── index.css         # Global Styles
│   ├── .env.example          # Environment Template
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── config/               # Configuration
│   │   ├── constants.js
│   │   └── env.js
│   ├── orchestrator/         # AI Orchestration Logic
│   │   ├── orchestrator.js
│   │   ├── conversation.js
│   │   └── prompts.js
│   ├── providers/            # AI Provider Integrations
│   │   ├── gemini.provider.js
│   │   ├── openrouter.provider.js
│   │   └── provider.interface.js
│   ├── routes/               # API Routes
│   │   └── ai.routes.js
│   ├── services/             # Business Logic
│   │   └── ai.service.js
│   ├── utils/                # Utilities
│   │   └── logger.js
│   ├── server.js             # Entry Point
│   └── package.json
│
├── .env.example              # Root Environment Template
├── .gitignore
├── DEPLOYMENT.md             # Deployment Guide
└── README.md
```

---

## 🎯 How It Works

1. **User submits a task** via the message composer
2. **AI 1 (Gemini)** analyzes and creates initial proposal
3. **AI 2 (OpenRouter)** reviews, finds gaps, suggests improvements
4. **AI 1 revises** based on feedback (if needed)
5. **Loop continues** until AI 2 signals `CONVERGENCE: AGREE` or max rounds (4) reached
6. **Final synthesis** combines best of both perspectives
7. **User receives** thoroughly vetted, refined answer

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
PORT=5000
```

### Frontend (`client/.env.local`)
```env
VITE_API_URL=http://localhost:5000
```

For production (Vercel), set `VITE_API_URL` to your Render backend URL.

---

## 📚 API Documentation

### Health Check
```bash
GET /api/health
```
Response:
```json
{
  "status": "active",
  "platform": "MindMesh Orchestration Engine"
}
```

### Stream Task (SSE)
```bash
GET /api/ai/task/stream?task=your_question_here
```
Returns real-time Server-Sent Events with collaboration progress.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not connecting | Check API keys in `.env` and verify they're valid |
| Frontend shows CORS error | Ensure backend URL is correct in `VITE_API_URL` |
| "Connection lost" errors | Normal on free tiers - auto-retry will handle it |
| Gemini rate limit (503) | Backend has built-in retry logic, wait ~15s |
| Session history lost | Check localStorage is enabled in browser |

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- Backend: Deploy to Render (Node.js)
- Frontend: Deploy to Vercel (Vite)
- Set environment variables in respective dashboards

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎯 Roadmap

- [ ] Add more AI providers (Claude, GPT-4)
- [ ] Implement user authentication
- [ ] Add conversation export (PDF, Markdown)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] WebSocket for even faster streaming
- [ ] AI debate mode (3+ agents)
- [ ] Custom AI personas

---

## 💡 Vision

MindMesh explores a simple idea:

> Instead of relying on one AI model, what happens when multiple AI systems think, critique, and improve each other's responses?

MindMesh turns that collaboration into a visible, interactive experience.

---

## 👨‍💻 Author

**Aman Verma**

- GitHub: [@aman-vrma](https://github.com/aman-vrma)
- Project: [Mind-Mesh](https://github.com/aman-vrma/Mind-Mesh)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

Built with 😎 by Aman Verma
