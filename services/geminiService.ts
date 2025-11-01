
import { GoogleGenAI } from "@google/genai";

// FIX: Per guideline, API_KEY should be accessed directly from process.env.
if (!process.env.API_KEY) {
  // A simple check, though the environment should have it.
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

// FIX: Per guideline, initialize with API key directly from process.env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getOptimalServerSuggestion(
  query: string,
  countryList: string[]
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  const prompt = `
    You are an intelligent VPN server recommendation assistant.
    Based on the user's request, suggest the single best country from the provided list.
    Your response MUST be ONLY the name of the country from the list, with no additional text, explanation, or punctuation.

    User Request: "${query}"

    Available Countries:
    ${countryList.join(', ')}

    Your Answer (just the country name):
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text.trim();
    
    // Clean up response to ensure it's just a country name
    const cleanedText = text.replace(/[^a-zA-Z\s]/g, '').trim();

    // Validate if the response is in our list
    const matchingCountry = countryList.find(c => c.toLowerCase() === cleanedText.toLowerCase());

    if (matchingCountry) {
        return matchingCountry;
    } else {
        console.warn(`Gemini suggested a country not in the list: "${cleanedText}". Falling back to a default.`);
        return countryList[0] || "United States"; // Fallback to the first available country
    }
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a suggestion from the AI. Please try again.");
  }
}
