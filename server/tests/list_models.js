import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listModels() {
    try {
        const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const apiKey = settings.geminiKey;

        if (!apiKey) {
            console.error('No Gemini key found');
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // The SDK doesn't have a direct listModels, we usually use the REST API or try common names
        // But we can try to see if the current one works or fails with a useful error
        console.log('Testing current model: ', settings.geminiModel);
        const model = genAI.getGenerativeModel({ model: settings.geminiModel });
        const result = await model.generateContent("Say 'hi'");
        console.log('Response:', (await result.response).text());

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
