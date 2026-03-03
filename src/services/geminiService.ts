import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function fetchToolMetadata(url: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this URL: ${url}. 
      Return a JSON object with:
      - name: The name of the AI tool.
      - description: A short, catchy description (max 150 chars).
      - category: One of [Chat, Image, Video, Audio, Code, Writing, Productivity, Other].
      - tags: Array of 3 relevant tags.
      - logo_url: A likely favicon or logo URL (e.g. https://www.google.com/s2/favicons?sz=128&domain=${new URL(url).hostname}).
      
      Return ONLY the JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}
