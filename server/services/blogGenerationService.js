import OpenAI from 'openai';
import { blogPromptTemplates } from '../utils/promptTemplates.js';

// AI-powered blog generation service
class BlogGenerationService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this.model = process.env.AI_MODEL || 'gpt-4-turbo-preview';
        this.maxTokens = parseInt(process.env.MAX_TOKENS) || 3000;
        this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
    }

    // Generate a featured image using DALL-E 3
    async generateImage(topic, apiKey = null) {
        try {
            const currentApiKey = apiKey || process.env.OPENAI_API_KEY;
            const client = apiKey ? new OpenAI({ apiKey }) : this.openai;

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
            throw error;
        }
    }

    // Helper method to call OpenAI with retry logic (exponential backoff)
    async _callWithRetry(client, callFn, maxRetries = 3) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await callFn();
            } catch (error) {
                lastError = error;
                // Only retry on rate limit (429) or transient server errors (500, 503)
                if (error.status === 429 || error.status >= 500) {
                    const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    console.warn(`⚠️ OpenAI API error (${error.status}). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw error;
                }
            }
        }
        throw lastError;
    }

    // Main method to generate blog post
    async generateBlog(topic, researchData, options = {}, apiKey = null, model = null) {
        try {
            const currentApiKey = apiKey || process.env.OPENAI_API_KEY;
            const currentModel = model || process.env.AI_MODEL || this.model;

            if (!currentApiKey || currentApiKey.trim() === '') {
                throw new Error('OpenAI API key is missing. Please configure it in Settings.');
            }

            // Re-initialize OpenAI client if a different key is provided
            const client = apiKey ? new OpenAI({ apiKey }) : this.openai;

            console.log(`\n--- Starting Blog Generation ---`);
            console.log(`Topic: ${topic.title}`);
            console.log(`Model: ${currentModel}`);
            console.log(`Options:`, JSON.stringify(options));
            console.log(`API Key hash: ${currentApiKey.substring(0, 8)}...`);

            // Dynamically adjust max tokens based on requested length
            let currentMaxTokens = this.maxTokens;
            if (options.length === 'long') currentMaxTokens = Math.max(currentMaxTokens, 4000);
            if (options.length === 'medium') currentMaxTokens = Math.max(currentMaxTokens, 3000);
            if (options.length === 'short') currentMaxTokens = Math.max(currentMaxTokens, 1500);

            // Ensure research summary exists
            const researchSummary = researchData?.summary || (typeof researchData === 'string' ? researchData : 'No research data provided.');

            // Create the prompt
            const prompt = blogPromptTemplates.generateBlog(topic, researchSummary, options);

            console.log('Sending request to OpenAI...');

            // Call OpenAI API with retry logic
            const completion = await this._callWithRetry(client, () => client.chat.completions.create({
                model: currentModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert content writer specializing in workforce management, HR, and business services. You create professional, insightful blog posts for decision-makers and business leaders. Ensure you meet the requested word count length strictly.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: this.temperature,
                max_tokens: currentMaxTokens,
                response_format: { type: 'json_object' },
            }));

            // Parse the response
            const responseContent = completion.choices[0].message.content;
            const generatedContent = JSON.parse(responseContent);

            // Add metadata
            const blogPost = {
                ...generatedContent,
                topic: topic.title,
                category: topic.category,
                generatedAt: new Date().toISOString(),
                model: this.model,
                sources: researchData?.articles?.slice(0, 5).map(a => ({
                    title: a.title,
                    url: a.url,
                    source: a.source,
                })) || [],
            };

            console.log(`✅ Blog generated successfully: ${blogPost.wordCount} words`);
            return blogPost;

        } catch (error) {
            console.error('❌ Error generating blog:', error.message);
            if (error.response) {
                console.error('OpenAI Error Details:', JSON.stringify(error.response.data));
            }

            // Return fallback blog if AI fails
            const fallback = this.generateFallbackBlog(topic);
            fallback.note = `AI generation failed: ${error.message}`;
            return fallback;
        }
    }

    // Generate a quick blog (faster, less detailed)
    async generateQuickBlog(topic) {
        try {
            const prompt = blogPromptTemplates.generateQuickBlog(topic);

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional content writer. Create concise, actionable blog posts.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            });

            return JSON.parse(completion.choices[0].message.content);

        } catch (error) {
            console.error('Error generating quick blog:', error);
            return this.generateFallbackBlog(topic);
        }
    }

    // Fallback blog when AI is unavailable
    generateFallbackBlog(topic) {
        return {
            headline: topic.title,
            metaDescription: topic.description || `Explore insights and strategies about ${topic.title} for modern workforce management.`,
            tags: ['workforce', 'HR', 'business', topic.category?.toLowerCase()].filter(Boolean),
            content: {
                introduction: `${topic.description || topic.title}\n\nIn today's rapidly evolving business landscape, understanding this topic is crucial for HR professionals and business leaders. This article explores the key aspects and provides actionable insights.`,
                sections: [
                    {
                        heading: 'Understanding the Current Landscape',
                        content: 'The workforce management industry is experiencing significant transformation. Organizations are adapting to new challenges and opportunities in this area.',
                    },
                    {
                        heading: 'Key Strategies for Success',
                        content: 'Successful implementation requires a strategic approach. Leaders should focus on data-driven decision making, employee engagement, and continuous improvement.',
                    },
                    {
                        heading: 'Best Practices and Recommendations',
                        content: 'Industry experts recommend starting with a clear assessment of current capabilities, setting measurable goals, and investing in the right technology and training.',
                    },
                ],
                conclusion: 'As the industry continues to evolve, staying informed and adaptable is essential for success.',
                keyTakeaways: [
                    'Stay informed about industry trends and innovations',
                    'Invest in technology and employee development',
                    'Focus on data-driven decision making',
                    'Prioritize employee engagement and retention',
                ],
            },
            wordCount: 800,
            readingTime: '4 min',
            topic: topic.title,
            category: topic.category,
            generatedAt: new Date().toISOString(),
            model: 'fallback',
            sources: [],
            note: 'This is a fallback blog post. AI generation was unavailable.',
        };
    }

    // Validate OpenAI API key
    async validateApiKey() {
        try {
            await this.openai.models.list();
            return true;
        } catch (error) {
            console.error('OpenAI API key validation failed:', error.message);
            return false;
        }
    }

    // Get available models
    async getAvailableModels() {
        try {
            const models = await this.openai.models.list();
            return models.data
                .filter(m => m.id.includes('gpt'))
                .map(m => m.id);
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }
}

export default BlogGenerationService;
