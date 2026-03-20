import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import TrendingService from './services/trendingService.js';
import BlogGenerationService from './services/blogGenerationService.js';
import DataService from './services/dataService.js';
import publishingService from './services/publishingService.js';

// Load environment variables
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('--- Environment Check ---');
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY hash:', process.env.OPENAI_API_KEY.substring(0, 10), '...');
}
console.log('-------------------------');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const trendingService = new TrendingService();
const blogService = new BlogGenerationService();
const dataService = new DataService();

// Middleware
app.use(cors());
app.use(express.json());

// API Router
const apiRouter = express.Router();

// Rate limiting for API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
apiRouter.use(limiter);

const blogLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Blog generation limit reached. Please try again later.' },
});

// ═══════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════

// Health check
apiRouter.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SmartPost AI API',
    });
});

// ── Trending Topics ───────────────────────────────

apiRouter.get('/trending', async (req, res) => {
    try {
        const { q, refresh } = req.query;
        const forceRefresh = refresh === 'true';
        console.log(q ? `Searching topics for: ${q}` : `Fetching ${forceRefresh ? 'fresh ' : ''}trending topics...`);

        const topics = await trendingService.getTrendingTopics(q, forceRefresh);
        console.log(`[Backend] Returning ${topics.length} topics`);

        res.json({
            success: true,
            count: topics.length,
            topics,
            fetchedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in /api/trending:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending topics',
            message: error.message,
        });
    }
});

// ── Research ──────────────────────────────────────

apiRouter.post('/research', async (req, res) => {
    try {
        const { topic, depth } = req.body;
        if (!topic || !topic.title) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        console.log(`Researching topic: ${topic.title} (Depth: ${depth || 'standard'})`);
        const research = await trendingService.getTopicResearch(topic, depth);
        res.json({ success: true, research });
    } catch (error) {
        console.error('Error in /api/research:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topic research',
            message: error.message,
        });
    }
});

// ── Blog Generation ───────────────────────────────

apiRouter.post('/generate-blog', blogLimiter, async (req, res) => {
    try {
        const { topic, research, options } = req.body;
        if (!topic || !topic.title) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        console.log(`Generating blog for: ${topic.title}`);

        let researchData = research;
        if (!researchData) {
            researchData = await trendingService.getTopicResearch(topic);
        }

        const settings = dataService.getSettings();
        const blog = await blogService.generateBlog(topic, researchData, options, settings);
        res.json({ success: true, blog });
    } catch (error) {
        console.error('Error in /api/generate-blog:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate blog post',
            message: error.message,
        });
    }
});

// ── Articles CRUD ─────────────────────────────────

apiRouter.get('/articles', (req, res) => {
    try {
        const articles = dataService.getArticles();
        res.json({ success: true, articles });
    } catch (error) {
        console.error('Error in GET /api/articles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch articles' });
    }
});

apiRouter.post('/articles', (req, res) => {
    try {
        const article = dataService.saveArticle(req.body);
        res.json({ success: true, article });
    } catch (error) {
        console.error('Error in POST /api/articles:', error);
        res.status(500).json({ success: false, message: 'Failed to save article' });
    }
});

apiRouter.patch('/articles/:id', (req, res) => {
    try {
        const article = dataService.updateArticle(req.params.id, req.body);
        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        res.json({ success: true, article });
    } catch (error) {
        console.error('Error in PATCH /api/articles/:id:', error);
        res.status(500).json({ success: false, message: 'Failed to update article' });
    }
});

apiRouter.delete('/articles/:id', (req, res) => {
    try {
        const deleted = dataService.deleteArticle(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/articles/:id:', error);
        res.status(500).json({ success: false, message: 'Failed to delete article' });
    }
});

apiRouter.post('/articles/:id/generate-image', async (req, res) => {
    try {
        const { id } = req.params;
        const article = dataService.getArticles().find(a => a.id === id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const settings = dataService.getSettings();
        const imageUrl = await blogService.generateImage({ title: article.headline }, settings.openaiKey);

        const updatedArticle = dataService.updateArticle(id, { imageUrl });
        res.json({ success: true, imageUrl, article: updatedArticle });
    } catch (error) {
        console.error('Error in POST /api/articles/:id/generate-image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate image',
            message: error.message
        });
    }
});

apiRouter.post('/articles/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { platform } = req.body;

        const article = dataService.getArticles().find(a => a.id === id);
        if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

        const settings = dataService.getSettings();
        let result;

        if (platform === 'wordpress') {
            result = await publishingService.publishToWordPress(article, {
                url: settings.wpUrl,
                user: settings.wpUser,
                appPassword: settings.wpAppPassword,
            });
        } else if (platform === 'webhook') {
            result = await publishingService.triggerWebhook(article, settings.webhookUrl);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid platform' });
        }

        if (result.success) {
            dataService.updateArticle(id, { status: 'published' });
        }

        res.json(result);
    } catch (error) {
        console.error('Publishing failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Settings ──────────────────────────────────────

apiRouter.get('/settings', (req, res) => {
    try {
        const settings = dataService.getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error in GET /api/settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

apiRouter.put('/settings', (req, res) => {
    try {
        const settings = dataService.updateSettings(req.body);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error in PUT /api/settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// ── Stats ─────────────────────────────────────────

apiRouter.get('/stats', (req, res) => {
    try {
        const stats = dataService.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error in GET /api/stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// ── Validation ────────────────────────────────────

apiRouter.post('/validate-config', async (req, res) => {
    try {
        const { provider, key } = req.body;
        const isValid = await blogService.validateApiKey(provider, key);
        res.json({ success: isValid });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mount the API Router
app.use('/api', apiRouter);

// Handler for 404s within /api
apiRouter.use((req, res) => {
    console.log(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `No API route matched for: ${req.method} /api${req.url}`
    });
});

// ═══════════════════════════════════════════════════
// Error handling
// ═══════════════════════════════════════════════════

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found', message: `No API route matched for: ${req.method} ${req.url}` });
});

// Start server only if not in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 SmartPost AI API Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📈 Trending topics: http://localhost:${PORT}/api/trending`);
        console.log(`✍️  Generate blog: http://localhost:${PORT}/api/generate-blog`);
        console.log(`📁 Articles: http://localhost:${PORT}/api/articles`);
        console.log(`⚙️  Settings: http://localhost:${PORT}/api/settings\n`);
    });
}

export default app;
