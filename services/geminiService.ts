
import { GoogleGenAI, Type } from "@google/genai";
import { PRODUCTS } from "../constants";
import { Product } from "../types";

// Initialize GoogleGenAI using process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSmartRecommendations(userInput: string, activeProducts?: Product[]) {
  try {
    const catalog = (activeProducts && activeProducts.length > 0) ? activeProducts : PRODUCTS;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `El usuario está buscando algo en un kiosco o tienda. Su solicitud es: "${userInput}".
      Basado en el siguiente catálogo activo: ${JSON.stringify(catalog.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price })))}
      Por favor, recomienda de 1 a 3 productos que mejor se ajusten a lo que pide o a su antojo/estado de ánimo. 
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
              description: "Explicación amigable de por qué recomiendas estos productos"
            }
          },
          required: ["products", "reasoning"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return null;
  }
}

