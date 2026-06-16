import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize the Gemini Client
const genAI = new GoogleGenerativeAI(apiKey);

export const analyzeLogWithGemini = async (logText: string) => {
  if (!apiKey) {
    console.warn('[AI Service] GEMINI_API_KEY is not set. Returning mocked analysis.');
    return {
      summary: 'Mocked summary: Application crashed due to an unknown error.',
      action: 'Mocked action: Please configure GEMINI_API_KEY to see actual analysis.'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    You are an expert Site Reliability Engineer (SRE). 
    Please analyze the following application crash log.
    Provide your response strictly in the following JSON format:
    {
      "summary": "A clear, 1-sentence summary of what went wrong.",
      "action": "A clear, 1-sentence suggested remediation action."
    }

    --- CRASH LOG ---
    ${logText}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // We expect the LLM to return JSON, but it might wrap it in markdown code blocks.
    // Let's safely extract and parse the JSON.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse JSON from Gemini response');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      summary: 'AI Analysis Failed due to an API Error.',
      action: 'Review the raw logs manually.'
    };
  }
};
