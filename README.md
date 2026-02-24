# SmartPost AI

**Find what's trending in your niche and transform it into a complete blog post in seconds. Research less, publish faster.**

SmartPost AI is an AI-powered application that automatically discovers trending topics in the workforce, operations, staffing, and business services niche, then generates complete, publication-ready blog articles with a single click.

![SmartPost AI](https://img.shields.io/badge/AI-Powered-14B8A6?style=for-the-badge) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

## ✨ Features

- 🔥 **Trending Topic Discovery** - Automatically finds trending topics from News API and industry RSS feeds
- 🤖 **AI-Powered Blog Generation** - Creates 1400-1800 word professional blog posts using GPT-4
- 🎨 **Beautiful Dark UI** - Modern, glassmorphism design with smooth animations
- 📊 **Niche-Focused** - Specialized for workforce, staffing, HR, and business services content
- 📋 **Copy & Download** - Export blogs as Markdown or copy to clipboard
- ⚡ **Fast & Efficient** - Generate complete articles in under 30 seconds
- 🔄 **Regenerate Options** - Create multiple variations of the same topic

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **News API Key** ([Get one here](https://newsapi.org/)) - Optional but recommended

### Installation

1. **Clone or navigate to the project directory**

\`\`\`bash
cd "C:\\Users\\User\\SmartPost AI"
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Configure environment variables**

Copy the example environment file and add your API keys:

\`\`\`bash
copy .env.example .env
\`\`\`

Edit `.env` and add your API keys:

\`\`\`env
OPENAI_API_KEY=sk-your-openai-api-key-here
NEWS_API_KEY=your-news-api-key-here
\`\`\`

4. **Start the application**

\`\`\`bash
npm start
\`\`\`

This will start both the backend API server (port 3000) and the frontend dev server (port 5173).

5. **Open your browser**

Navigate to: **http://localhost:5173**

## 📖 Usage

### 1. Explore Trending Topics

- The homepage displays trending topics from your niche
- Topics are automatically ranked by relevance and recency
- Click "Refresh" to fetch new trending topics

### 2. Select a Topic

- Click on any topic card to select it
- View the topic details and description

### 3. Generate Blog Post

- Click "Generate Blog Post" button
- Wait 20-30 seconds for AI to create your article
- The generated blog includes:
  - SEO-optimized headline
  - Meta description
  - 4-5 main sections with subheadings
  - Actionable insights and recommendations
  - Key takeaways
  - Source citations

### 4. Export Your Content

- **Copy to Clipboard** - Copy the entire blog as Markdown
- **Download Markdown** - Save as a .md file
- **Regenerate** - Create a different version

## 🛠️ API Endpoints

### Backend API (Port 3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/trending` | GET | Get trending topics |
| `/api/research` | POST | Get research for a topic |
| `/api/generate-blog` | POST | Generate blog post |
| `/api/validate` | GET | Validate API configuration |

### Example API Usage

\`\`\`javascript
// Get trending topics
const response = await fetch('http://localhost:3000/api/trending');
const data = await response.json();

// Generate blog
const blog = await fetch('http://localhost:3000/api/generate-blog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    topic: { title: 'AI in Recruitment', category: 'HR Tech' }
  })
});
\`\`\`

## 🎨 Technology Stack

### Frontend
- **Vite** - Fast build tool and dev server
- **Vanilla JavaScript** - No framework overhead
- **Modern CSS** - Glassmorphism, gradients, animations
- **Google Fonts** - Inter & Space Grotesk

### Backend
- **Express.js** - Web server and API
- **OpenAI API** - GPT-4 for blog generation
- **News API** - Trending topics discovery
- **Cheerio** - RSS feed parsing
- **Rate Limiting** - API protection

## 📁 Project Structure

\`\`\`
SmartPost AI/
├── server/
│   ├── index.js                    # Express server
│   ├── services/
│   │   ├── trendingService.js      # Trending topics discovery
│   │   └── blogGenerationService.js # AI blog generation
│   └── utils/
│       └── promptTemplates.js      # AI prompt templates
├── src/
│   ├── main.js                     # App initialization
│   ├── api/
│   │   └── client.js               # API client
│   ├── components/
│   │   ├── TrendingTopics.js       # Topics display component
│   │   ├── BlogGenerator.js        # Blog generation component
│   │   └── StatsDisplay.js         # Animated stats component
│   └── styles/
│       └── index.css               # Design system & styles
├── index.html                      # Main HTML file
├── package.json                    # Dependencies
├── vite.config.js                  # Vite configuration
└── .env                            # Environment variables
\`\`\`

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for blog generation |
| `NEWS_API_KEY` | ⚠️ Recommended | News API key for trending topics |
| `AI_MODEL` | No | AI model to use (default: gpt-4-turbo-preview) |
| `MAX_TOKENS` | No | Max tokens for generation (default: 3000) |
| `TEMPERATURE` | No | AI creativity (default: 0.7) |
| `PORT` | No | Server port (default: 3000) |
| `NICHE_KEYWORDS` | No | Comma-separated niche keywords |

### Customizing the Niche

Edit the `NICHE_KEYWORDS` in `.env` to focus on different topics:

\`\`\`env
NICHE_KEYWORDS=SaaS,startups,product management,growth hacking
\`\`\`

### 🚀 Quick Start (Windows)
Double-click the **`start-app.bat`** file in the project folder. This will automatically start both the backend server and the frontend interface for you.

### 🛠️ Manual Start
If you prefer using the terminal:
1. Open a terminal in the project folder.
2. Run `npm start`.
- Backend API
npm run server

# Terminal 2 - Frontend Dev Server
npm run dev
## 🔧 Development

### Run Development Servers Separately

\`\`\`bash
# Terminal 1 - Backend API
npm run server

# Terminal 2 - Frontend Dev Server
npm run dev
\`\`\`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

The production build will be in the `dist/` directory.

### Preview Production Build

\`\`\`bash
npm run preview
\`\`\`

## 🚨 Troubleshooting

### "Failed to fetch trending topics"

- Check that your `NEWS_API_KEY` is valid
- The app will use fallback topics if News API is unavailable
- Verify your internet connection

### "Failed to generate blog post"

- Verify your `OPENAI_API_KEY` is correct
- Check your OpenAI account has available credits
- Ensure you're not hitting rate limits (max 10 generations/hour)

### Port already in use

- Change the `PORT` in `.env` file
- Or kill the process using the port:
  \`\`\`bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  \`\`\`

## 💡 Tips for Best Results

1. **API Keys**: Use valid API keys for best performance
2. **Topic Selection**: Choose topics with clear, specific titles
3. **Content Review**: Always review and edit AI-generated content before publishing
4. **Rate Limits**: Be mindful of API rate limits (10 blogs/hour by default)
5. **Customization**: Edit the prompt templates in `server/utils/promptTemplates.js` for different writing styles

## 🤝 Sharing & Collaboration

### Option 1: Share on Local Network (Quickest)
If your colleagues are on the same Wi-Fi or Local Network:
1. Run `npm start` on your machine.
2. Look at the terminal output for the **Network URL** (e.g., `http://192.168.1.5:5173`).
3. Share that URL with your colleagues. They can open it in any browser on their device.
   - *Note: You may need to allow "Node.js" through your Windows Firewall if they can't connect.*

### Option 2: Professional Deployment (Netlify + Render)
To make the app available to anyone, anywhere, follow these steps:

#### 1. Backend (Render)
1. Sign up/Login to [Render](https://render.com/).
2. Create a new **Web Service** and connect this repository.
3. Set the **Start Command** to `node server/index.js`.
4. Add your `OPENAI_API_KEY` and `NEWS_API_KEY` to the **Environment Variables** tab.
5. Once deployed, copy your service URL (e.g., `https://smartpost-backend.onrender.com`).

#### 2. Frontend (Netlify)
1. Sign up/Login to [Netlify](https://www.netlify.com/).
2. Create a new site from your Git repository.
3. Set **Build Command** to `npm run build` and **Publish directory** to `dist`.
4. **Update API Proxy**:
   - Open [netlify.toml](file:///c:/Users/User/SmartPost%20AI/netlify.toml) in this project.
   - Replace `https://your-backend-url.onrender.com` with your actual Render URL.
   - Commit and push this change to your repository.
5. Netlify will deploy your frontend and automatically route all `/api` calls to your Render backend.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- News API for trending topics data
- Design inspiration from modern research platforms

---

**Built with ❤️ for content creators and workforce professionals**
