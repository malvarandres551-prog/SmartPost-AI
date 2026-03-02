import BlogGenerationService from '../services/blogGenerationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFullGeneration() {
    const service = new BlogGenerationService();
    const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    const topic = {
        title: "The Future of Remote Work in BPO",
        category: "Operations"
    };

    const researchData = {
        summary: "Remote work is becoming standard in the BPO industry. Costs are down, but management is harder."
    };

    const options = {
        tone: 'professional',
        length: 'short', // Use short to avoid hitting limits or taking too long
        format: 'blog-post'
    };

    console.log('Starting full generation test...');
    const result = await service.generateBlog(topic, researchData, options, settings);

    if (result.model === 'fallback') {
        console.error('❌ FALLBACK TRIGGERED!');
        console.error('Note:', result.note);
    } else {
        console.log('✅ SUCCESS!');
        console.log('Model:', result.model);
        console.log('Word Count:', result.wordCount);
        console.log('Headline:', result.headline);
    }
}

testFullGeneration();
