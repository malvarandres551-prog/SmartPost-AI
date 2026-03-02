import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function test() {
    try {
        console.log('1. Generating blog...');
        const genRes = await axios.post(`${API_BASE}/generate-blog`, {
            topic: { title: "Remote Hiring Trends 2026" },
            options: { length: "medium", tone: "professional" }
        });
        const blog = genRes.data.blog;
        console.log(`   Blog generated: ${blog.wordCount} words (${blog.provider})`);

        console.log('2. Saving article...');
        const saveRes = await axios.post(`${API_BASE}/articles`, blog);
        const savedArticle = saveRes.data.article;
        console.log(`   Article saved with ID: ${savedArticle.id}`);

        console.log('3. Generating image...');
        try {
            const imgRes = await axios.post(`${API_BASE}/articles/${savedArticle.id}/generate-image`);
            console.log(`   Image generated: ${imgRes.data.imageUrl}`);
        } catch (err) {
            console.error(`   Image generation failed: ${err.response?.data?.message || err.message}`);
        }

    } catch (err) {
        console.error('Test failed:', err.response?.data?.message || err.message);
    }
}

test();
