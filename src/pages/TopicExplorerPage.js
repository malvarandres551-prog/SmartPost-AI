import apiClient from '../api/client.js';
import storage from '../services/storage.js';

// Topic Explorer Page
class TopicExplorerPage {
    constructor() {
        this.topics = [];
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.isLoading = false;
        this.selectedTopic = null;
        this.isScanning = false;
        this.scanResults = null;
    }

    render() {
        const settings = storage.getSettings();
        const nicheKeywords = (settings.nicheKeywords || '').split(',').map(k => k.trim()).filter(Boolean);

        return `
        <div class="page-container explorer-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Topic Explorer</h1>
                    <p class="page-subtitle">Discover trending topics in your niche and find inspiration for your next article.</p>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="explorer-search">
                <div class="search-input-wrap">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" id="topicSearchInput" class="search-input" placeholder="Search trending topics by keyword..." value="${this._escapeHtml(this.searchQuery)}">
                </div>
                <button class="btn btn-primary" id="searchBtn">Search</button>
                <button class="btn btn-ghost" id="refreshTopicsBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                    </svg>
                </button>
            </div>

            <!-- Niche Filter Chips -->
            <div class="filter-chips" id="filterChips">
                <button class="chip active" data-filter="all">All Topics</button>
                ${nicheKeywords.map(kw => `
                    <button class="chip" data-filter="${this._escapeHtml(kw)}">${this._escapeHtml(kw)}</button>
                `).join('')}
            </div>

            <!-- Results Grid -->
            <div class="topics-grid" id="explorerGrid">
                <div class="skeleton-card"></div>
            </div>

            <!-- Deep Scan Modal -->
            <div id="deepScanModal" class="modal-overlay" style="display: none;">
                <div class="modal-content deep-scan-modal">
                    <div class="modal-header">
                        <div class="modal-header-info">
                            <span class="badge badge-accent">Deep Insight Scan</span>
                            <h2 id="modalTopicTitle">Topic Title</h2>
                        </div>
                        <button class="btn-close" id="closeModalBtn">&times;</button>
                    </div>
                    <div class="modal-body" id="modalContent">
                        <!-- Content loaded dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="modalCloseBtn">Close</button>
                        <button class="btn btn-primary" id="modalUseTopicBtn">Use This Topic →</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    mount() {
        // Search
        const searchInput = document.getElementById('topicSearchInput');
        const searchBtn = document.getElementById('searchBtn');
        const refreshBtn = document.getElementById('refreshTopicsBtn');

        searchBtn?.addEventListener('click', () => this._handleSearch());
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._handleSearch();
        });
        refreshBtn?.addEventListener('click', () => this._loadTopics(true));

        // Filter chips
        document.getElementById('filterChips')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            this.activeFilter = chip.dataset.filter;
            this._renderTopics();
        });

        // Modal Close
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this._hideModal());
        document.getElementById('modalCloseBtn')?.addEventListener('click', () => this._hideModal());
        document.getElementById('deepScanModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'deepScanModal') this._hideModal();
        });

        document.getElementById('modalUseTopicBtn')?.addEventListener('click', () => {
            if (this.selectedTopic) {
                sessionStorage.setItem('smartpost_selected_topic', JSON.stringify(this.selectedTopic));
                window.location.hash = '#/generator';
            }
        });

        // Load topics
        this._loadTopics();

        // log activity
        storage.logActivity('topics_explored', 'Visited Topic Explorer');
    }

    async _handleSearch() {
        const input = document.getElementById('topicSearchInput');
        const searchBtn = document.getElementById('searchBtn');

        this.searchQuery = input?.value?.trim() || '';

        // Visual feedback for search button
        if (searchBtn) {
            const originalText = searchBtn.innerText;
            searchBtn.innerText = '...';
            searchBtn.disabled = true;
            await this._loadTopics();
            searchBtn.innerText = originalText;
            searchBtn.disabled = false;
        } else {
            await this._loadTopics();
        }
    }

    async _loadTopics(isRefresh = false) {
        const grid = document.getElementById('explorerGrid');
        const refreshBtn = document.getElementById('refreshTopicsBtn');
        if (!grid) return;

        grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
        this.isLoading = true;

        if (refreshBtn && isRefresh) {
            refreshBtn.classList.add('spin');
        }

        try {
            const data = this.searchQuery
                ? await apiClient.searchTopics(this.searchQuery)
                : await apiClient.getTrendingTopics(isRefresh);

            this.topics = data.topics || [];

            // Cache successful results
            if (this.topics.length > 0 && !this.searchQuery) {
                localStorage.setItem('smartpost_cached_topics', JSON.stringify(this.topics));
            }

            this._renderTopics();
        } catch (error) {
            console.error('[TopicExplorer] Error loading topics:', error);

            // Try to load from cache
            const cached = localStorage.getItem('smartpost_cached_topics');
            if (cached && !this.searchQuery) {
                console.log('[TopicExplorer] Loading topics from local cache');
                this.topics = JSON.parse(cached);
                this._renderTopics();

                // Add a small notification that we're in offline mode
                const statusInfo = document.createElement('div');
                statusInfo.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 0.5rem; background: rgba(255,165,0,0.1); color: #ffa500; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem;';
                statusInfo.innerHTML = '⚠️ Currently showing cached topics. Start the server (using <b>start-app.bat</b>) for fresh data.';
                grid.prepend(statusInfo);
                return;
            }

            const isConnectionError = error.message.includes('connect') || error.message.includes('Server error: 502');

            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1; padding: 4rem 2rem;">
                    <div class="error-icon-wrap" style="margin-bottom:1.5rem; color:var(--color-error, #f43f5e);">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>
                        </svg>
                    </div>
                    <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">Failed to load topics. Please try again.</h3>
                    <p style="color:var(--color-text-dark); max-width:400px; margin: 0 auto 1.5rem auto;">
                        ${this._escapeHtml(error.message)}
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="btn btn-primary" id="uiRetryBtn">
                            Retry
                        </button>
                    </div>
                    ${isConnectionError ? `
                        <div style="margin-top:2rem; padding: 1.5rem; background: var(--color-bg-light); border-radius: 12px; border: 1px solid var(--color-border); text-align: left;">
                            <p style="font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text);">How to fix this quickly:</p>
                            <ol style="font-size:0.9rem; opacity:0.9; margin-bottom: 1rem; color: var(--color-text-dark); padding-left: 1.2rem;">
                                <li>Open the <b>SmartPost AI</b> folder on your computer.</li>
                                <li>Find and double-click <b>start-app.bat</b>.</li>
                                <li>Wait for the black window to say "SmartPost AI API Server running".</li>
                                <li>Click the <b>Retry</b> button above.</li>
                            </ol>
                            <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; border: 1px solid var(--color-border);">
                                > start-app.bat
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Binds the new retry button
            document.getElementById('uiRetryBtn')?.addEventListener('click', () => {
                this._loadTopics(true);
            });
        } finally {
            this.isLoading = false;
            if (refreshBtn) {
                refreshBtn.classList.remove('spin');
            }
        }
    }

    _renderTopics() {
        const grid = document.getElementById('explorerGrid');
        if (!grid) return;

        let filtered = this.topics;
        if (this.activeFilter !== 'all') {
            const kw = this.activeFilter.toLowerCase();
            filtered = this.topics.filter(t =>
                (t.title || '').toLowerCase().includes(kw) ||
                (t.description || '').toLowerCase().includes(kw) ||
                (t.category || '').toLowerCase().includes(kw)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-dark);">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>No topics found. Try a different search or filter.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map((topic, i) => `
            <div class="topic-card" data-index="${i}" style="animation-delay:${i * 0.04}s">
                <div class="topic-header">
                    <span class="topic-category">${this._escapeHtml(topic.category || 'Trending')}</span>
                    <div class="topic-score">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                        ${topic.trendScore || 0}
                    </div>
                </div>
                <h3 class="topic-title">${this._escapeHtml(topic.title)}</h3>
                <p class="topic-description">${this._escapeHtml(topic.description || 'Click to use this topic for article generation.')}</p>
                <div class="topic-footer">
                    <div class="topic-btn-group">
                        <button class="btn btn-sm btn-ghost deep-scan-btn" data-topic-index="${i}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v6M8 11h6"/>
                            </svg>
                            Deep Scan
                        </button>
                        <button class="btn btn-sm btn-accent use-topic-btn" data-topic-index="${i}">
                            Use Topic →
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind buttons
        grid.querySelectorAll('.use-topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.topicIndex);
                const topic = filtered[idx];
                if (topic) {
                    sessionStorage.setItem('smartpost_selected_topic', JSON.stringify(topic));
                    window.location.hash = '#/generator';
                }
            });
        });

        grid.querySelectorAll('.deep-scan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.topicIndex);
                const topic = filtered[idx];
                if (topic) this._showDeepScan(topic);
            });
        });
    }

    async _showDeepScan(topic) {
        this.selectedTopic = topic;
        this.isScanning = true;
        this.scanResults = null;

        const modal = document.getElementById('deepScanModal');
        const titleEl = document.getElementById('modalTopicTitle');
        const contentEl = document.getElementById('modalContent');

        if (!modal || !titleEl || !contentEl) return;

        titleEl.innerText = topic.title;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scroll

        contentEl.innerHTML = `
            <div class="scan-loading">
                <div class="scan-spinner"></div>
                <p>Analyzing industry trends and fetching data sources...</p>
                <div class="scan-progress-bar"><div class="scan-progress-fill"></div></div>
            </div>
        `;

        try {
            const data = await apiClient.getTopicResearch(topic, 'deep');
            this.scanResults = data.research;
            this._renderScanResults();
        } catch (error) {
            contentEl.innerHTML = `
                <div class="empty-state">
                    <p style="color:var(--color-error);">Scan failed: ${this._escapeHtml(error.message)}</p>
                    <button class="btn btn-secondary" onclick="document.getElementById('deepScanModal').style.display='none'">Close</button>
                </div>
            `;
        } finally {
            this.isScanning = false;
        }
    }

    _renderScanResults() {
        const contentEl = document.getElementById('modalContent');
        if (!contentEl || !this.scanResults) return;

        const { articles, summary } = this.scanResults;

        contentEl.innerHTML = `
            <div class="scan-results-layout">
                <div class="scan-summary-section">
                    <h3>Deep Analysis Summary</h3>
                    <div class="scan-summary-body">${this._escapeHtml(summary).replace(/\n/g, '<br>')}</div>
                </div>
                
                <div class="scan-sources-section">
                    <h3>Identified Sources (${articles.length})</h3>
                    <div class="scan-sources-list">
                        ${articles.map(a => `
                            <a href="${a.url}" target="_blank" class="scan-source-card">
                                <span class="source-name">${this._escapeHtml(a.source)}</span>
                                <span class="source-title">${this._escapeHtml(a.title)}</span>
                                <span class="source-date">${this._formatDate(a.publishedAt)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    _hideModal() {
        const modal = document.getElementById('deepScanModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    _formatDate(dateString) {
        if (!dateString) return 'Recent';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / 3600000);
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return `${Math.floor(diffHours / 24)}d ago`;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export default TopicExplorerPage;
