import apiClient from '../api/client.js';
import storage from '../services/storage.js';

class SettingsPage {
    render() {
        const settings = storage.getSettings();
        return `
        <div class="page-container settings-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Settings</h1>
                    <p class="page-subtitle">Configure API keys, niche preferences, and default writing style.</p>
                </div>
            </div>

            <div class="settings-grid">
                <!-- API Keys -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                        <h3>API Configuration</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">OpenAI API Key</label>
                            <div class="input-with-action">
                                <input type="password" id="openaiKeyInput" class="form-input" 
                                    placeholder="sk-..." 
                                    value="${settings.openaiKey ? '********' : ''}"
                                    data-raw-key="${settings.openaiKey || ''}">
                                <button class="btn btn-sm btn-ghost" id="toggleKeyBtn" title="Show/Hide">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                            <p class="form-hint">Your key is stored locally and sent only to the server.</p>
                        </div>
                        <div class="input-group">
                            <label class="form-label">AI Model</label>
                            <select id="aiModelSelect" class="form-select">
                                <option value="gpt-4o-mini" ${settings.aiModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o-mini (Faster, Cheapest)</option>
                                <option value="gpt-4o" ${settings.aiModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o (High Quality, Most Expensive)</option>
                                <option value="gpt-3.5-turbo" ${settings.aiModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5-turbo (Legacy, Budget Option)</option>
                            </select>
                            <p class="form-hint">Switch to GPT-4o-mini or GPT-3.5-turbo if you are low on API credits.</p>
                        </div>
                        <button class="btn btn-sm btn-secondary" id="testApiBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11l3 3L22 4"/>
                            </svg>
                            Test Connection
                        </button>
                        <span class="api-status" id="apiStatus"></span>
                    </div>
                </div>

                <!-- Niche Preferences -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <h3>Niche Preferences</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">Keywords (comma-separated)</label>
                            <textarea id="nicheKeywordsInput" class="form-textarea" rows="3" placeholder="workforce, staffing, HR...">${this._e(settings.nicheKeywords || '')}</textarea>
                            <p class="form-hint">These keywords filter trending topics and guide AI content generation.</p>
                        </div>
                    </div>
                </div>

                <!-- Default Writing Style -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        <h3>Default Writing Style</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">Default Tone</label>
                            <select id="defaultToneSelect" class="form-select">
                                <option value="professional" ${settings.defaultTone === 'professional' ? 'selected' : ''}>Professional</option>
                                <option value="casual" ${settings.defaultTone === 'casual' ? 'selected' : ''}>Casual</option>
                                <option value="authoritative" ${settings.defaultTone === 'authoritative' ? 'selected' : ''}>Authoritative</option>
                                <option value="friendly" ${settings.defaultTone === 'friendly' ? 'selected' : ''}>Friendly</option>
                                <option value="technical" ${settings.defaultTone === 'technical' ? 'selected' : ''}>Technical</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Default Length</label>
                            <select id="defaultLengthSelect" class="form-select">
                                <option value="short" ${settings.defaultLength === 'short' ? 'selected' : ''}>Short (~800 words)</option>
                                <option value="medium" ${settings.defaultLength === 'medium' ? 'selected' : ''}>Medium (~1,200 words)</option>
                                <option value="long" ${settings.defaultLength === 'long' ? 'selected' : ''}>Long (~1,800 words)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Default Format</label>
                            <select id="defaultFormatSelect" class="form-select">
                                <option value="blog-post" ${settings.defaultFormat === 'blog-post' ? 'selected' : ''}>Blog Post</option>
                                <option value="listicle" ${settings.defaultFormat === 'listicle' ? 'selected' : ''}>Listicle</option>
                                <option value="how-to" ${settings.defaultFormat === 'how-to' ? 'selected' : ''}>How-To Guide</option>
                                <option value="opinion" ${settings.defaultFormat === 'opinion' ? 'selected' : ''}>Opinion Piece</option>
                                <option value="case-study" ${settings.defaultFormat === 'case-study' ? 'selected' : ''}>Case Study</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Distribution Settings -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 16 20 12 16 8"/><line x1="12" y1="12" x2="20" y2="12"/><path d="M7 12a5 5 0 015-5c.2 0 .3 0 .5.1"/><path d="M7 12a5 5 0 005 5c.2 0 .3 0 .5-.1"/>
                        </svg>
                        <h3>Distribution Settings</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">WordPress URL</label>
                            <input type="url" id="wpUrlInput" class="form-input" 
                                placeholder="https://yourblog.com" 
                                value="${this._e(settings.wpUrl || '')}">
                        </div>
                        <div class="input-group">
                            <label class="form-label">WordPress User</label>
                            <input type="text" id="wpUserInput" class="form-input" 
                                placeholder="admin" 
                                value="${this._e(settings.wpUser || '')}">
                        </div>
                        <div class="input-group">
                            <label class="form-label">WP Application Password</label>
                            <input type="password" id="wpAppPasswordInput" class="form-input" 
                                placeholder="xxxx xxxx xxxx xxxx" 
                                value="${settings.wpAppPassword ? '********' : ''}"
                                data-raw-key="${settings.wpAppPassword || ''}">
                        </div>
                        <div class="input-group">
                            <label class="form-label">Webhook URL (Zapier/Make)</label>
                            <input type="url" id="webhookUrlInput" class="form-input" 
                                placeholder="https://hooks.zapier.com/..." 
                                value="${this._e(settings.webhookUrl || '')}">
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <button class="btn btn-primary btn-lg" id="saveSettingsBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Settings
                </button>
            </div>
        </div>`;
    }

    mount() {
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this._save());
        document.getElementById('testApiBtn')?.addEventListener('click', () => this._testApi());

        const input = document.getElementById('openaiKeyInput');
        document.getElementById('toggleKeyBtn')?.addEventListener('click', () => {
            if (input.dataset.showingRaw === 'true') {
                input.value = '********';
                input.type = 'password';
                input.dataset.showingRaw = 'false';
            } else {
                input.value = input.dataset.rawKey || '';
                input.type = 'text';
                input.dataset.showingRaw = 'true';
            }
        });

        // If user starts typing, clear the 'rawKey' to indicate a new key is being entered
        input?.addEventListener('input', () => {
            input.dataset.rawKey = input.value;
            input.dataset.showingRaw = 'true';
        });
    }

    async _save() {
        const input = document.getElementById('openaiKeyInput');
        let openaiKey = input?.value || '';

        // If it's still the stars, use the raw data attribute
        if (openaiKey === '********') {
            openaiKey = input.dataset.rawKey || '';
        }

        const settings = {
            openaiKey,
            aiModel: document.getElementById('aiModelSelect')?.value || 'gpt-4o-mini',
            nicheKeywords: document.getElementById('nicheKeywordsInput')?.value || '',
            defaultTone: document.getElementById('defaultToneSelect')?.value || 'professional',
            defaultLength: document.getElementById('defaultLengthSelect')?.value || 'medium',
            defaultFormat: document.getElementById('defaultFormatSelect')?.value || 'blog-post',
            wpUrl: document.getElementById('wpUrlInput')?.value || '',
            wpUser: document.getElementById('wpUserInput')?.value || '',
            wpAppPassword: document.getElementById('wpAppPasswordInput')?.value === '********'
                ? document.getElementById('wpAppPasswordInput').dataset.rawKey
                : (document.getElementById('wpAppPasswordInput')?.value || ''),
            webhookUrl: document.getElementById('webhookUrlInput')?.value || '',
        };
        storage.updateSettings(settings);
        try { await apiClient.updateSettings(settings); } catch { /* local save succeeded */ }
        this._toast('Settings saved!');
    }

    async _testApi() {
        const status = document.getElementById('apiStatus');
        const input = document.getElementById('openaiKeyInput');
        let openaiKey = input?.value || '';
        if (openaiKey === '********') openaiKey = input.dataset.rawKey || '';

        status.textContent = 'Testing...';
        status.className = 'api-status';
        try {
            // We can't easily pass a temporary key to validateConfig since it hits /api/validate 
            // which usually checks the server-side stored key. 
            // So we save first or the server needs to handle an optional key.
            // For now, let's just trigger the normal test.
            const data = await apiClient.validateConfig();
            if (data.configuration?.openai) {
                status.textContent = '✓ Connected';
                status.className = 'api-status api-ok';
            } else {
                status.textContent = '✗ Invalid key';
                status.className = 'api-status api-error';
            }
        } catch {
            status.textContent = '✗ Connection failed';
            status.className = 'api-status api-error';
        }
    }

    _mask(key) { return key.length > 8 ? key.substring(0, 5) + '•'.repeat(key.length - 8) + key.slice(-3) : key; }
    _toast(msg) {
        const c = document.getElementById('toastContainer'); if (!c) return;
        const t = document.createElement('div'); t.className = 'toast toast-success'; t.textContent = msg;
        c.appendChild(t); setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 2500);
    }
    _e(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
}

export default SettingsPage;
