import { GoogleGenAI, Type } from "@google/genai";
import { ModelArchitecture, FileMetadata } from "../types";

const model = import.meta.env.MODEL;

if (!model) {
  throw new Error("MODEL not defined");
}

const ai = new GoogleGenAI({ model });

const fallbackArchitecture = (file: FileMetadata): ModelArchitecture => ({
  name: file.name || "Unknown Model",
  type: "Unknown",
  description: "Fallback architecture — N-AI analysis unavailable.",
  totalParameters: "N/A",
  useCase: "Diagnostic placeholder",
  layers: [
    {
      id: "fallback",
      name: "Input Layer",
      type: "Placeholder",
      neurons: 0,
      activation: "none",
      details: "Fallback layer",
      contribution: "Ensures UI remains operational.",
      relativeImportance: 0.5
    }
  ]
});

export const analyzeModelFile = async (
  file: FileMetadata,
  fileSnippet: string
): Promise<ModelArchitecture> => {

  const prompt = `
Analyze the following model file metadata and content snippet.
Predict the model architecture, its type, and its purpose.

File Name: ${file.name}
File Size: ${file.size} bytes
File Type: ${file.type}
Content Snippet: ${fileSnippet}

Return ONLY valid JSON.

For EACH layer include:
- contribution
- relativeImportance (0.1 → 1.0)

If file content is unknown, infer from the name.
`;

  try {
    console.log("🚀 Sending N-AI request…");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            totalParameters: { type: Type.STRING },
            useCase: { type: Type.STRING },
            layers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  neurons: { type: Type.INTEGER },
                  activation: { type: Type.STRING },
                  details: { type: Type.STRING },
                  contribution: { type: Type.STRING },
                  relativeImportance: { type: Type.NUMBER }
                },
                required: [
                  "id",
                  "name",
                  "type",
                  "neurons",
                  "contribution",
                  "relativeImportance"
                ]
              }
            }
          },
          required: [
            "name",
            "type",
            "description",
            "layers",
            "totalParameters",
            "useCase"
          ]
        }
      }
    });


    let rawText =
      response?.text ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    console.log("RAW AI RESPONSE:", rawText);


    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!rawText) {
      console.warn("⚠ AI returned empty response — using fallback");
      return fallbackArchitecture(file);
    }

  
    const parsed = JSON.parse(rawText);

    console.log("✅ Parsed AI architecture:", parsed);

    return parsed as ModelArchitecture;

  } catch (err) {
    console.error("🔥 AI analysis failed:", err);

    console.warn("⚠ Falling back to safe architecture");

    return fallbackArchitecture(file);
  }
};
