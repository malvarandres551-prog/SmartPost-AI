import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGemini() {
    try {
        const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const apiKey = settings.geminiKey;

        console.log('Testing Gemini with key length:', apiKey?.length);
        if (!apiKey) {
            console.error('No Gemini key found in settings.json');
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('Generating content...');
        const result = await model.generateContent("Create a JSON object for a blog post about Employee Retention. JSON only.");
        const response = await result.response;
        const text = response.text();
        console.log('Raw response:', text);

        try {
            const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            const json = JSON.parse(cleanText);
            console.log('Successfully parsed JSON!');
        } catch (e) {
            console.error('JSON Parsing failed:', e.message);
        }
    } catch (error) {
        console.error('❌ TEST FAILED:');
        console.error(error.message);
    }
}

testGemini();
