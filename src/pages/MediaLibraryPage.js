import storage from '../services/storage.js';

class MediaLibraryPage {
    constructor() {
        this.assets = [];
        this.filterType = 'all';
        this.searchQuery = '';
    }

    render() {
        this._loadAssets();

        return `
        <div class="page-container media-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Media Library</h1>
                    <p class="page-subtitle">Centralized management for your AI-generated featured images and visual assets.</p>
                </div>
            </div>

            <div class="media-toolbar">
                <div class="filter-tabs">
                    <button class="filter-tab ${this.filterType === 'all' ? 'active' : ''}" data-type="all">All Assets</button>
                    <button class="filter-tab ${this.filterType === 'image' ? 'active' : ''}" data-type="image">Featured Images</button>
                    <button class="filter-tab ${this.filterType === 'social' ? 'active' : ''}" data-type="social">Social Graphics</button>
                </div>
                <div class="search-input-wrap search-sm">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" id="mediaSearchInput" class="search-input" placeholder="Search by topic..." value="${this.searchQuery}">
                </div>
            </div>

            <div class="media-grid" id="mediaGrid">
                ${this._renderMediaItems()}
            </div>
        </div>
        `;
    }

    mount() {
        // Tab switching
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.filterType = tab.dataset.type;
                this.renderToApp();
            });
        });

        // Search
        document.getElementById('mediaSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this._renderMediaItemsSync();
        });

        // Copy/Download bindings
        this._bindAssetActions();
    }

    _loadAssets() {
        const articles = storage.getArticles();
        this.assets = [];

        articles.forEach(article => {
            if (article.featuredImage) {
                this.assets.push({
                    id: `img-${article.id}`,
                    url: article.featuredImage,
                    type: 'image',
                    topic: article.headline || article.topic,
                    date: article.createdAt,
                    articleId: article.id
                });
            }

            // In a future update, we could add social graphics here if generated as separate files
        });
    }

    _renderMediaItems() {
        let filtered = this.assets;

        if (this.filterType !== 'all') {
            filtered = filtered.filter(a => a.type === this.filterType);
        }

        if (this.searchQuery) {
            filtered = filtered.filter(a => {
                const topic = (a.topic || '').toLowerCase();
                return topic.includes(this.searchQuery);
            });
        }

        if (filtered.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                    </div>
                    <h3>No assets found</h3>
                    <p>Generate some articles with images to populate your library!</p>
                </div>
            `;
        }

        return filtered.map(asset => `
            <div class="media-card" data-id="${asset.id}">
                <div class="media-thumb">
                    <img src="${asset.url}" alt="${asset.topic}" loading="lazy">
                    <div class="media-overlay">
                        <div class="media-actions">
                            <button class="btn-icon copy-url-btn" data-url="${asset.url}" title="Copy URL">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                                </svg>
                            </button>
                            <a href="${asset.url}" target="_blank" class="btn-icon" title="View Fullsize">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="media-info">
                    <span class="media-topic">${asset.topic}</span>
                    <span class="media-meta">${new Date(asset.date).toLocaleDateString()} · ${asset.type === 'image' ? 'Featured Image' : 'Graphic'}</span>
                </div>
            </div>
        `).join('');
    }

    _renderMediaItemsSync() {
        const grid = document.getElementById('mediaGrid');
        if (grid) {
            grid.innerHTML = this._renderMediaItems();
            this._bindAssetActions();
        }
    }

    _bindAssetActions() {
        document.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    const icon = btn.innerHTML;
                    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                    setTimeout(() => { btn.innerHTML = icon; }, 2000);
                });
            });
        });
    }

    renderToApp() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.render();
            this.mount();
        }
    }
}

export default MediaLibraryPage;
