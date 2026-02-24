// localStorage persistence layer
class StorageService {
    constructor() {
        this.KEYS = {
            ARTICLES: 'smartpost_articles',
            SETTINGS: 'smartpost_settings',
            ACTIVITY: 'smartpost_activity',
        };
    }

    // ── Articles ──────────────────────────────────
    getArticles() {
        return this._get(this.KEYS.ARTICLES, []);
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
        this._set(this.KEYS.ARTICLES, articles);
        this.logActivity('article_saved', `Saved article: "${newArticle.headline || newArticle.topic}"`);
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
        this._set(this.KEYS.ARTICLES, articles);

        if (updates.status) {
            this.logActivity('status_change', `Marked "${articles[index].headline || articles[index].topic}" as ${updates.status}`);
        }
        return articles[index];
    }

    deleteArticle(id) {
        const articles = this.getArticles();
        const article = articles.find(a => a.id === id);
        const filtered = articles.filter(a => a.id !== id);
        this._set(this.KEYS.ARTICLES, filtered);
        if (article) {
            this.logActivity('article_deleted', `Deleted article: "${article.headline || article.topic}"`);
        }
        return true;
    }

    getArticleById(id) {
        return this.getArticles().find(a => a.id === id) || null;
    }

    // ── Settings ──────────────────────────────────
    getSettings() {
        return this._get(this.KEYS.SETTINGS, {
            nicheKeywords: 'workforce,staffing,operations,business services,HR,recruitment,remote work,BPO',
            defaultTone: 'professional',
            defaultLength: 'medium',
            defaultFormat: 'blog-post',
        });
    }

    updateSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        this._set(this.KEYS.SETTINGS, updated);
        this.logActivity('settings_updated', 'Settings updated');
        return updated;
    }

    // ── Activity Log ──────────────────────────────
    getActivity(limit = 20) {
        const activity = this._get(this.KEYS.ACTIVITY, []);
        return activity.slice(0, limit);
    }

    logActivity(type, message) {
        const activity = this._get(this.KEYS.ACTIVITY, []);
        activity.unshift({
            id: this._generateId(),
            type,
            message,
            timestamp: new Date().toISOString(),
        });
        // Keep max 100 entries
        this._set(this.KEYS.ACTIVITY, activity.slice(0, 100));
    }

    // ── Stats ─────────────────────────────────────
    getStats() {
        const articles = this.getArticles();
        const activity = this.getActivity(100);

        const avgSeoScore = articles.length > 0
            ? Math.round(articles.reduce((sum, a) => sum + (a.seoScore || 85), 0) / articles.length)
            : 0;

        return {
            totalArticles: articles.length,
            draftCount: articles.filter(a => a.status === 'draft').length,
            publishedCount: articles.filter(a => a.status === 'published').length,
            totalWords: articles.reduce((sum, a) => sum + (a.wordCount || 0), 0),
            topicsExplored: activity.filter(a => a.type === 'topics_explored').length + articles.length,
            recentArticles: articles.slice(0, 5),
            avgSeoScore,
            socialPostsGenerated: articles.length * 4, // Each article has 4+ social pieces
        };
    }

    getDeepResearchCount() {
        const articles = this.getArticles();
        if (articles.length === 0) return '0%';
        const deepCount = articles.filter(a => a.researchDepth === 'deep').length;
        return `${Math.round((deepCount / articles.length) * 100)}%`;
    }

    // ── Internal Helpers ──────────────────────────
    _get(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    _set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }
}

export default new StorageService();
