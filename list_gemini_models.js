
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listModels() {
    try {
        const settingsPath = path.join(__dirname, 'server', 'data', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const apiKey = settings.geminiKey;

        if (!apiKey) {
            console.error('No Gemini key found in settings.json');
            return;
        }

        console.log('Fetching models for key:', apiKey.substring(0, 8) + '...');

        // The SDK doesn't have a direct listModels method, so we use the REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });

            // Also write to a file for easier viewing if many
            fs.writeFileSync('available_models.txt', JSON.stringify(data.models, null, 2));
            console.log('\nFull list saved to available_models.txt');
        } else {
            console.error('No models found or error in response:', data);
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
