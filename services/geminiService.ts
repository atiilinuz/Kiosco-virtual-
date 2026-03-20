
import { GoogleGenAI, Type } from "@google/genai";
import { PRODUCTS } from "../constants";

// Correctly initialize GoogleGenAI using the process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSmartRecommendations(userInput: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `El usuario está buscando algo en un kiosco. Su solicitud es: "${userInput}".
      Basado en el siguiente catálogo: ${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category })))}
      Por favor, recomienda de 1 a 3 productos que mejor se ajusten a lo que pide o a su estado de ánimo. 
      Si no hay coincidencia directa, sugiere algo relacionado.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de IDs de productos recomendados"
            },
            reasoning: {
              type: Type.STRING,
              description: "Explicación amigable de por qué recomiendas esto"
            }
          },
          required: ["products", "reasoning"]
        }
      }
    });

    // Access text property directly and ensure it is trimmed before parsing.
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return null;
  }
}
