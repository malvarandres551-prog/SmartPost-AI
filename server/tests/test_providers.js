import BlogGenerationService from '../services/blogGenerationService.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
    const service = new BlogGenerationService();
    const topic = { title: 'AI in Workforce Management', category: 'Technology' };
    const research = { summary: 'AI is transforming how HR departments operate by automating repetitive tasks.' };

    console.log('--- Provider Logic Test ---');

    // 1. Test Fallback
    console.log('\nTesting Fallback (invalid provider):');
    const fallback = await service.generateBlog(topic, research, {}, { aiProvider: 'invalid' });
    console.log('Result:', fallback.model === 'fallback' ? 'PASS' : 'FAIL');

    // 2. Test Client Initialization (if keys exist)
    const providers = [
        { name: 'OpenAI', key: process.env.OPENAI_API_KEY, p: 'openai' },
        { name: 'Gemini', key: process.env.GEMINI_API_KEY, p: 'gemini' },
        { name: 'Claude', key: process.env.ANTHROPIC_API_KEY, p: 'claude' },
        { name: 'Grok', key: process.env.GROK_API_KEY, p: 'grok' }
    ];

    for (const provider of providers) {
        if (provider.key && provider.key !== 'your_key' && !provider.key.includes('placeholder')) {
            console.log(`\nTesting ${provider.name} validation...`);
            const isValid = await service.validateApiKey(provider.p, provider.key);
            console.log(`${provider.name} valid?`, isValid);
        } else {
            console.log(`\nSkipping ${provider.name} (no key provided in .env)`);
        }
    }
}

runTests().catch(console.error);
