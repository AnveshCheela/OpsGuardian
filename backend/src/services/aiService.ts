import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const maxRetries = Number.parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10);
const retryBaseMs = Number.parseInt(process.env.GEMINI_RETRY_BASE_MS || '1000', 10);

// Initialize the Gemini Client
const genAI = new GoogleGenerativeAI(apiKey);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isNaN(status) ? undefined : status;
  }
  return undefined;
};

const isTransientGeminiError = (error: unknown) => {
  const status = getErrorStatus(error);
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const fallbackAnalysis = (logText: string) => {
  const compactPreview = logText.replace(/\s+/g, ' ').trim().slice(0, 180);
  return {
    summary: compactPreview
      ? `AI analysis is temporarily unavailable. Raw log preview: ${compactPreview}`
      : 'AI analysis is temporarily unavailable and the raw log was empty.',
    action: 'Review the raw log manually and retry AI analysis after the Gemini service recovers.'
  };
};

export const analyzeLogWithGemini = async (logText: string) => {
  if (!apiKey) {
    console.warn('[AI Service] GEMINI_API_KEY is not set. Returning mocked analysis.');
    return {
      summary: 'Mocked summary: Application crashed due to an unknown error.',
      action: 'Mocked action: Please configure GEMINI_API_KEY to see actual analysis.'
    };
  }

  const model = genAI.getGenerativeModel({ model: modelName });
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

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Gemini may wrap JSON in markdown code blocks, so extract the object first.
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse JSON from Gemini response');
    } catch (error) {
      if (isTransientGeminiError(error) && attempt < maxRetries) {
        const delayMs = retryBaseMs * 2 ** (attempt - 1);
        console.warn(
          `[AI Service] Gemini ${modelName} request failed with status ${getErrorStatus(error)}. Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms.`
        );
        await sleep(delayMs);
        continue;
      }

      console.error('Gemini API Error:', error);
      return fallbackAnalysis(logText);
    }
  }

  return fallbackAnalysis(logText);
};
