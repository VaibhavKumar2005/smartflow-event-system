import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini SDK
// Make sure to add your GEMINI_API_KEY to a .env file!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post('/api/suggest-route', async (req, res) => {
  try {
    const { userLocation, destination, crowdData } = req.body;

    if (!userLocation || !destination || !crowdData) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Construct the prompt for Gemini
    const prompt = `
      You are an AI assistant for a stadium crowd management system.
      Current Status:
      - Initial User Position: Grid Index ${userLocation}
      - Intended Destination: ${destination}
      - Stadium Heatmap Grid Data (0-24, left-to-right, top-to-bottom):
        ${JSON.stringify(crowdData)}

      Task: Generate a short, smart recommendation (max 2 sentences).
      1. Suggest an optimal route that avoids high/crowded zones.
      2. Mention the approximate time saved.
      3. Keep it sound intelligent, helpful, and concise.
      
      Return ONLY the response text.
    `;

    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const recommendation = result.response.text().trim();

    return res.json({ recommendation });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return res.status(500).json({ error: "Failed to generate route suggestion." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SmartFlow AI Backend running on http://localhost:${PORT}`);
});
