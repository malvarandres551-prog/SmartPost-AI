/**
 * Utilities for exporting content in various formats.
 */
export const exportUtils = {
    /**
     * Copies article as formatted HTML to clipboard.
     */
    async copyAsHtml(article) {
        const html = this.generateFullHtml(article);
        try {
            await navigator.clipboard.writeText(html);
            return true;
        } catch (err) {
            console.error('Failed to copy HTML:', err);
            return false;
        }
    },

    /**
     * Generates a clean HTML representation of the article.
     */
    generateFullHtml(article) {
        const { headline, content, metaDescription } = article;
        const { introduction, sections, conclusion } = content || {};

        let html = `<h1>${headline || article.topic}</h1>\n`;
        if (metaDescription) {
            html += `<!-- Meta Description: ${metaDescription} -->\n`;
        }

        if (introduction) {
            html += `<p>${introduction.replace(/\n\n/g, '</p><p>')}</p>\n`;
        }

        (sections || []).forEach(section => {
            html += `<h2>${section.heading}</h2>\n`;
            html += `<p>${section.content.replace(/\n\n/g, '</p><p>')}</p>\n`;
        });

        if (conclusion) {
            html += `<h2>Conclusion</h2>\n`;
            html += `<p>${conclusion.replace(/\n\n/g, '</p><p>')}</p>\n`;
        }

        return html;
    },

    /**
     * Downloads the article as a .docx file.
     * Uses a simple HTML-to-Doc strategy that Word understands.
     */
    downloadAsDocx(article) {
        const filename = `${(article.headline || 'article').toLowerCase().replace(/\s+/g, '-').substring(0, 40)}.docx`;
        const content = this.generateFullHtml(article);

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${article.headline}</title></head>
            <body>${content}</body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Downloads the article as a PDF.
     * Uses browser print to PDF strategy.
     */
    downloadAsPdf(article) {
        const originalTitle = document.title;
        document.title = article.headline || article.topic;

        // Print-only container
        const printDiv = document.createElement('div');
        printDiv.className = 'print-only-container';
        printDiv.style.padding = '40px';
        printDiv.style.fontFamily = 'Arial, sans-serif';
        printDiv.style.color = '#333';
        printDiv.style.background = '#fff';
        printDiv.style.position = 'absolute';
        printDiv.style.left = '-9999px';

        printDiv.innerHTML = `
            <div style="border-bottom: 2px solid #555; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; color: #1a73e8;">SmartPost AI</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">AI-Powered Content Generation</p>
            </div>
            ${this.generateFullHtml(article)}
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #999;">
                Generated with SmartPost AI - ${new Date().toLocaleDateString()}
            </div>
        `;

        document.body.appendChild(printDiv);
        window.print();

        // Cleanup after a delay to ensure print dialog finishes
        setTimeout(() => {
            document.body.removeChild(printDiv);
            document.title = originalTitle;
        }, 1000);
    }
};
