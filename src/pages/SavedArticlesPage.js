import apiClient from '../api/client.js';
import storage from '../services/storage.js';

class SavedArticlesPage {
    constructor() {
        this.articles = [];
        this.filterStatus = 'all';
        this.searchQuery = '';
        this.selectedIds = new Set();
    }

    render() {
        return `
        <div class="page-container articles-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Saved Articles</h1>
                    <p class="page-subtitle">Manage your generated articles and track their status.</p>
                </div>
                <div class="page-actions">
                    <a href="#/generator" class="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New Article
                    </a>
                </div>
            </div>

            <div class="articles-filter-bar">
                <div class="filter-tabs">
                    <button class="filter-tab active" data-status="all">All</button>
                    <button class="filter-tab" data-status="draft">Drafts</button>
                    <button class="filter-tab" data-status="published">Published</button>
                </div>
                <div class="filter-right">
                    <div class="search-input-wrap search-sm">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input type="text" id="articleSearchInput" class="search-input" placeholder="Search articles...">
                    </div>
                    <button class="btn btn-danger btn-sm" id="bulkDeleteBtn" style="display:none;">Delete Selected</button>
                </div>
            </div>

            <div class="articles-list" id="articlesList"></div>
        </div>`;
    }

    mount() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterStatus = tab.dataset.status;
                this._renderArticles();
            });
        });
        document.getElementById('articleSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this._renderArticles();
        });
        document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => this._bulkDelete());
        this._loadArticles();
    }

    _loadArticles() {
        this.articles = storage.getArticles();
        this._renderArticles();
    }

    _renderArticles() {
        const list = document.getElementById('articlesList');
        if (!list) return;
        let filtered = this.articles;
        if (this.filterStatus !== 'all') filtered = filtered.filter(a => a.status === this.filterStatus);
        if (this.searchQuery) filtered = filtered.filter(a => (a.headline || '').toLowerCase().includes(this.searchQuery) || (a.topic || '').toLowerCase().includes(this.searchQuery));

        if (filtered.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3>No articles ${this.filterStatus !== 'all' ? 'with status "' + this.filterStatus + '"' : 'yet'}</h3><p>Generate your first article to see it here!</p>${this.filterStatus === 'all' && !this.searchQuery ? '<a href="#/generator" class="btn btn-primary" style="margin-top:1rem;">Generate First Article</a>' : ''}</div>`;
            return;
        }

        list.innerHTML = filtered.map((article, i) => `
            <div class="article-row" style="animation-delay:${i * 0.03}s">
                <div class="article-checkbox"><input type="checkbox" class="article-check" data-id="${article.id}" ${this.selectedIds.has(article.id) ? 'checked' : ''}></div>
                <div class="article-main">
                    <h4 class="article-title">${this._e(article.headline || article.topic || 'Untitled')}</h4>
                    <div class="article-meta"><span>${this._fmtDate(article.createdAt)}</span><span>·</span><span>${article.wordCount || 0} words</span></div>
                </div>
                <div class="article-status"><span class="status-badge status-${article.status || 'draft'}">${article.status || 'draft'}</span></div>
                <div class="article-actions">
                    <div style="position: relative; display: inline-block;">
                        <button class="btn-icon" title="Publish" data-action="publish-toggle" data-id="${article.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 2 15 22 11 13 2 9 22 2"/><line x1="22" y1="2" x2="11" y2="13"/>
                            </svg>
                        </button>
                        <div id="publishDrop-${article.id}" class="dropdown-menu row-dropdown" style="display: none; position: absolute; top: 100%; right: 0; background: var(--color-bg-secondary); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.5rem; width: 160px; z-index: 100; box-shadow: var(--shadow-lg);">
                            <button class="btn btn-ghost btn-sm btn-block" style="width: 100%; text-align: left;" data-action="publish-wp" data-id="${article.id}">WordPress</button>
                            <button class="btn btn-ghost btn-sm btn-block" style="width: 100%; text-align: left;" data-action="publish-webhook" data-id="${article.id}">Webhook</button>
                        </div>
                    </div>
                    <button class="btn-icon" title="Toggle status" data-action="toggle" data-id="${article.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></button>
                    <button class="btn-icon" title="Download" data-action="download" data-id="${article.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>
                    <button class="btn-icon btn-icon-danger" title="Delete" data-action="delete" data-id="${article.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const { action, id } = btn.dataset;
                if (action === 'publish-toggle') {
                    const menu = document.getElementById(`publishDrop-${id}`);
                    document.querySelectorAll('.row-dropdown').forEach(m => { if (m !== menu) m.style.display = 'none'; });
                    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                }
                if (action === 'publish-wp') this._publish(id, 'wordpress');
                if (action === 'publish-webhook') this._publish(id, 'webhook');
                if (action === 'toggle') this._toggleStatus(id);
                if (action === 'download') this._downloadArticle(id);
                if (action === 'delete') this._deleteArticle(id);
            });
        });
        document.addEventListener('click', () => {
            document.querySelectorAll('.row-dropdown').forEach(m => m.style.display = 'none');
        });
        list.querySelectorAll('.article-check').forEach(cb => {
            cb.addEventListener('change', (e) => {
                e.target.checked ? this.selectedIds.add(e.target.dataset.id) : this.selectedIds.delete(e.target.dataset.id);
                document.getElementById('bulkDeleteBtn').style.display = this.selectedIds.size > 0 ? 'inline-flex' : 'none';
            });
        });
    }

    _toggleStatus(id) {
        const a = storage.getArticleById(id);
        if (!a) return;
        storage.updateArticle(id, { status: a.status === 'draft' ? 'published' : 'draft' });
        this._loadArticles();
    }

    _downloadArticle(id) {
        const a = storage.getArticleById(id);
        if (!a) return;
        let md = `# ${a.headline || a.topic}\n\n`;
        if (a.content?.introduction) md += `${a.content.introduction}\n\n`;
        (a.content?.sections || []).forEach(s => { md += `## ${s.heading}\n\n${s.content}\n\n`; });
        if (a.content?.conclusion) md += `## Conclusion\n\n${a.content.conclusion}\n\n`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const el = document.createElement('a');
        el.href = url; el.download = `${(a.headline || 'article').toLowerCase().replace(/\s+/g, '-').substring(0, 40)}.md`;
        el.click(); URL.revokeObjectURL(url);
    }

    _deleteArticle(id) {
        if (!confirm('Delete this article?')) return;
        storage.deleteArticle(id);
        this._loadArticles();
    }

    _bulkDelete() {
        if (!confirm(`Delete ${this.selectedIds.size} articles?`)) return;
        this.selectedIds.forEach(id => storage.deleteArticle(id));
        this.selectedIds.clear();
        document.getElementById('bulkDeleteBtn').style.display = 'none';
        this._loadArticles();
    }

    async _publish(id, platform) {
        try {
            const btn = document.querySelector(`[data-action="publish-toggle"][data-id="${id}"]`);
            btn.style.opacity = '0.5';
            btn.disabled = true;

            const result = await apiClient.publishArticle(id, platform);
            if (result.success) {
                this._toast(`Published to ${platform}!`);
                this._loadArticles();
                if (result.url) setTimeout(() => window.open(result.url, '_blank'), 1000);
            }
        } catch (error) {
            alert(`Publishing failed: ${error.message}`);
        } finally {
            this._loadArticles();
        }
    }

    _toast(msg) {
        const c = document.getElementById('toastContainer'); if (!c) return;
        const t = document.createElement('div'); t.className = 'toast toast-success'; t.textContent = msg;
        c.appendChild(t); setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 3000);
    }
    _fmtDate(d) {
        if (!d) return 'Unknown';
        const ms = Date.now() - new Date(d).getTime();
        const h = Math.floor(ms / 3600000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        if (h < 168) return `${Math.floor(h / 24)}d ago`;
        return new Date(d).toLocaleDateString();
    }

    _e(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
}

export default SavedArticlesPage;
