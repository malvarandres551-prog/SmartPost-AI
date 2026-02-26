/**
 * Service to handle WordPress REST API interactions directly from the client.
 */
class WordPressService {
    async publishDraft(config, article) {
        const { url, username, appPassword } = config;

        // Ensure URL is properly formatted
        const baseUrl = url.replace(/\/$/, '');
        const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;

        // Prepare content
        let contentHtml = this._convertToHtml(article);

        const postData = {
            title: article.headline || article.topic,
            content: contentHtml,
            status: 'draft',
            excerpt: article.metaDescription || '',
        };

        // Basic Auth for Application Passwords
        const credentials = btoa(`${username}:${appPassword}`);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `WordPress error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[WordPressService] Publish failed:', error);
            throw error;
        }
    }

    _convertToHtml(article) {
        const { introduction, sections, conclusion } = article.content || {};
        let html = '';

        if (introduction) {
            html += `<p>${introduction.replace(/\n\g/, '</p><p>')}</p>`;
        }

        (sections || []).forEach(section => {
            html += `<h2>${section.heading}</h2>`;
            html += `<p>${section.content.replace(/\n\g/, '</p><p>')}</p>`;
        });

        if (conclusion) {
            html += `<h2>Conclusion</h2>`;
            html += `<p>${conclusion.replace(/\n\g/, '</p><p>')}</p>`;
        }

        return html;
    }
}

export default new WordPressService();
