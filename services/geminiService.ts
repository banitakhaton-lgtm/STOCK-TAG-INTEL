
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAISuggestions = async (topTags: string[]): Promise<AIAnalysis> => {
  const prompt = `Act as an expert Microstock contributor. I have a list of top-performing keywords from a niche: ${topTags.join(', ')}. 
  Based on these, generate:
  1. A high-converting title (max 200 chars).
  2. 10 additional relevant high-demand tags not in the list.
  3. A short niche insight for contributors.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            additionalTags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            nicheInsight: { type: Type.STRING }
          },
          required: ["suggestedTitle", "additionalTags", "nicheInsight"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      suggestedTitle: "Error generating title",
      additionalTags: [],
      nicheInsight: "Could not connect to AI service."
    };
  }
};
