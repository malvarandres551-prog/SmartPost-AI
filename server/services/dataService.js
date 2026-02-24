import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// JSON-file persistence layer for articles and settings
class DataService {
    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        this.articlesPath = path.join(DATA_DIR, 'articles.json');
        this.settingsPath = path.join(DATA_DIR, 'settings.json');

        // Initialize files if they don't exist
        if (!fs.existsSync(this.articlesPath)) {
            this._writeJSON(this.articlesPath, []);
        }
        if (!fs.existsSync(this.settingsPath)) {
            this._writeJSON(this.settingsPath, {
                nicheKeywords: 'workforce,staffing,operations,business services,HR,recruitment,remote work,BPO',
                defaultTone: 'professional',
                defaultLength: 'medium',
                defaultFormat: 'blog-post',
                aiModel: 'gpt-4o-mini',
                wpUrl: '',
                wpUser: '',
                wpAppPassword: '',
                webhookUrl: '',
            });
        }
    }

    // ── Articles ──────────────────────────────────
    getArticles() {
        return this._readJSON(this.articlesPath, []);
    }

    saveArticle(article) {
        const articles = this.getArticles();
        const newArticle = {
            id: this._generateId(),
            ...article,
            status: article.status || 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        articles.unshift(newArticle);
        this._writeJSON(this.articlesPath, articles);
        return newArticle;
    }

    updateArticle(id, updates) {
        const articles = this.getArticles();
        const index = articles.findIndex(a => a.id === id);
        if (index === -1) return null;

        articles[index] = {
            ...articles[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this._writeJSON(this.articlesPath, articles);
        return articles[index];
    }

    deleteArticle(id) {
        const articles = this.getArticles();
        const filtered = articles.filter(a => a.id !== id);
        this._writeJSON(this.articlesPath, filtered);
        return filtered.length < articles.length;
    }

    // ── Settings ──────────────────────────────────
    getSettings() {
        return this._readJSON(this.settingsPath, {});
    }

    updateSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        this._writeJSON(this.settingsPath, updated);
        return updated;
    }

    // ── Stats ─────────────────────────────────────
    getStats() {
        const articles = this.getArticles();
        return {
            totalArticles: articles.length,
            draftCount: articles.filter(a => a.status === 'draft').length,
            publishedCount: articles.filter(a => a.status === 'published').length,
            totalWords: articles.reduce((sum, a) => sum + (a.wordCount || 0), 0),
        };
    }

    // ── Helpers ───────────────────────────────────
    _readJSON(filePath, defaultValue) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return defaultValue;
        }
    }

    _writeJSON(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }
}

export default DataService;
