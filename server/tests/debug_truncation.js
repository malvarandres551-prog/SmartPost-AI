import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { blogPromptTemplates } from '../utils/promptTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugTruncation() {
    try {
        const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const apiKey = settings.geminiKey;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: settings.geminiModel });

        const topic = { title: "The Future of AI in Recruitment", category: "HR" };
        const options = { tone: 'professional', length: 'medium', format: 'blog-post' };
        const prompt = blogPromptTemplates.generateBlog(topic, "Research summary here", options);

        console.log('Generating content with medium length...');
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 8000, // Try higher limit
                temperature: 0.7,
            }
        });

        const text = (await result.response).text();
        console.log('Response length:', text.length);
        console.log('End of response:', text.substring(text.length - 200));

        try {
            JSON.parse(text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim());
            console.log('✅ JSON is valid!');
        } catch (e) {
            console.error('❌ JSON Error:', e.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugTruncation();
