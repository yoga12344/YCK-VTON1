
import { GoogleGenAI, Type } from "@google/genai";
import { Gender } from "../types";

/**
 * Utility to prepare image data for the Gemini API.
 */
const prepareImagePart = (base64String: string) => {
  const parts = base64String.split(',');
  const data = parts.length > 1 ? parts[1] : parts[0];
  return {
    inlineData: {
      data,
      mimeType: 'image/jpeg'
    }
  };
};

/**
 * Robust retry wrapper for API calls with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.message?.includes('429') || error.message?.includes('500') || error.status === 429;
    if (isRetryable && retries > 0) {
      console.warn(`Quota hit or server error. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Stage 1: Neural Grounding & Asset DNA Extraction
 * Analyzes the garments for "Visual Anchors" like logos and textures.
 */
export const analyzeTryOn = async (
  personImageBase64: string, 
  shirtImageBase64: string | null, 
  pantImageBase64: string | null,
  dressImageBase64: string | null,
  gender: Gender
) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Act as a Technical Garment Auditor for an Authentic Virtual Try-On System.
      Analyze the reference assets to create a "Visual Lock" manifest:
      1. LOGO/GRAPHIC DNA: Identify exact positions, colors, and shapes of any logos or branding.
      2. TEXTURE ACCURACY: Is it ribbed cotton, heavy denim, or a specific knit?
      3. PATTERN SCALE: Identify the density of stripes, checks, or prints.
      4. STRUCTURAL DETAILS: Note buttons, specific collar shapes, or unique hemlines.
      
      Your manifest MUST be detailed enough to prevent the synthesis engine from substituting the original design with generic clothing.
    `;

    const parts: any[] = [
      { text: prompt },
      { text: "TARGET_SUBJECT (The person who will wear the clothes):" },
      prepareImagePart(personImageBase64)
    ];

    if (shirtImageBase64) {
      parts.push({ text: "SOURCE_ASSET_TOP (Exact design source):" }, prepareImagePart(shirtImageBase64));
    }
    if (pantImageBase64) {
      parts.push({ text: "SOURCE_ASSET_BOTTOM (Exact texture source):" }, prepareImagePart(pantImageBase64));
    }
    if (dressImageBase64) {
      parts.push({ text: "SOURCE_ASSET_DRESS (Exact pattern source):" }, prepareImagePart(dressImageBase64));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            garmentDescription: { type: Type.STRING },
            personDescription: { type: Type.STRING },
            shirtCoverage: { type: Type.STRING },
            pantCoverage: { type: Type.STRING },
            bodySize: { type: Type.STRING, enum: ['S', 'M', 'L'] },
            technicalPrompt: { type: Type.STRING, description: "Detailed manifest for preserving original logos and patterns." },
            stylingSuggestions: {
              type: Type.OBJECT,
              properties: {
                suggestedPant: { type: Type.STRING },
                suggestedShoes: { type: Type.STRING },
                styleVibe: { type: Type.STRING }
              }
            }
          },
          required: ["garmentDescription", "personDescription", "shirtCoverage", "pantCoverage", "bodySize", "technicalPrompt", "stylingSuggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  });
};

/**
 * Stage 2: High-Fidelity Neural Synthesis (Fidelity Focused)
 * Maps the original assets onto the person without changing their design.
 */
export const generateVirtualTryOnImage = async (
  personImageBase64: string, 
  shirtImageBase64: string | null, 
  pantImageBase64: string | null,
  dressImageBase64: string | null,
  technicalDescription: string, 
  shirtCoverage: string,
  pantCoverage: string,
  bodySize: string, 
  gender: Gender
) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      MANDATORY FIDELITY PROTOCOL:
      - You are a high-precision texture synthesis engine.
      - DO NOT HALLUCINATE OR CHANGE THE CLOTHING DESIGN.
      - YOU MUST MAP THE EXACT ASSETS PROVIDED (logos, patterns, textures) onto the subject.
      - If a logo is present in the SOURCE image, it MUST be preserved on the person.
      - KEEP THE SUBJECT IDENTICAL: Face, hair, and original environment must not change.
      - DRAPING: Realistic fabric physics based on the person's pose, but NO design alteration.
    `;

    const parts: any[] = [
      { text: "SUBJECT_TEMPLATE (Keep this person identical):" },
      prepareImagePart(personImageBase64)
    ];

    if (shirtImageBase64) {
      parts.push({ text: `REFERENCE_ASSET_TOP (Copy this exact logo/pattern):` }, prepareImagePart(shirtImageBase64));
    }
    if (pantImageBase64) {
      parts.push({ text: `REFERENCE_ASSET_BOTTOM (Copy this exact texture):` }, prepareImagePart(pantImageBase64));
    }
    if (dressImageBase64) {
      parts.push({ text: `REFERENCE_ASSET_DRESS (Copy this exact design):` }, prepareImagePart(dressImageBase64));
    }

    parts.push({ 
      text: `ACTION: Execute high-fidelity virtual try-on. 
      - Manifest: ${technicalDescription}.
      - IMPORTANT: Do not use generic clothes. Transfer the original pixels and patterns.
      - Top Fit: ${shirtCoverage}.
      - Bottom Fit: ${pantCoverage}.` 
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { 
        systemInstruction,
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Neural synthesis failed to return image data.");
  });
};
