import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testBatch() {
    const topics = ["AI in Healthcare 2026", "Future of Work"];
    console.log(`Starting batch for: ${topics.join(', ')}`);

    for (const topic of topics) {
        try {
            console.log(`\nProcessing: ${topic}`);
            const genRes = await axios.post(`${API_BASE}/generate-blog`, {
                topic: { title: topic },
                options: { length: "short", tone: "professional" }
            });
            console.log(`   Generated: ${genRes.data.blog.wordCount} words`);

            const saveRes = await axios.post(`${API_BASE}/articles`, genRes.data.blog);
            console.log(`   Saved: ${saveRes.data.article.id}`);
        } catch (err) {
            console.error(`   Failed: ${err.message}`);
        }
    }
}

testBatch();
