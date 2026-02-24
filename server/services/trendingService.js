import axios from 'axios';
import * as cheerio from 'cheerio';

// Trending topics discovery service
class TrendingService {
    constructor() {
        this.newsApiKey = process.env.NEWS_API_KEY;
        this.nicheKeywords = process.env.NICHE_KEYWORDS?.split(',') || [
            'workforce',
            'staffing',
            'operations',
            'business services',
            'HR',
            'recruitment',
            'remote work',
            'BPO',
        ];
        this.cache = {
            trending: null,
            timestamp: 0,
            expiry: 30 * 60 * 1000, // 30 minutes
        };
    }

    // Main method to fetch trending topics
    async getTrendingTopics(searchQuery = null, force = false) {
        // Check cache (only if no search query and not forcing refresh)
        const now = Date.now();
        if (!searchQuery && !force && this.cache.trending && (now - this.cache.timestamp < this.cache.expiry)) {
            console.log('Returning cached trending topics');
            return this.cache.trending;
        }

        try {
            console.log(searchQuery ? `Searching for topics: ${searchQuery}` : 'Fetching topics from multiple sources...');

            // If searching, we'll focus more on News API and wider RSS results
            const [newsTopics, rssTopics] = await Promise.all([
                this.fetchFromNewsAPI(searchQuery),
                this.fetchFromRSSFeeds(searchQuery),
            ]);

            // Combine and rank topics
            let allTopics = [...newsTopics, ...rssTopics];
            console.log(`Found ${newsTopics.length} news topics and ${rssTopics.length} RSS topics.`);

            // If we have very few topics and NOT searching, merge with fallbacks
            if (!searchQuery && allTopics.length < 5) {
                console.log('Low topic count, merging with fallback topics');
                const fallbacks = this.getFallbackTopics();
                const existingTitles = new Set(allTopics.map(t => t.title.toLowerCase()));
                const uniqueFallbacks = fallbacks.filter(f => !existingTitles.has(f.title.toLowerCase()));
                allTopics = [...allTopics, ...uniqueFallbacks.slice(0, 5 - allTopics.length)];
            }

            const rankedTopics = this.rankAndFilterTopics(allTopics);
            // If searching, we might want fewer results than the default browse
            const topTopics = searchQuery ? rankedTopics.slice(0, 20) : rankedTopics.slice(0, 15);

            // Update cache (only for general browsing)
            if (!searchQuery) {
                this.cache.trending = topTopics;
                this.cache.timestamp = now;
            }

            return topTopics;
        } catch (error) {
            console.error('Critical error in getTrendingTopics:', error);
            // Return fallback topics if API fails completely and we aren't searching
            return searchQuery ? [] : this.getFallbackTopics();
        }
    }

    // Fetch trending topics from News API
    async fetchFromNewsAPI(searchQuery = null) {
        if (!this.newsApiKey) {
            console.warn('News API key not configured');
            return [];
        }

        try {
            const topics = [];
            const keywordsToFetch = searchQuery ? [searchQuery] : this.nicheKeywords.slice(0, 3);

            // Query multiple niche keywords in parallel
            const fetchPromises = keywordsToFetch.map(async (keyword) => {
                const response = await axios.get('https://newsapi.org/v2/everything', {
                    params: {
                        q: keyword.trim(),
                        language: 'en',
                        sortBy: searchQuery ? 'relevancy' : 'publishedAt',
                        pageSize: searchQuery ? 15 : 5,
                        apiKey: this.newsApiKey,
                    },
                });

                if (response.data.articles) {
                    return response.data.articles.map(article => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        source: article.source.name,
                        category: searchQuery ? 'Search' : keyword.trim(),
                        trendScore: this.calculateTrendScore(article, !!searchQuery),
                    }));
                }
                return [];
            });

            const results = await Promise.all(fetchPromises);
            results.forEach(articles => topics.push(...articles));

            return topics;
        } catch (error) {
            console.error('News API error:', error.message);
            return [];
        }
    }

    // Fetch topics from industry RSS feeds
    async fetchFromRSSFeeds(searchQuery = null) {
        const rssFeeds = [
            'https://www.hrdive.com/feeds/news/',
            'https://recruitingdaily.com/feed/',
            'https://learning-tools.shrm.org/rss/topic-feeds/news.xml',
            'https://www.staffingindustry.com/rss/feed/2161', // SIA News
        ];

        const topics = [];
        const lowerQuery = searchQuery?.toLowerCase();

        const fetchPromises = rssFeeds.map(async (feedUrl) => {
            try {
                const response = await axios.get(feedUrl, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'SmartPost-AI/1.0',
                    },
                });

                const $ = cheerio.load(response.data, { xmlMode: true });
                const feedTopics = [];

                $('item').slice(0, 10).each((i, item) => {
                    const title = $(item).find('title').text();
                    const description = $(item).find('description').text();
                    const link = $(item).find('link').text();
                    const pubDate = $(item).find('pubDate').text();

                    const fullText = (title + ' ' + description).toLowerCase();
                    const isRelevant = searchQuery ? fullText.includes(lowerQuery) : this.isRelevantToNiche(fullText);

                    if (title && isRelevant) {
                        feedTopics.push({
                            title: this.cleanText(title),
                            description: this.cleanText(description),
                            url: link,
                            publishedAt: pubDate,
                            source: new URL(feedUrl).hostname,
                            category: searchQuery ? 'Search' : 'RSS Feed',
                            trendScore: this.calculateTrendScore({ title, description, publishedAt: pubDate }, !!searchQuery),
                        });
                    }
                });
                return feedTopics;
            } catch (error) {
                console.error(`RSS feed error (${feedUrl}):`, error.message);
                return [];
            }
        });

        const resultSets = await Promise.all(fetchPromises);
        resultSets.forEach(set => topics.push(...set));

        return topics;
    }

    // Calculate trend score based on recency and relevance
    calculateTrendScore(article, isSearch = false) {
        let score = 0;

        // Recency score (0-50 points)
        const publishDate = new Date(article.publishedAt);
        const now = new Date();
        const hoursSincePublish = (now - publishDate) / (1000 * 60 * 60);

        if (hoursSincePublish < 24) score += 50;
        else if (hoursSincePublish < 48) score += 40;
        else if (hoursSincePublish < 72) score += 30;
        else if (hoursSincePublish < 168) score += 20; // 1 week
        else score += 10;

        // Relevance score (0-50 points)
        // If it's a search, it's already relevant, so we give it a baseline boost
        if (isSearch) {
            score += 30;
        } else {
            const text = (article.title + ' ' + (article.description || '')).toLowerCase();
            const keywordMatches = this.nicheKeywords.filter(kw =>
                text.includes(kw.toLowerCase())
            ).length;

            score += Math.min(keywordMatches * 10, 50);
        }

        return Math.round(score);
    }

    // Check if content is relevant to niche
    isRelevantToNiche(text) {
        const lowerText = text.toLowerCase();
        return this.nicheKeywords.some(keyword =>
            lowerText.includes(keyword.toLowerCase())
        );
    }

    // Rank and filter topics
    rankAndFilterTopics(topics) {
        // Remove duplicates based on similar titles
        const uniqueTopics = [];
        const seenTitles = new Set();

        for (const topic of topics) {
            const normalizedTitle = topic.title.toLowerCase().substring(0, 50);
            if (!seenTitles.has(normalizedTitle)) {
                seenTitles.add(normalizedTitle);
                uniqueTopics.push(topic);
            }
        }

        // Sort by trend score
        return uniqueTopics.sort((a, b) => b.trendScore - a.trendScore);
    }

    // Clean HTML and special characters from text
    cleanText(text) {
        if (!text) return '';

        // Remove HTML tags
        let cleaned = text.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        cleaned = cleaned
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');

        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    // Fallback topics when APIs fail
    getFallbackTopics() {
        return [
            {
                title: 'The Rise of AI in Recruitment: Transforming Talent Acquisition',
                description: 'How artificial intelligence is revolutionizing the hiring process and what it means for HR professionals.',
                category: 'HR Technology',
                trendScore: 85,
                source: 'Fallback',
            },
            {
                title: 'Remote Work 2.0: Building Effective Hybrid Workforce Models',
                description: 'Best practices for managing distributed teams and creating flexible work environments.',
                category: 'Remote Work',
                trendScore: 82,
                source: 'Fallback',
            },
            {
                title: 'Employee Retention Strategies in a Competitive Labor Market',
                description: 'Proven tactics to reduce turnover and keep top talent engaged in challenging times.',
                category: 'Employee Retention',
                trendScore: 80,
                source: 'Fallback',
            },
            {
                title: 'Workforce Analytics: Data-Driven Decision Making for HR Leaders',
                description: 'Leveraging people analytics to optimize workforce planning and performance.',
                category: 'Workforce Analytics',
                trendScore: 78,
                source: 'Fallback',
            },
            {
                title: 'The Future of BPO: Automation and Human Expertise',
                description: 'How business process outsourcing is evolving with technology integration.',
                category: 'BPO Services',
                trendScore: 75,
                source: 'Fallback',
            },
            {
                title: 'Skills-Based Hiring: Moving Beyond Traditional Credentials',
                description: 'Why companies are prioritizing skills over degrees in recruitment.',
                category: 'Recruitment',
                trendScore: 73,
                source: 'Fallback',
            },
        ];
    }

    // Get detailed research for a specific topic
    async getTopicResearch(topic, depth = 'standard') {
        try {
            const searchQuery = topic.title;
            const articles = [];
            const pageSize = depth === 'deep' ? 12 : 5;

            console.log(`Researching "${searchQuery}" with ${depth} depth...`);

            // Fetch related articles from News API
            if (process.env.NEWS_API_KEY) {
                try {
                    const response = await axios.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: searchQuery,
                            language: 'en',
                            sortBy: 'relevancy',
                            pageSize: pageSize,
                            apiKey: process.env.NEWS_API_KEY,
                        },
                    });

                    if (response.data.articles) {
                        articles.push(...response.data.articles.map(a => ({
                            title: a.title,
                            description: a.description,
                            url: a.url,
                            source: a.source.name,
                            publishedAt: a.publishedAt,
                        })));
                    }
                } catch (newsError) {
                    console.error('News API research error:', newsError.message);
                }
            }

            // Always supplement with RSS feeds if we need more depth or News API fails
            if (articles.length < pageSize) {
                console.log('Supplementing research with RSS feeds...');
                const rssArticles = await this.fetchFromRSSFeeds(searchQuery);
                // Limit RSS articles to fill the gap
                articles.push(...rssArticles.slice(0, pageSize - articles.length));
            }

            // Deduplicate by title
            const uniqueArticles = Array.from(new Map(articles.map(a => [a.title.toLowerCase(), a])).values());

            return {
                topic: topic.title,
                depth,
                articles: uniqueArticles,
                summary: this.generateResearchSummary(uniqueArticles),
            };
        } catch (error) {
            console.error('Error fetching topic research:', error);
            return {
                topic: topic.title,
                articles: [],
                summary: `Research topic: ${topic.title}\n\n${topic.description || 'No additional research available.'}`,
            };
        }
    }

    // Generate research summary
    generateResearchSummary(articles) {
        if (!articles.length) return 'No additional research available.';

        return articles
            .slice(0, 5)
            .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description || 'No description'}\n   Source: ${a.source}`)
            .join('\n\n');
    }
}

export default TrendingService;
