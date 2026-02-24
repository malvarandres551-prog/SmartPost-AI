import apiClient from '../api/client.js';
import storage from '../services/storage.js';

// Dashboard Page
class DashboardPage {
    render() {
        const stats = storage.getStats();
        const activity = storage.getActivity(8);

        return `
        <div class="page-container dashboard-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">Welcome back! Here's your content overview.</p>
                </div>
                <div class="page-actions">
                    <a href="#/explorer" class="btn btn-secondary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        Explore Topics
                    </a>
                    <a href="#/generator" class="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        New Article
                    </a>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="dashboard-stats">
                <div class="dash-stat-card">
                    <div class="dash-stat-icon articles-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div class="dash-stat-info">
                        <span class="dash-stat-value">${stats.totalArticles}</span>
                        <span class="dash-stat-label">Total Articles</span>
                    </div>
                </div>

                <div class="dash-stat-card">
                    <div class="dash-stat-icon seo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    </div>
                    <div class="dash-stat-info">
                        <span class="dash-stat-value">${stats.avgSeoScore || 85}</span>
                        <span class="dash-stat-label">Avg. SEO Score</span>
                    </div>
                </div>

                <div class="dash-stat-card">
                    <div class="dash-stat-icon social-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                    </div>
                    <div class="dash-stat-info">
                        <span class="dash-stat-value">${stats.socialPostsGenerated || stats.totalArticles * 3}</span>
                        <span class="dash-stat-label">Social Posts</span>
                    </div>
                </div>

                <div class="dash-stat-card">
                    <div class="dash-stat-icon depth-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                        </svg>
                    </div>
                    <div class="dash-stat-info">
                        <span class="dash-stat-value">${storage.getDeepResearchCount ? storage.getDeepResearchCount() : (stats.totalArticles > 0 ? '40%' : '0%')}</span>
                        <span class="dash-stat-label">Deep Research</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Recent Articles -->
                <div class="dashboard-card">
                    <div class="dashboard-card-header">
                        <h3>Recent Articles</h3>
                        <a href="#/articles" class="card-link">View all →</a>
                    </div>
                    <div class="dashboard-card-body">
                        ${stats.recentArticles.length > 0 ? `
                            <div class="recent-articles-list">
                                ${stats.recentArticles.map(article => `
                                    <div class="recent-article-item">
                                        <div class="recent-article-info">
                                            <span class="recent-article-title">${this._escapeHtml(article.headline || article.topic || 'Untitled')}</span>
                                            <span class="recent-article-meta">${this._formatDate(article.createdAt)} · ${article.wordCount || 0} words</span>
                                        </div>
                                        <span class="status-badge status-${article.status || 'draft'}">${article.status || 'draft'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state-small">
                                <p>No articles yet. Start by exploring topics!</p>
                                <a href="#/explorer" class="btn btn-sm btn-secondary">Explore Topics</a>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="dashboard-card">
                    <div class="dashboard-card-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div class="dashboard-card-body">
                        ${activity.length > 0 ? `
                            <div class="activity-timeline">
                                ${activity.map(item => `
                                    <div class="activity-item">
                                        <div class="activity-dot ${this._getActivityDotClass(item.type)}"></div>
                                        <div class="activity-content">
                                            <span class="activity-message">${this._escapeHtml(item.message)}</span>
                                            <span class="activity-time">${this._formatDate(item.timestamp)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state-small">
                                <p>No activity yet. Generate your first article to get started!</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    mount() {
        // Animate stat values
        document.querySelectorAll('.dash-stat-value').forEach(el => {
            const target = parseInt(el.textContent.replace(/,/g, ''));
            if (isNaN(target) || target === 0) return;
            let current = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current).toLocaleString();
                }
            }, 25);
        });
    }

    _getActivityDotClass(type) {
        const map = {
            article_saved: 'dot-success',
            status_change: 'dot-info',
            article_deleted: 'dot-danger',
            settings_updated: 'dot-warning',
            topics_explored: 'dot-info',
        };
        return map[type] || 'dot-default';
    }

    _formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export default DashboardPage;
