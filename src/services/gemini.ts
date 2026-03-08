import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiModel = "gemini-3-flash-preview";

export async function getWasteClassification(imageBase64: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
        {
          text: "Classify this waste item. Is it recyclable, compostable, or landfill? Provide instructions on how to dispose of it properly. Return JSON with fields: category, confidence, instructions.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          instructions: { type: Type.STRING },
        },
        required: ["category", "confidence", "instructions"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function getHealthAdvice(symptoms: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `The user reports the following symptoms: ${symptoms}. Provide a preliminary assessment and wellness advice. Remind the user that this is not a medical diagnosis and they should consult a doctor.`,
    config: {
      systemInstruction: "You are a helpful medical assistant. Provide clear, empathetic, and professional advice.",
    },
  });

  return response.text;
}

export async function getEnergyOptimization(habits: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Based on these home energy habits: ${habits}, suggest 3-5 specific ways to optimize energy usage and reduce carbon footprint.`,
    config: {
      systemInstruction: "You are an energy efficiency expert. Focus on practical, high-impact changes.",
    },
  });

  return response.text;
}

export async function getDisasterRisk(location: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Assess the typical disaster risks for ${location} (e.g., floods, wildfires, earthquakes). Provide a risk level (Low, Medium, High) and 3 key preparedness tips.`,
    config: {
      systemInstruction: "You are a disaster preparedness expert. Provide accurate and actionable risk assessments.",
    },
  });

  return response.text;
}
