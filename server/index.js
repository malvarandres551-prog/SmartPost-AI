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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

const blogLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Blog generation limit reached. Please try again later.',
});

// ═══════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SmartPost AI API',
    });
});

// ── Trending Topics ───────────────────────────────

app.get('/api/trending', async (req, res) => {
    try {
        const { q, refresh } = req.query;
        const forceRefresh = refresh === 'true';
        console.log(q ? `Searching topics for: ${q}` : `Fetching ${forceRefresh ? 'fresh ' : ''}trending topics...`);

        // Pass search query and force flag to service
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

app.post('/api/research', async (req, res) => {
    try {
        const { topic, depth } = req.body;
        if (!topic || !topic.title) {
            return res.status(400).json({ success: false, error: 'Topic is required' });
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

app.post('/api/generate-blog', blogLimiter, async (req, res) => {
    try {
        const { topic, research, options } = req.body;
        if (!topic || !topic.title) {
            return res.status(400).json({ success: false, error: 'Topic is required' });
        }

        console.log(`Generating blog for: ${topic.title}`);

        let researchData = research;
        if (!researchData) {
            researchData = await trendingService.getTopicResearch(topic);
        }

        // Fetch settings from dataService to get UI-configured API key and Model
        const settings = dataService.getSettings();
        const apiKey = settings.openaiKey;
        const aiModel = settings.aiModel;

        const blog = await blogService.generateBlog(topic, researchData, options, apiKey, aiModel);
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

app.get('/api/articles', (req, res) => {
    try {
        const articles = dataService.getArticles();
        res.json({ success: true, articles });
    } catch (error) {
        console.error('Error in GET /api/articles:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
});

app.post('/api/articles', (req, res) => {
    try {
        const article = dataService.saveArticle(req.body);
        res.json({ success: true, article });
    } catch (error) {
        console.error('Error in POST /api/articles:', error);
        res.status(500).json({ success: false, error: 'Failed to save article' });
    }
});

app.patch('/api/articles/:id', (req, res) => {
    try {
        const article = dataService.updateArticle(req.params.id, req.body);
        if (!article) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }
        res.json({ success: true, article });
    } catch (error) {
        console.error('Error in PATCH /api/articles/:id:', error);
        res.status(500).json({ success: false, error: 'Failed to update article' });
    }
});

app.delete('/api/articles/:id', (req, res) => {
    try {
        const deleted = dataService.deleteArticle(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/articles/:id:', error);
        res.status(500).json({ success: false, error: 'Failed to delete article' });
    }
});

app.post('/api/articles/:id/generate-image', async (req, res) => {
    try {
        const { id } = req.params;
        const article = dataService.getArticles().find(a => a.id === id);

        if (!article) {
            return res.status(404).json({ success: false, error: 'Article not found' });
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

app.post('/api/articles/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { platform } = req.body; // 'wordpress' or 'webhook'

        const article = dataService.getArticles().find(a => a.id === id);
        if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

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
            return res.status(400).json({ success: false, error: 'Invalid platform' });
        }

        if (result.success) {
            dataService.updateArticle(id, { status: 'published' });
        }

        res.json(result);
    } catch (error) {
        console.error('Publishing failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Settings ──────────────────────────────────────

app.get('/api/settings', (req, res) => {
    try {
        const settings = dataService.getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error in GET /api/settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', (req, res) => {
    try {
        const settings = dataService.updateSettings(req.body);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error in PUT /api/settings:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
});

// ── Stats ─────────────────────────────────────────

app.get('/api/stats', (req, res) => {
    try {
        const stats = dataService.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error in GET /api/stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// ── Validation ────────────────────────────────────

app.get('/api/validate', async (req, res) => {
    try {
        const openaiValid = await blogService.validateApiKey();
        const newsApiConfigured = !!process.env.NEWS_API_KEY;
        res.json({
            success: true,
            configuration: { openai: openaiValid, newsApi: newsApiConfigured },
            warnings: [
                !openaiValid && 'OpenAI API key is invalid or not configured',
                !newsApiConfigured && 'News API key is not configured (fallback topics will be used)',
            ].filter(Boolean),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Configuration validation failed', message: error.message });
    }
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
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 SmartPost AI API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📈 Trending topics: http://localhost:${PORT}/api/trending`);
    console.log(`✍️  Generate blog: http://localhost:${PORT}/api/generate-blog`);
    console.log(`📁 Articles: http://localhost:${PORT}/api/articles`);
    console.log(`⚙️  Settings: http://localhost:${PORT}/api/settings\n`);
});

export default app;
