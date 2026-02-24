import apiClient from '../api/client.js';
import storage from '../services/storage.js';

class ArticleGeneratorPage {
    constructor() {
        this.currentTopic = null;
        this.generatedBlog = null;
        this.isGenerating = false;
        this.activeTab = 'article'; // 'article', 'seo', 'social', 'visuals', 'newsletter'
        this.isEditing = false;
        this.isGeneratingImage = false;
        this.researchDepth = 'standard';
    }

    render() {
        const settings = storage.getSettings();

        // Check for topic passed from Explorer
        const storedTopic = sessionStorage.getItem('smartpost_selected_topic');
        if (storedTopic) {
            try {
                this.currentTopic = JSON.parse(storedTopic);
                sessionStorage.removeItem('smartpost_selected_topic');
            } catch { /* ignore */ }
        }

        return `
        <div class="page-container generator-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Article Generator</h1>
                    <p class="page-subtitle">Configure your article settings and generate AI-powered content.</p>
                </div>
            </div>

            <div class="generator-layout">
                <!-- Configuration Panel -->
                <div class="generator-config">
                    <div class="config-section">
                        <h3 class="config-title">Topic</h3>
                        <div class="input-group">
                            <input type="text" id="topicInput" class="form-input" 
                                placeholder="Enter a topic or use one from Explorer..."
                                value="${this._escapeHtml(this.currentTopic?.title || '')}">
                        </div>
                        <div class="input-group">
                            <label class="form-label">Description (optional)</label>
                            <textarea id="topicDescription" class="form-textarea" rows="3" 
                                placeholder="Add context or specific angle...">${this._escapeHtml(this.currentTopic?.description || '')}</textarea>
                        </div>
                        ${!this.currentTopic ? `
                            <a href="#/explorer" class="btn btn-sm btn-ghost" style="margin-top:0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                Browse Trending Topics
                            </a>
                        ` : ''}
                    </div>

                    <div class="config-section">
                        <h3 class="config-title">Article Settings</h3>
                        
                        <div class="input-group">
                            <label class="form-label">Tone</label>
                            <select id="toneSelect" class="form-select">
                                <option value="professional" ${settings.defaultTone === 'professional' ? 'selected' : ''}>Professional</option>
                                <option value="casual" ${settings.defaultTone === 'casual' ? 'selected' : ''}>Casual & Conversational</option>
                                <option value="authoritative" ${settings.defaultTone === 'authoritative' ? 'selected' : ''}>Authoritative</option>
                                <option value="friendly" ${settings.defaultTone === 'friendly' ? 'selected' : ''}>Friendly & Approachable</option>
                                <option value="technical" ${settings.defaultTone === 'technical' ? 'selected' : ''}>Technical & Detailed</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label class="form-label">Length</label>
                            <select id="lengthSelect" class="form-select">
                                <option value="short" ${settings.defaultLength === 'short' ? 'selected' : ''}>Short (~800 words)</option>
                                <option value="medium" ${settings.defaultLength === 'medium' ? 'selected' : ''}>Medium (~1,200 words)</option>
                                <option value="long" ${settings.defaultLength === 'long' ? 'selected' : ''}>Long (~1,800 words)</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label class="form-label">Research Depth</label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="depth" value="standard" ${this.researchDepth === 'standard' ? 'checked' : ''}>
                                    <span>Standard</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="depth" value="deep" ${this.researchDepth === 'deep' ? 'checked' : ''}>
                                    <span>Deep</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-lg generate-main-btn" id="generateBtn" ${this.isGenerating ? 'disabled' : ''}>
                        ${this.isGenerating ? `
                            <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                            <span>Generating...</span>
                        ` : `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            <span>Generate Article</span>
                        `}
                    </button>
                    
                    ${this.generatedBlog ? `
                        <div class="config-section" style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.5rem;">
                            <h3 class="config-title">Tools</h3>
                            <button class="btn btn-secondary btn-block" id="toggleEditBtn" style="width: 100%; justify-content: flex-start; margin-bottom: 0.5rem;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span>${this.isEditing ? 'Finish Editing' : 'Edit Content'}</span>
                            </button>
                            <button class="btn btn-secondary btn-block" id="generateImageBtn" style="width: 100%; justify-content: flex-start;" ${this.isGeneratingImage ? 'disabled' : ''}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <span>${this.isGeneratingImage ? 'Generating Image...' : 'Generate Featured Image'}</span>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <!-- Preview Panel -->
                <div class="generator-preview" id="previewPanel">
                    ${this.generatedBlog ? this._renderBlogPreview() : this._renderEmptyPreview()}
                </div>
            </div>
        </div>
        `;
    }

    mount() {
        document.getElementById('generateImageBtn')?.addEventListener('click', () => this._generateImage());

        // Research depth
        document.querySelectorAll('input[name="depth"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.researchDepth = e.target.value;
            });
        });

        this._bindPreviewActions();
    }

    async _generate() {
        const title = document.getElementById('topicInput')?.value?.trim();
        if (!title) {
            this._showToast('Please enter a topic', true);
            return;
        }

        this.isGenerating = true;
        this.renderToApp();

        try {
            const topic = {
                title,
                description: document.getElementById('topicDescription')?.value?.trim() || '',
                category: this.currentTopic?.category || 'General',
            };
            const options = {
                tone: document.getElementById('toneSelect')?.value || 'professional',
                length: document.getElementById('lengthSelect')?.value || 'medium',
                format: document.getElementById('formatSelect')?.value || 'blog-post',
                researchDepth: this.researchDepth,
            };

            const researchData = await apiClient.getTopicResearch(topic, this.researchDepth);
            const data = await apiClient.generateBlog(topic, researchData.research, options);
            this.generatedBlog = data.blog;
            this.activeTab = 'article';
            this.isEditing = false;
        } catch (error) {
            console.error('Generation failed:', error);
            this._showToast('Generation failed. Check your API configuration.', true);
        } finally {
            this.isGenerating = false;
            this.renderToApp();
            document.getElementById('previewPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async _generateImage() {
        if (!this.generatedBlog?.id && !this.generatedBlog?._localId) {
            // If it's not saved yet, we need to save it as a draft first to get an ID
            await this._saveDraft(true);
        }

        const id = this.generatedBlog.id || this.generatedBlog._localId;
        this.isGeneratingImage = true;
        this.renderToApp();

        try {
            const data = await apiClient.generateImage(id);
            this.generatedBlog.imageUrl = data.imageUrl;
            this._showToast('Featured image generated!');
        } catch (error) {
            console.error('Image generation failed:', error);
            this._showToast('Failed to generate image', true);
        } finally {
            this.isGeneratingImage = false;
            this.renderToApp();
        }
    }

    _toggleEdit() {
        this.isEditing = !this.isEditing;
        if (!this.isEditing) {
            // Save current state of editable areas back to the blog object
            const headline = document.getElementById('editableHeadline')?.innerText;
            const intro = document.getElementById('editableIntro')?.innerText;
            // Note: Section editing would be more complex, for now let's focus on top level
            if (headline) this.generatedBlog.headline = headline;
            if (intro) this.generatedBlog.content.introduction = intro;
        }
        this.renderToApp();
    }

    renderToApp() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.render();
            this.mount();
        }
    }

    _renderEmptyPreview() {
        return `
        <div class="preview-empty">
            <div class="preview-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
            </div>
            <h3>Article Preview</h3>
            <p>Your AI-powered content will appear here after generation.</p>
        </div>
        `;
    }

    _renderBlogPreview() {
        const blog = this.generatedBlog;
        return `
        <div class="blog-preview-content ${this.isEditing ? 'edit-mode-active' : ''}">
            <div class="preview-tabs">
                <div class="preview-tab ${this.activeTab === 'article' ? 'active' : ''}" data-tab="article">Article</div>
                <div class="preview-tab ${this.activeTab === 'seo' ? 'active' : ''}" data-tab="seo">SEO</div>
                <div class="preview-tab ${this.activeTab === 'social' ? 'active' : ''}" data-tab="social">Social</div>
                <div class="preview-tab ${this.activeTab === 'visuals' ? 'active' : ''}" data-tab="visuals">Visuals</div>
                <div class="preview-tab ${this.activeTab === 'newsletter' ? 'active' : ''}" data-tab="newsletter">Newsletter</div>
            </div>

            <div class="tab-content">
                ${this.activeTab === 'article' ? this._renderArticleView() : ''}
                ${this.activeTab === 'seo' ? this._renderSeoView() : ''}
                ${this.activeTab === 'social' ? this._renderSocialView() : ''}
                ${this.activeTab === 'visuals' ? this._renderVisualsView() : ''}
                ${this.activeTab === 'newsletter' ? this._renderNewsletterView() : ''}
            </div>

            <div class="blog-preview-actions">
                <button class="btn btn-primary" id="saveDraftBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Draft
                </button>
                <div style="display: flex; gap: 0.5rem; position: relative;">
                    <button class="btn btn-accent" id="publishDropdownBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 2 15 22 11 13 2 9 22 2"/><line x1="22" y1="2" x2="11" y2="13"/>
                        </svg>
                        Publish...
                    </button>
                    <div id="publishDropdown" class="dropdown-menu" style="display: none; position: absolute; bottom: 100%; right: 0; background: var(--color-bg-secondary); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.5rem; width: 200px; z-index: 100; margin-bottom: 0.5rem; box-shadow: var(--shadow-lg);">
                        <button class="btn btn-ghost btn-sm btn-block" style="width: 100%; text-align: left;" id="publishWPBtn">WordPress Draft</button>
                        <button class="btn btn-ghost btn-sm btn-block" style="width: 100%; text-align: left;" id="publishWebhookBtn">Trigger Webhook</button>
                    </div>
                </div>
                <button class="btn btn-secondary" id="copyBlogBtn">Copy Markdown</button>
                <button class="btn btn-secondary" id="downloadBlogBtn">Download .md</button>
                <button class="btn btn-ghost" id="regenerateBlogBtn">Regenerate</button>
            </div>
        </div>
        `;
    }

    _renderArticleView() {
        const blog = this.generatedBlog;
        const sections = blog.content?.sections || [];
        const takeaways = blog.content?.keyTakeaways || [];

        return `
        <div class="featured-image-container">
            ${blog.imageUrl ?
                `<img src="${blog.imageUrl}" class="featured-image" alt="Featured">` :
                `<div class="featured-image-empty">
                    <p>No featured image yet.</p>
                    <button class="btn btn-sm btn-accent" id="innerGenImageBtn">Generate with DALL-E 3</button>
                 </div>`
            }
        </div>

        <div class="blog-body">
            <h2 class="blog-headline" id="editableHeadline" contenteditable="${this.isEditing}">${this._escapeHtml(blog.headline)}</h2>
            <div class="blog-meta-info">
                <span>📖 ${blog.wordCount || 0} words</span>
                <span>⏱️ ${blog.readingTime || '5 min'} read</span>
            </div>
            <p><strong>Meta Description:</strong> ${this._escapeHtml(blog.metaDescription || '')}</p>
            <div id="editableIntro" contenteditable="${this.isEditing}">${this._escapeHtml(blog.content?.introduction || '')}</div>
            
            ${sections.map(s => `
                <h3 contenteditable="${this.isEditing}">${this._escapeHtml(s.heading)}</h3>
                <div contenteditable="${this.isEditing}">${this._escapeHtml(s.content)}</div>
            `).join('')}

            <h3 contenteditable="${this.isEditing}">Conclusion</h3>
            <div contenteditable="${this.isEditing}">${this._escapeHtml(blog.content?.conclusion || '')}</div>

            ${takeaways.length > 0 ? `
                <h3>Key Takeaways</h3>
                <ul>${takeaways.map(t => `<li contenteditable="${this.isEditing}">${this._escapeHtml(t)}</li>`).join('')}</ul>
            ` : ''}
        </div>
        `;
    }

    _renderSeoView() {
        const blog = this.generatedBlog;
        const readabilityScore = Math.min(100, Math.floor(60 + (blog.wordCount / 100))); // Mock algorithm

        return `
        <div class="seo-panel">
            <div class="seo-card">
                <div class="seo-score-circle">${readabilityScore}</div>
                <div class="seo-platform">Readability Score</div>
                <p class="form-hint">Flesch-Kincaid estimate based on structure.</p>
            </div>
            <div class="seo-card">
                <div class="seo-platform">Focus Keyword</div>
                <h4 style="color: var(--color-accent-secondary); margin: 0.5rem 0;">${this._escapeHtml(blog.focusKeyword || 'TBD')}</h4>
                <p class="form-hint">The primary search term this article targets.</p>
            </div>
        </div>

        <div class="seo-checklist-wrap">
            <h3 class="config-title">SEO Checklist</h3>
            <ul class="seo-checklist">
                ${(blog.seoChecklist || []).map(item => `
                    <li>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color:var(--color-success);">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        ${this._escapeHtml(item)}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="config-section">
            <h3 class="config-title">Secondary Keywords</h3>
            <div class="blog-tags">
                ${(blog.secondaryKeywords || []).map(k => `<span class="blog-tag">${this._escapeHtml(k)}</span>`).join('')}
            </div>
        </div>
        `;
    }

    _renderSocialView() {
        const snippets = this.generatedBlog.socialSnippets || {};
        const platforms = [
            { id: 'linkedin', name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
            { id: 'twitter', name: 'Twitter (X)', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
            { id: 'instagram', name: 'Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7.5 21h9c2.5 0 4.5-2 4.5-4.5v-9C21 5 19 3 16.5 3h-9C5 3 3 5 3 7.5v9C3 19 5 21 7.5 21z' }
        ];

        return `
        <div class="social-snippets">
            <!-- Viral Hooks -->
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="snippet-platform">Viral Hooks</span>
                </div>
                <div class="snippet-body hooks-list">
                    ${(snippets.viralHooks || []).map(hook => `
                        <div class="hook-item">
                            <p>${this._escapeHtml(hook)}</p>
                            <button class="btn btn-icon copy-hook-btn" data-text="${this._escapeHtml(hook)}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- LinkedIn -->
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="snippet-platform">LinkedIn Post</span>
                    <button class="btn btn-icon copy-social-btn" data-platform="linkedin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                </div>
                <div class="snippet-body">${this._escapeHtml(snippets.linkedin || 'No snippet generated.')}</div>
            </div>

            <!-- X Thread -->
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="snippet-platform">X (Twitter) Thread</span>
                    <button class="btn btn-icon copy-social-btn" data-platform="xThread">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                </div>
                <div class="snippet-body thread-list">
                    ${(snippets.xThread || []).map((tweet, i) => `
                        <div class="thread-tweet">
                            <span class="tweet-num">${i + 1}/${snippets.xThread.length}</span>
                            <p>${this._escapeHtml(tweet)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Instagram -->
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="snippet-platform">Instagram Caption</span>
                    <button class="btn btn-icon copy-social-btn" data-platform="instagram">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                </div>
                <div class="snippet-body">${this._escapeHtml(snippets.instagram || 'No snippet generated.')}</div>
            </div>
        </div>
        `;
    }

    _renderVisualsView() {
        const visuals = this.generatedBlog.visuals || {};
        return `
        <div class="visuals-panel">
            <div class="config-section">
                <h3 class="config-title">Infographic Outline</h3>
                <div class="visual-outline-card">
                    <div class="snippet-body">${this._escapeHtml(visuals.infographicOutline || 'No outline generated.')}</div>
                </div>
            </div>

            <div class="config-section">
                <h3 class="config-title">Suggested Image Captions</h3>
                <div class="captions-list">
                    ${(visuals.imageCaptions || []).map(caption => `
                        <div class="caption-item">
                            <p>${this._escapeHtml(caption)}</p>
                            <button class="btn btn-icon copy-text-btn" data-text="${this._escapeHtml(caption)}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `;
    }

    _renderNewsletterView() {
        const newsletter = this.generatedBlog.newsletter || '';
        return `
        <div class="newsletter-panel">
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="snippet-platform">Newsletter Format</span>
                    <button class="btn btn-icon copy-newsletter-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                </div>
                <div class="snippet-body newsletter-body">${this._escapeHtml(newsletter || 'No newsletter format generated.')}</div>
            </div>
        </div>
        `;
    }

    _bindPreviewActions() {
        // Tab switching
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                this.renderToApp();
            });
        });

        // Inner image gen
        document.getElementById('innerGenImageBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._generateImage();
        });

        // Publish dropdown
        const dropBtn = document.getElementById('publishDropdownBtn');
        const dropMenu = document.getElementById('publishDropdown');
        dropBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropMenu.style.display = dropMenu.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            if (dropMenu) dropMenu.style.display = 'none';
        });

        document.getElementById('publishWPBtn')?.addEventListener('click', () => this._publish('wordpress'));
        document.getElementById('publishWebhookBtn')?.addEventListener('click', () => this._publish('webhook'));

        // Social Copy
        document.querySelectorAll('.copy-social-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                let text = this.generatedBlog.socialSnippets[platform];
                if (Array.isArray(text)) text = text.join('\n\n');
                navigator.clipboard.writeText(text);
                this._showToast(`Snippet copied!`);
            });
        });

        document.querySelectorAll('.copy-hook-btn, .copy-text-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.text);
                this._showToast(`Copied!`);
            });
        });

        document.querySelector('.copy-newsletter-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(this.generatedBlog.newsletter);
            this._showToast(`Newsletter copied!`);
        });

        // Standard actions
        document.getElementById('saveDraftBtn')?.addEventListener('click', () => this._saveDraft());
        document.getElementById('copyBlogBtn')?.addEventListener('click', () => this._copyToClipboard());
        document.getElementById('downloadBlogBtn')?.addEventListener('click', () => this._downloadMarkdown());
        document.getElementById('regenerateBlogBtn')?.addEventListener('click', () => this._generate());
    }

    async _saveDraft(silent = false) {
        if (!this.generatedBlog) return;

        const blog = this.generatedBlog;
        const articleData = {
            id: blog.id || blog._localId,
            topic: blog.topic || blog.headline,
            headline: blog.headline,
            metaDescription: blog.metaDescription,
            content: blog.content,
            tags: blog.tags,
            wordCount: blog.wordCount,
            readingTime: blog.readingTime,
            sources: blog.sources,
            imageUrl: blog.imageUrl,
            focusKeyword: blog.focusKeyword,
            secondaryKeywords: blog.secondaryKeywords,
            socialSnippets: blog.socialSnippets,
            status: 'draft',
        };

        try {
            const result = await apiClient.saveArticle(articleData);
            this.generatedBlog.id = result.article.id;
            storage.saveArticle(result.article);
            if (!silent) this._showToast('Article saved as draft!');
        } catch (error) {
            if (!articleData.id) articleData._localId = `local_${Date.now()}`;
            storage.saveArticle(articleData);
            if (!silent) this._showToast('Saved locally (server unavailable)');
        }
    }

    async _copyToClipboard() {
        const md = this._generateMarkdown();
        try {
            await navigator.clipboard.writeText(md);
            this._showToast('Markdown copied to clipboard!');
        } catch {
            this._showToast('Failed to copy', true);
        }
    }

    _downloadMarkdown() {
        const md = this._generateMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this._slugify(this.generatedBlog?.headline || 'article')}.md`;
        a.click();
        URL.revokeObjectURL(url);
        this._showToast('Downloaded!');
    }

    _generateMarkdown() {
        const blog = this.generatedBlog;
        if (!blog) return '';
        const sections = blog.content?.sections || [];
        const takeaways = blog.content?.keyTakeaways || [];
        let md = `# ${blog.headline}\n\n`;
        if (blog.imageUrl) md += `![Featured Image](${blog.imageUrl})\n\n`;
        md += `**${blog.metaDescription || ''}**\n\n`;
        md += `*${blog.wordCount} words · ${blog.readingTime} read*\n\n`;
        md += `Focus Keyword: ${blog.focusKeyword || 'N/A'}\n\n`;
        md += `Tags: ${(blog.tags || []).join(', ')}\n\n---\n\n`;
        md += `${blog.content?.introduction || ''}\n\n`;
        sections.forEach(s => { md += `## ${s.heading}\n\n${s.content}\n\n`; });
        md += `## Conclusion\n\n${blog.content?.conclusion || ''}\n\n`;
        if (takeaways.length) {
            md += `## Key Takeaways\n\n`;
            takeaways.forEach(t => { md += `- ${t}\n`; });
        }
        return md;
    }

    async _publish(platform) {
        if (!this.generatedBlog?.id) {
            this._showToast('Please save as draft first', true);
            return;
        }

        const btn = document.getElementById('publishDropdownBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-sm"></span> Publishing...`;

        try {
            const result = await apiClient.publishArticle(this.generatedBlog.id, platform);
            if (result.success) {
                this._showToast(`Successfully published to ${platform}!`);
                if (result.url) {
                    setTimeout(() => window.open(result.url, '_blank'), 1500);
                }
            }
        } catch (error) {
            console.error('Publish error:', error);
            this._showToast(error.message, true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    _slugify(text) {
        return (text || '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    }

    _showToast(message, isError = false) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export default ArticleGeneratorPage;

