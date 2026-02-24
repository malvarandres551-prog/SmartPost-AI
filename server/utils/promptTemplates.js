// Prompt templates for AI blog generation
export const blogPromptTemplates = {
  // Main blog generation prompt
  generateBlog: (topic, researchData, options = {}) => {
    const toneMap = {
      professional: 'Professional, authoritative, yet accessible',
      casual: 'Casual, conversational, and engaging',
      authoritative: 'Authoritative, expert-led, and highly professional',
      friendly: 'Friendly, approachable, and helpful',
      technical: 'Technical, detailed, and data-driven'
    };

    const lengthMap = {
      short: '600-800 words',
      medium: '1,200-1,500 words',
      long: '1,800-2,500 words'
    };

    const formatMap = {
      'blog-post': 'Comprehensive Blog Post',
      'listicle': 'Listicle with numbered points',
      'how-to': 'Step-by-step How-To Guide',
      'opinion': 'Opinion/Thought Leadership Piece',
      'case-study': 'Analysis-focused Case Study'
    };

    const tone = toneMap[options.tone] || toneMap.professional;
    const length = lengthMap[options.length] || lengthMap.medium;
    const format = formatMap[options.format] || formatMap['blog-post'];

    return `You are an expert content writer specializing in workforce management, operations, staffing, and business services. Your audience consists of decision-makers, HR professionals, and business leaders.

Generate a ${format} about the following trending topic:

TOPIC: ${topic.title}

RESEARCH CONTEXT:
${researchData}

REQUIREMENTS:
1. Create an SEO-optimized, compelling headline (60-70 characters)
2. Write a meta description (150-160 characters)
3. Include an executive summary/introduction (2-3 paragraphs)
4. Develop 5-7 main sections with descriptive H2 subheadings (ensure depth for the requested length)
5. Each section should have multiple paragraphs with actionable insights
6. Include practical recommendations and real-world applications
7. Add a conclusion with key takeaways (minimum 5 bullet points)
8. Suggest 7-10 relevant tags
9. Social Media Command Center:
   - "Viral Hooks": Provide 3 catchy headlines designed for high engagement.
   - "LinkedIn Post": A professional, value-driven long-form post (200-300 words) with emojis.
   - "X Thread": A structured 7-10 post thread. Post 1 must be a strong hook.
   - "Instagram Caption": Engaging, lifestyle/business oriented with emojis and 10 hashtags.
10. SEO & Growth:
    - Focus Keyword: Primary target keyword.
    - Secondary Keywords: 5 long-tail keywords.
    - SEO Checklist: 5-7 specific improvements (e.g., "Add alt text to images", "Include keyword in H2").
11. Content Visuals:
    - Infographic Outline: A text-based breakdown of data/steps for a visual chart.
    - Image Captions: 3 descriptive captions for the article's visuals.
12. Automation:
    - Newsletter Format: A concise, email-friendly summary (400-500 words) with a Call to Action.
13. Target length: ${length}
14. Tone: ${tone}
15. Include data points and statistics where relevant (mark with [VERIFY] if uncertain)

FORMAT YOUR RESPONSE AS JSON:
{
  "headline": "Your compelling headline here",
  "metaDescription": "Your meta description here",
  "focusKeyword": "Primary focus keyword",
  "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
  "seoChecklist": ["Point 1", "Point 2"],
  "tags": ["tag1", "tag2"],
  "socialSnippets": {
    "viralHooks": ["Hook 1", "Hook 2", "Hook 3"],
    "linkedin": "Full LinkedIn post here...",
    "xThread": ["Post 1 content", "Post 2 content", "..."],
    "instagram": "Full Instagram caption here..."
  },
  "visuals": {
    "infographicOutline": "Description of the visual...",
    "imageCaptions": ["Caption 1", "Caption 2"]
  },
  "newsletter": "Full email-formatted content here...",
  "content": {
    "introduction": "Full introduction text...",
    "sections": [
      {
        "heading": "Section heading",
        "content": "Section content..."
      }
    ],
    "conclusion": "Conclusion text...",
    "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
  },
  "wordCount": 1500,
  "readingTime": "7 min"
}

Focus on providing practical, actionable insights that decision-makers can implement immediately. Ensure the content is substantive and meets the requested word count range of ${length}.`;
  },

  // Simplified prompt for faster generation
  generateQuickBlog: (topic) => `Write a professional 1200-word blog post about: "${topic.title}"

Target audience: HR professionals and business leaders in workforce management.

Include:
- Compelling headline
- 3-4 main sections with subheadings
- Practical insights and recommendations
- Professional, authoritative tone

Return as JSON with: headline, metaDescription, tags, content (introduction, sections array, conclusion), wordCount.`,

  // Research summary prompt
  summarizeResearch: (articles) => `Summarize the following articles about a trending topic in workforce/staffing:

${articles.map((a, i) => `Article ${i + 1}: ${a.title}\n${a.description || a.snippet}\n`).join('\n')}

Provide:
1. Main themes and trends (3-5 bullet points)
2. Key statistics or data points
3. Expert opinions or insights
4. Emerging challenges or opportunities

Keep summary concise (200-300 words).`,
};

// Niche-specific context for better AI understanding
export const nicheContext = {
  keywords: [
    'workforce management',
    'staffing solutions',
    'HR technology',
    'recruitment automation',
    'employee retention',
    'remote work',
    'hybrid workforce',
    'BPO services',
    'outsourcing',
    'talent acquisition',
    'workforce analytics',
    'employee engagement',
    'HR compliance',
    'workforce planning',
    'contingent workforce',
  ],

  targetAudience: [
    'HR Directors',
    'Chief People Officers',
    'Talent Acquisition Managers',
    'Operations Managers',
    'Business Service Leaders',
    'Workforce Planning Analysts',
    'Recruitment Leaders',
  ],

  contentFocus: [
    'Practical, actionable insights',
    'Data-driven recommendations',
    'Industry trends and analysis',
    'Best practices and case studies',
    'Technology and innovation',
    'Compliance and risk management',
    'Cost optimization strategies',
  ],
};
