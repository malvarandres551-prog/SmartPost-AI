// API client for backend communication
const API_BASE_URL = '/api';

class ApiClient {
    // ── Trending Topics ───────────────────────────
    async getTrendingTopics(refresh = false) {
        try {
            const url = refresh ? `${API_BASE_URL}/trending?refresh=true` : `${API_BASE_URL}/trending`;
            console.log(`[ApiClient] Fetching trending topics from: ${url}`);
            const response = await fetch(url);
            console.log(`[ApiClient] Response status: ${response.status}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[ApiClient] Error in response:`, errorData);
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            const data = await response.json();
            console.log(`[ApiClient] Data received:`, data);
            return data;
        } catch (error) {
            console.error(`[ApiClient] Fetch error:`, error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Could not connect to backend server. Make sure it is running on port 3000.');
            }
            throw error;
        }
    }

    async searchTopics(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/trending?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Could not connect to backend server.');
            }
            throw error;
        }
    }

    // ── Research ──────────────────────────────────
    async getTopicResearch(topic, depth = 'standard') {
        const response = await fetch(`${API_BASE_URL}/research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, depth }),
        });
        if (!response.ok) throw new Error('Failed to fetch research');
        return response.json();
    }

    // ── Blog Generation ───────────────────────────
    async generateBlog(topic, research = null, options = {}) {
        const response = await fetch(`${API_BASE_URL}/generate-blog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, research, options }),
        });
        if (!response.ok) throw new Error('Failed to generate blog');
        return response.json();
    }

    // ── Articles CRUD ─────────────────────────────
    async getArticles() {
        const response = await fetch(`${API_BASE_URL}/articles`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        return response.json();
    }

    async saveArticle(article) {
        const response = await fetch(`${API_BASE_URL}/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(article),
        });
        if (!response.ok) throw new Error('Failed to save article');
        return response.json();
    }

    async updateArticle(id, updates) {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update article');
        return response.json();
    }

    async deleteArticle(id) {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete article');
        return response.json();
    }

    // ── Settings ──────────────────────────────────
    async getSettings() {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
    }

    async updateSettings(settings) {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to update settings');
        return response.json();
    }

    // ── Stats ─────────────────────────────────────
    async getStats() {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    }

    // ── Validation ────────────────────────────────
    async validateConfig() {
        const response = await fetch(`${API_BASE_URL}/validate`);
        if (!response.ok) throw new Error('Failed to validate');
        return response.json();
    }

    // ── AI Image Generation ───────────────────────
    async generateImage(id) {
        const response = await fetch(`${API_BASE_URL}/articles/${id}/generate-image`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to generate image');
        return response.json();
    }

    async publishArticle(id, platform) {
        const response = await fetch(`${API_BASE_URL}/articles/${id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to publish article');
        }
        return response.json();
    }
}

export default new ApiClient();
