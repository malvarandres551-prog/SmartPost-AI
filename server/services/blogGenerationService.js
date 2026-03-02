import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { blogPromptTemplates } from '../utils/promptTemplates.js';

// AI-powered blog generation service
class BlogGenerationService {
    constructor() {
        this.openai = null;
        this.gemini = null;
        this.claude = null;

        this.defaultModel = process.env.AI_MODEL || 'gpt-4o-mini';
        this.maxTokens = parseInt(process.env.MAX_TOKENS) || 3000;
        this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
    }

    // Initialize provider instance if not already exists
    _initProvider(provider, apiKey) {
        if (!apiKey) return null;

        switch (provider) {
            case 'openai':
                if (!this.openai || this.openai.apiKey !== apiKey) {
                    this.openai = new OpenAI({ apiKey });
                }
                return this.openai;
            case 'gemini':
                if (!this.gemini || this.gemini.apiKey !== apiKey) {
                    this.gemini = new GoogleGenerativeAI(apiKey);
                }
                return this.gemini;
            case 'claude':
                if (!this.claude || this.claude.apiKey !== apiKey) {
                    this.claude = new Anthropic({ apiKey });
                }
                return this.claude;
            default:
                return null;
        }
    }

    // Generate a featured image using DALL-E 3
    async generateImage(topic, apiKey = null) {
        try {
            const rawKey = apiKey || process.env.OPENAI_API_KEY;
            const trimmedKey = rawKey?.trim();

            if (!trimmedKey) throw new Error('OpenAI key required for images');
            const client = new OpenAI({ apiKey: trimmedKey });

            console.log(`🖼️ Generating image for topic: ${topic.title}`);

            const response = await client.images.generate({
                model: "dall-e-3",
                prompt: `A professional, high-quality, modern featured image for a business blog post about: ${topic.title}. Style: Clean, corporate, minimalist, with glassmorphism elements. No text in the image. Vibrant blue and teal color palette.`,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            });

            console.log(`✅ Image generated successfully`);
            return response.data[0].url;
        } catch (error) {
            console.error('❌ Error generating image:', error.message);
            // Re-throw with a cleaner message for the UI
            if (error.status === 401) {
                throw new Error('Invalid OpenAI API Key. Please check your key in Settings.');
            }
            if (error.status === 429) {
                throw new Error('OpenAI Quota exceeded. Please check your billing/limits.');
            }
            throw error;
        }
    }

    // Main method to generate blog post
    async generateBlog(topic, researchData, options = {}, settings = {}) {
        try {
            const provider = settings.aiProvider || 'openai';
            const apiKey = settings[`${provider}Key`] || process.env[`${provider.toUpperCase()}_API_KEY`];
            const model = settings.aiModel || this.defaultModel;

            if (!apiKey) {
                throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key is missing.`);
            }

            console.log(`\n--- Starting Blog Generation ---`);
            console.log(`Topic: ${topic.title}`);
            console.log(`Provider: ${provider}`);
            console.log(`Model: ${model}`);

            const prompt = blogPromptTemplates.generateBlog(topic, researchData.summary || researchData, options);

            let result;
            if (provider === 'gemini') {
                result = await this._generateGemini(apiKey, model, prompt, options);
            } else if (provider === 'claude') {
                result = await this._generateClaude(apiKey, model, prompt, options);
            } else {
                result = await this._generateOpenAI(apiKey, model, prompt, options);
            }

            // Ensure word count and reading time are present
            if (!result.wordCount) {
                const words = JSON.stringify(result).split(/\s+/).length;
                result.wordCount = words;
                result.readingTime = `${Math.ceil(words / 225)} min`;
            }

            const blogPost = {
                ...result,
                topic: topic.title,
                category: topic.category,
                generatedAt: new Date().toISOString(),
                model: model,
                provider: provider,
                sources: researchData?.articles?.slice(0, 5).map(a => ({
                    title: a.title, url: a.url, source: a.source
                })) || [],
            };

            console.log(`✅ Blog generated successfully: ${blogPost.wordCount} words`);
            return blogPost;

        } catch (error) {
            console.error('❌ Error generating blog:', error.message);
            const fallback = this.generateFallbackBlog(topic);
            fallback.note = `AI generation failed: ${error.message}`;
            return fallback;
        }
    }

    async _generateOpenAI(apiKey, model, prompt, options) {
        const client = this._initProvider('openai', apiKey);
        let maxTokens = this.maxTokens;
        if (options.length === 'long') maxTokens = 4000;

        const completion = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: 'You are a professional blog writer. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: this.temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    async _generateGemini(apiKey, model, prompt, options) {
        const genAI = this._initProvider('gemini', apiKey);
        const modelInstance = genAI.getGenerativeModel({ model });

        // Gemini doesn't have a direct "json_object" mode like OpenAI in all SDK versions, 
        // so we prompt for it and clean the response.
        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error('Gemini JSON parse failed, returning raw text as introduction');
            return {
                headline: "Generated Content",
                content: { introduction: text },
                wordCount: text.split(/\s+/).length
            };
        }
    }

    async _generateClaude(apiKey, model, prompt, options) {
        const anthropic = this._initProvider('claude', apiKey);

        const message = await anthropic.messages.create({
            model,
            max_tokens: 4000,
            system: "You are a professional blog writer. You MUST return ONLY valid JSON matching the requested schema.",
            messages: [{ role: "user", content: prompt }]
        });

        const text = message.content[0].text;
        return JSON.parse(text);
    }

    generateFallbackBlog(topic) {
        return {
            headline: topic.title,
            metaDescription: `Insights about ${topic.title}.`,
            tags: ['workforce', 'business'],
            content: {
                introduction: `Understanding ${topic.title} is essential for HR leaders.`,
                sections: [{ heading: 'Key Insights', content: 'Content coming soon...' }],
                conclusion: 'Stay tuned for more updates.',
                keyTakeaways: ['Learn more about this topic.']
            },
            wordCount: 800,
            readingTime: '4 min',
            model: 'fallback'
        };
    }

    async validateApiKey(provider, apiKey) {
        try {
            const trimmedKey = apiKey?.trim();
            if (!trimmedKey) return false;

            if (provider === 'openai') {
                const client = new OpenAI({ apiKey: trimmedKey });
                await client.models.list();
            } else if (provider === 'gemini') {
                const genAI = new GoogleGenerativeAI(trimmedKey);
                // Use latest flash alias which is verified to be available in the logs
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                await model.generateContent("test");
            } else if (provider === 'claude') {
                const anthropic = new Anthropic({ apiKey: trimmedKey });
                await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1,
                    messages: [{ role: "user", content: "test" }]
                });
            }
            return true;
        } catch (error) {
            let message = error.message;
            // Clean up Anthropic error messages which often contain raw JSON strings
            if (provider === 'claude' && message.includes('{')) {
                try {
                    const jsonStr = message.substring(message.indexOf('{'));
                    const errorData = JSON.parse(jsonStr);
                    if (errorData.error?.message) {
                        message = errorData.error.message;
                    }
                } catch (e) {
                    // Fallback to original message
                }
            }
            console.error(`${provider} validation failed:`, message);
            throw new Error(message);
        }
    }
}

export default BlogGenerationService;
