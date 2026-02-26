import apiClient from '../api/client.js';
import storage from '../services/storage.js';

class BatchGeneratorPage {
    constructor() {
        this.topics = '';
        this.isProcessing = false;
        this.progress = []; // { topic, status, id, progress, error }
        this.settings = {
            tone: 'professional',
            length: 'medium',
            depth: 'standard'
        };
    }

    render() {
        const globalSettings = storage.getSettings();
        if (!this.isProcessing && this.topics === '') {
            this.settings.tone = globalSettings.defaultTone || 'professional';
            this.settings.length = globalSettings.defaultLength || 'medium';
        }

        return `
        <div class="page-container batch-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Batch Generation</h1>
                    <p class="page-subtitle">Generate multiple articles at once by providing a list of topics.</p>
                </div>
            </div>

            <div class="batch-layout">
                <div class="batch-config">
                    <div class="config-section">
                        <h3 class="config-title">Input Topics</h3>
                        <p class="config-desc">Enter one topic per line. We'll generate a full article for each.</p>
                        <textarea id="batchTopicsInput" class="form-textarea" rows="10" 
                            placeholder="e.g.\nAI in Healthcare\nFuture of Remote Work\nSustainability in Tech"
                            ${this.isProcessing ? 'disabled' : ''}>${this.topics}</textarea>
                    </div>

                    <div class="config-section">
                        <h3 class="config-title">Batch Settings</h3>
                        <div class="input-group">
                            <label class="form-label">Global Tone</label>
                            <select id="batchToneSelect" class="form-select" ${this.isProcessing ? 'disabled' : ''}>
                                <option value="professional" ${this.settings.tone === 'professional' ? 'selected' : ''}>Professional</option>
                                <option value="casual" ${this.settings.tone === 'casual' ? 'selected' : ''}>Casual</option>
                                <option value="authoritative" ${this.settings.tone === 'authoritative' ? 'selected' : ''}>Authoritative</option>
                                <option value="friendly" ${this.settings.tone === 'friendly' ? 'selected' : ''}>Friendly</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Global Length</label>
                            <select id="batchLengthSelect" class="form-select" ${this.isProcessing ? 'disabled' : ''}>
                                <option value="short" ${this.settings.length === 'short' ? 'selected' : ''}>Short (~800 words)</option>
                                <option value="medium" ${this.settings.length === 'medium' ? 'selected' : ''}>Medium (~1,200 words)</option>
                                <option value="long" ${this.settings.length === 'long' ? 'selected' : ''}>Long (~1,800 words)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Research Depth</label>
                            <div class="depth-options">
                                <label class="radio-label">
                                    <input type="radio" name="batchDepth" value="standard" ${this.settings.depth === 'standard' ? 'checked' : ''} ${this.isProcessing ? 'disabled' : ''}>
                                    Standard
                                </label>
                                <label class="radio-label" style="margin-left: 1rem;">
                                    <input type="radio" name="batchDepth" value="deep" ${this.settings.depth === 'deep' ? 'checked' : ''} ${this.isProcessing ? 'disabled' : ''}>
                                    Deep
                                </label>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-lg btn-block" id="startBatchBtn" ${this.isProcessing || !this.topics.trim() ? 'disabled' : ''}>
                        ${this.isProcessing ? 'Processing Batch...' : 'Start Batch Generation'}
                    </button>
                    
                    ${this.isProcessing ? `
                        <button class="btn btn-ghost btn-block" id="stopBatchBtn" style="margin-top:0.5rem; color:var(--color-danger);">
                            Stop Processing
                        </button>
                    ` : ''}
                </div>

                <div class="batch-status">
                    <div class="status-header">
                        <h3>Status Dashboard</h3>
                        <span class="status-count">${this.progress.length > 0 ? `${this.progress.filter(p => p.status === 'completed').length}/${this.progress.length} Completed` : 'Ready'}</span>
                    </div>
                    
                    <div class="progress-list" id="progressList">
                        ${this._renderProgressList()}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    mount() {
        const input = document.getElementById('batchTopicsInput');
        input?.addEventListener('input', (e) => {
            this.topics = e.target.value;
            const btn = document.getElementById('startBatchBtn');
            if (btn) btn.disabled = !this.topics.trim() || this.isProcessing;
        });

        document.getElementById('batchToneSelect')?.addEventListener('change', (e) => this.settings.tone = e.target.value);
        document.getElementById('batchLengthSelect')?.addEventListener('change', (e) => this.settings.length = e.target.value);

        document.querySelectorAll('input[name="batchDepth"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.depth = e.target.value;
            });
        });

        document.getElementById('startBatchBtn')?.addEventListener('click', () => this._startBatch());
        document.getElementById('stopBatchBtn')?.addEventListener('click', () => this._stopBatch());
    }

    async _startBatch() {
        if (this.isProcessing) return;

        const topicList = this.topics.split('\n').map(t => t.trim()).filter(t => t !== '');
        if (topicList.length === 0) return;

        this.isProcessing = true;
        this.progress = topicList.map(t => ({
            topic: t,
            status: 'pending',
            progress: 0,
            error: null
        }));

        this.renderToApp();

        // Process sequentially to avoid rate limits and browser strain
        for (let i = 0; i < this.progress.length; i++) {
            if (!this.isProcessing) break;

            const item = this.progress[i];
            item.status = 'generating';
            this._updateUI();

            try {
                // Fetch existing articles for interlinking context
                const existing = storage.getArticles().map(a => ({ id: a.id, headline: a.headline }));

                // 1. Fetch Research (Crucial for high-quality content)
                item.status = 'researching';
                this._updateUI();
                const researchResult = await apiClient.getTopicResearch({ title: item.topic }, this.settings.depth);

                // 2. Generate Blog
                item.status = 'generating';
                this._updateUI();
                const result = await apiClient.generateBlog(
                    { title: item.topic },
                    researchResult.research,
                    { tone: this.settings.tone, length: this.settings.length, researchDepth: this.settings.depth },
                    existing
                );

                if (result.success) {
                    let blogData = result.blog;

                    if (!blogData) {
                        throw new Error('Server returned success but no blog data was found');
                    }

                    // Post-process interlinking
                    if (existing.length > 0) {
                        blogData = this._processInternalLinks(blogData, existing);
                    }

                    // Save to storage first to get an ID
                    const saved = storage.saveArticle({
                        ...blogData,
                        topic: item.topic,
                        status: 'draft',
                        createdAt: new Date().toISOString()
                    });

                    // 3. Auto-generate Featured Image using article ID
                    try {
                        item.status = 'imaging';
                        this._updateUI();
                        const imageResult = await apiClient.generateImage(saved.id);
                        if (imageResult.imageUrl) {
                            saved.imageUrl = imageResult.imageUrl;
                            saved.featuredImage = imageResult.imageUrl;
                            storage.updateArticle(saved.id, {
                                imageUrl: imageResult.imageUrl,
                                featuredImage: imageResult.imageUrl
                            });
                        }
                    } catch (imgErr) {
                        console.warn(`[Batch] Image generation failed for ${item.topic}:`, imgErr);
                    }

                    item.status = 'completed';
                    item.id = saved.id;
                    item.progress = 100;
                } else {
                    throw new Error(result.error || 'Generation failed');
                }
            } catch (err) {
                console.error(`[Batch] Failed for ${item.topic}:`, err);
                item.status = 'error';
                item.error = err.message;
            }

            this._updateUI();
        }

        this.isProcessing = false;
        this.renderToApp();
    }

    _stopBatch() {
        this.isProcessing = false;
        this.renderToApp();
    }

    _updateUI() {
        const list = document.getElementById('progressList');
        const count = document.querySelector('.status-count');
        if (list) list.innerHTML = this._renderProgressList();
        if (count) {
            const completed = this.progress.filter(p => p.status === 'completed').length;
            count.textContent = `${completed}/${this.progress.length} Completed`;
        }
    }

    _renderProgressList() {
        if (this.progress.length === 0) {
            return '<div class="empty-progress">No active generation jobs. Enter topics and click "Start".</div>';
        }

        return this.progress.map(item => `
            <div class="progress-item status-${item.status}">
                <div class="progress-info">
                    <span class="progress-topic">${this._escapeHtml(item.topic)}</span>
                    <span class="progress-badge">${item.status.toUpperCase()}</span>
                </div>
                ${['researching', 'generating', 'imaging'].includes(item.status) ? `
                    <div class="progress-bar-wrap">
                        <div class="progress-bar-fill pulse"></div>
                    </div>
                ` : ''}
                ${item.status === 'completed' ? `
                    <div class="progress-actions">
                        <a href="#/generator?id=${item.id}" class="btn-text">View Article</a>
                    </div>
                ` : ''}
                ${item.status === 'error' ? `
                    <div class="progress-error">${this._escapeHtml(item.error)}</div>
                ` : ''}
            </div>
        `).join('');
    }

    _processInternalLinks(blog, existing) {
        // Safety: Ensure blog and blog.content exist
        if (!blog || !blog.content) return blog;

        const replaceLinks = (text) => {
            if (!text) return text;
            return text.replace(/\[LINK:([\w-]+)\]/g, (match, id) => {
                const article = existing.find(a => a.id === id);
                if (article) {
                    return `<a href="#/generator?id=${id}" class="internal-link" title="Read: ${article.headline}">${article.headline}</a>`;
                }
                return match;
            });
        };

        if (blog.content.introduction) blog.content.introduction = replaceLinks(blog.content.introduction);
        if (blog.content.conclusion) blog.content.conclusion = replaceLinks(blog.content.conclusion);
        if (blog.content.sections) {
            blog.content.sections.forEach(s => s.content = replaceLinks(s.content));
        }

        return blog;
    }

    _escapeHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    renderToApp() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.render();
            this.mount();
        }
    }
}

export default BatchGeneratorPage;
