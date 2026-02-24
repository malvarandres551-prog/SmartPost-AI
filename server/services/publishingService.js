import fetch from 'node-fetch';

/**
 * PublishingService handles the distribution of articles to external platforms.
 */
class PublishingService {
    /**
     * Publish an article to a WordPress site via REST API
     * @param {Object} article - The article object
     * @param {Object} config - WordPress configuration (url, user, appPassword)
     */
    async publishToWordPress(article, config) {
        if (!config.url || !config.user || !config.appPassword) {
            throw new Error('WordPress configuration is incomplete. Check your settings.');
        }

        const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
        const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;

        // Basic Auth header for WP Application Passwords
        const auth = Buffer.from(`${config.user}:${config.appPassword}`).toString('base64');

        // Map article content to WP format
        const content = `
            ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.headline}" style="width:100%; border-radius:12px; margin-bottom:2rem;">` : ''}
            <p><em>${article.metaDescription}</em></p>
            ${article.content.introduction}
            ${article.content.sections.map(s => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
            <h2>Conclusion</h2>
            <p>${article.content.conclusion}</p>
        `;

        const body = {
            title: article.headline,
            content: content,
            status: 'draft', // Safety first, save as draft on WP
            excerpt: article.metaDescription,
            tags: [], // Could map tags later
            categories: [],
        };

        console.log(`🚀 Publishing to WordPress: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`WordPress API error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Published to WordPress successfully: ${data.link}`);
        return { success: true, platform: 'wordpress', url: data.link };
    }

    /**
     * Send article data to a Webhook (Zapier, Make, etc.)
     * @param {Object} article - The article object
     * @param {string} webhookUrl - The URL to POST to
     */
    async triggerWebhook(article, webhookUrl) {
        if (!webhookUrl) throw new Error('Webhook URL is missing.');

        console.log(`🔗 Triggering Webhook: ${webhookUrl}`);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'article.ready',
                source: 'SmartPost AI',
                article: {
                    ...article,
                    // Flatten content for easier parsing in Zapier
                    formattedContent: this._flattenContent(article)
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`);
        }

        console.log(`✅ Webhook triggered successfully`);
        return { success: true, platform: 'webhook' };
    }

    _flattenContent(article) {
        let text = `${article.headline}\n\n${article.metaDescription}\n\n`;
        text += `${article.content.introduction}\n\n`;
        article.content.sections.forEach(s => {
            text += `${s.heading}\n${s.content}\n\n`;
        });
        text += `Conclusion\n${article.content.conclusion}`;
        return text;
    }
}

export default new PublishingService();
