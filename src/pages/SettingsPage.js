import apiClient from '../api/client.js';
import storage from '../services/storage.js';

class SettingsPage {
    render() {
        const settings = storage.getSettings();
        const provider = settings.aiProvider || 'openai';

        return `
        <div class="page-container settings-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Settings</h1>
                    <p class="page-subtitle">Configure AI providers, niche preferences, and writing styles.</p>
                </div>
            </div>

            <div class="settings-grid">
                <!-- AI Configuration -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                        <h3>AI Configuration</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">AI Provider</label>
                            <select id="aiProviderSelect" class="form-select">
                                <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o, DALL-E)</option>
                                <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Google Gemini (1.5 Pro/Flash)</option>
                                <option value="claude" ${provider === 'claude' ? 'selected' : ''}>Anthropic Claude (3.5 Sonnet)</option>
                            </select>
                        </div>

                        <!-- Provider Keys -->
                        <div class="provider-key-group" id="openaiKeyGroup" style="display: ${provider === 'openai' ? 'block' : 'none'}">
                            <div class="input-group">
                                <label class="form-label">OpenAI API Key</label>
                                <input type="password" id="openaiKeyInput" class="form-input" placeholder="sk-..." value="${settings.openaiKey || ''}">
                            </div>
                            <div class="input-group">
                                <label class="form-label">OpenAI Model</label>
                                <select id="openaiModelSelect" class="form-select model-select">
                                    <option value="gpt-4o-mini" ${settings.aiModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o-mini</option>
                                    <option value="gpt-4o" ${settings.aiModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o</option>
                                </select>
                            </div>
                        </div>

                        <div class="provider-key-group" id="geminiKeyGroup" style="display: ${provider === 'gemini' ? 'block' : 'none'}">
                            <div class="input-group">
                                <label class="form-label">Gemini API Key</label>
                                <input type="password" id="geminiKeyInput" class="form-input" placeholder="AIza..." value="${settings.geminiKey || ''}">
                            </div>
                            <div class="input-group">
                                <label class="form-label">Gemini Model</label>
                                <select id="geminiModelSelect" class="form-select model-select">
                                    <option value="gemini-flash-latest" ${settings.aiModel === 'gemini-flash-latest' || !settings.aiModel ? 'selected' : ''}>Gemini Flash (Latest)</option>
                                    <option value="gemini-2.5-flash" ${settings.aiModel === 'gemini-2.5-flash' ? 'selected' : ''}>Gemini 2.5 Flash</option>
                                    <option value="gemini-pro-latest" ${settings.aiModel === 'gemini-pro-latest' ? 'selected' : ''}>Gemini Pro (Latest)</option>
                                    <option value="gemini-2.0-flash-lite" ${settings.aiModel === 'gemini-2.0-flash-lite' ? 'selected' : ''}>Gemini 2.0 Flash Lite</option>
                                </select>
                            </div>
                        </div>

                        <div class="provider-key-group" id="claudeKeyGroup" style="display: ${provider === 'claude' ? 'block' : 'none'}">
                            <div class="input-group">
                                <label class="form-label">Claude API Key</label>
                                <input type="password" id="claudeKeyInput" class="form-input" placeholder="sk-ant-..." value="${settings.claudeKey || ''}">
                            </div>
                            <div class="input-group">
                                <label class="form-label">Claude Model</label>
                                <select id="claudeModelSelect" class="form-select model-select">
                                    <option value="claude-3-5-sonnet-latest" ${settings.aiModel === 'claude-3-5-sonnet-latest' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
                                    <option value="claude-3-7-sonnet-latest" ${settings.aiModel === 'claude-3-7-sonnet-latest' ? 'selected' : ''}>Claude 3.7 Sonnet</option>
                                    <option value="claude-3-haiku-20240307" ${settings.aiModel === 'claude-3-haiku-20240307' ? 'selected' : ''}>Claude 3 Haiku</option>
                                </select>
                            </div>
                        </div>

                        <button class="btn btn-sm btn-secondary" id="testApiBtn">Test Connection</button>
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
                            <textarea id="nicheKeywordsInput" class="form-textarea" rows="3">${this._e(settings.nicheKeywords || '')}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Default Writing Style -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        <h3>Writing Style</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">Default Tone</label>
                            <select id="defaultToneSelect" class="form-select">
                                <option value="professional" ${settings.defaultTone === 'professional' ? 'selected' : ''}>Professional</option>
                                <option value="casual" ${settings.defaultTone === 'casual' ? 'selected' : ''}>Casual</option>
                                <option value="authoritative" ${settings.defaultTone === 'authoritative' ? 'selected' : ''}>Authoritative</option>
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
                    </div>
                </div>

                <!-- Distribution -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 16 20 12 16 8"/><line x1="12" y1="12" x2="20" y2="12"/><path d="M7 12a5 5 0 015-5c.2 0 .3 0 .5.1"/><path d="M7 12a5 5 0 005 5c.2 0 .3 0 .5-.1"/>
                        </svg>
                        <h3>Distribution</h3>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="form-label">WordPress URL</label>
                            <input type="url" id="wpUrlInput" class="form-input" value="${this._e(settings.wpUrl || '')}">
                        </div>
                        <div class="input-group">
                            <label class="form-label">WordPress User</label>
                            <input type="text" id="wpUserInput" class="form-input" value="${this._e(settings.wpUser || '')}">
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <button class="btn btn-primary btn-lg" id="saveSettingsBtn">Save All Settings</button>
            </div>
        </div>`;
    }

    mount() {
        const providerSelect = document.getElementById('aiProviderSelect');
        const groups = {
            openai: document.getElementById('openaiKeyGroup'),
            gemini: document.getElementById('geminiKeyGroup'),
            claude: document.getElementById('claudeKeyGroup')
        };

        providerSelect?.addEventListener('change', (e) => {
            const val = e.target.value;
            Object.keys(groups).forEach(k => {
                groups[k].style.display = k === val ? 'block' : 'none';
            });
        });

        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this._save());
        document.getElementById('testApiBtn')?.addEventListener('click', () => this._testApi());
    }

    async _save() {
        const provider = document.getElementById('aiProviderSelect').value;
        const model = document.getElementById(`${provider}ModelSelect`).value;

        const settings = {
            aiProvider: provider,
            aiModel: model,
            openaiKey: document.getElementById('openaiKeyInput').value,
            geminiKey: document.getElementById('geminiKeyInput').value,
            claudeKey: document.getElementById('claudeKeyInput').value,
            nicheKeywords: document.getElementById('nicheKeywordsInput').value,
            defaultTone: document.getElementById('defaultToneSelect').value,
            defaultLength: document.getElementById('defaultLengthSelect').value,
            wpUrl: document.getElementById('wpUrlInput').value,
            wpUser: document.getElementById('wpUserInput').value,
        };

        storage.updateSettings(settings);
        try {
            await apiClient.updateSettings(settings);
            this._toast('Settings saved successfully!');
        } catch (error) {
            this._toast('Error saving to server, but saved locally.');
        }
    }

    async _testApi() {
        const status = document.getElementById('apiStatus');
        status.textContent = 'Testing...';
        status.className = 'api-status';

        try {
            // We'll use the current form values for the test
            const provider = document.getElementById('aiProviderSelect').value;
            const key = document.getElementById(`${provider}KeyInput`).value;

            if (!key) {
                status.textContent = 'Enter a key first';
                status.className = 'api-status api-error';
                return;
            }

            const data = await apiClient.validateConfig({ provider, key });
            if (data.success) {
                status.textContent = '✓ Connected';
                status.className = 'api-status api-ok';
            } else {
                status.textContent = `✗ ${data.error || 'Invalid key'}`;
                status.className = 'api-status api-error';
            }
        } catch (error) {
            status.textContent = '✗ Connection failed';
            status.className = 'api-status api-error';
        }
    }

    _toast(msg) {
        const c = document.getElementById('toastContainer');
        if (!c) {
            alert(msg);
            return;
        }
        const t = document.createElement('div');
        t.className = 'toast toast-success';
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    _e(t) {
        const d = document.createElement('div');
        d.textContent = t || '';
        return d.innerHTML;
    }
}

export default SettingsPage;
