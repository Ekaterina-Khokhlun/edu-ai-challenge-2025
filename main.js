require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(filePath) {
    console.log(`[INFO] Starting transcription for ${filePath}...`);
    const fileStream = fs.createReadStream(filePath);
    const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: fileStream,
    });
    console.log("[SUCCESS] Transcription received from API.");
    return response.text;
}

async function summarizeText(text) {
    console.log("[INFO] Starting summarization...");
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {"role": "system", "content": "You are an expert summarizer. Take the following transcript and provide a concise summary of the key points."},
            {"role": "user", "content": text}
        ],
        temperature: 0.5,
    });
    console.log("[SUCCESS] Summarization received from API.");
    return response.choices[0].message.content;
}

async function analyzeText(text) {
    console.log("[INFO] Starting analysis...");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    const prompt = `Analyze the following text and identify the top 3-5 most frequently mentioned topics. Return a JSON object with a single key "frequently_mentioned_topics", which is an array of objects, each with "topic" and "mentions". Text: "${text}" Provide only the raw JSON object.`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {"role": "system", "content": "You are an expert text analyst that returns data in JSON format."},
            {"role": "user", "content": prompt}
        ],
        temperature: 0.2,
    });
    
    console.log("[SUCCESS] Analysis received from API.");
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    const durationInMinutes = wordCount / 150;
    analysisResult.word_count = wordCount;
    analysisResult.speaking_speed_wpm = durationInMinutes > 0 ? Math.round(wordCount / durationInMinutes) : 0;
    
    return analysisResult;
}

async function run() {
    console.log("--- Welcome to the Audio Analysis Tool ---");
    
    const audioFilePath = readlineSync.question('Please enter the path to your audio file: ');
    
    if (!fs.existsSync(audioFilePath)) {
        console.error(`[ERROR] File not found: ${audioFilePath}`);
        return;
    }

    try {
        const transcription = await transcribeAudio(audioFilePath);
        const summary = await summarizeText(transcription);
        const analysis = await analyzeText(transcription);
        
        // Save a timestamped log of the transcription
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const transcriptionLogFile = `transcription-log-${timestamp}.txt`;
        fs.writeFileSync(transcriptionLogFile, transcription, { encoding: 'utf-8' });
        console.log(`[INFO] Full transcription saved to ${transcriptionLogFile}`);

        console.log("\n--- SUMMARY ---");
        console.log(summary);
        
        console.log("\n--- ANALYTICS ---");
        console.log(JSON.stringify(analysis, null, 2));

        // If the processed file was the one for the challenge, create the submission files
        if (path.basename(audioFilePath).toUpperCase().startsWith('CAR0004')) {
            console.log("\n[INFO] Saving submission files...");
            fs.writeFileSync('transcription.md', transcription, { encoding: 'utf-8' });
            fs.writeFileSync('summary.md', summary, { encoding: 'utf-8' });
            fs.writeFileSync('analysis.json', JSON.stringify(analysis, null, 2), { encoding: 'utf-8' });
            console.log("[SUCCESS] Submission files created/updated.");
        }

    } catch (error) {
        console.error("[FATAL] An error occurred:", error.message);
    }
}

run(); 