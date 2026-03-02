
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function testImageGen() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('Testing Image Gen with key starting with:', apiKey?.substring(0, 10));

        if (!apiKey) {
            console.error('No OPENAI_API_KEY found in ENV');
            return;
        }

        const openai = new OpenAI({ apiKey });

        console.log('Generating image...');
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: "A professional business blog image about AI in Healthcare.",
            n: 1,
            size: "1024x1024",
        });

        console.log('✅ Success! Image URL:', response.data[0].url);
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        if (error.response) {
            console.error('Error Details:', error.response.data);
        }
    }
}

testImageGen();
