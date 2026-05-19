import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const generateQuestions = async (count: number = 10, previousQuestions: string[] = []): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate ${count} General Knowledge (GK) questions in Marathi language. 
      The questions should cover various topics like History, Geography, Science, Current Affairs, and Maharashtra specific GK.
      Ensure the questions are unique and not in this list of previous questions: ${previousQuestions.join(', ')}.
      Each question must have exactly 4 options, 1 correct answer, and a detailed explanation of why the answer is correct.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the question (e.g., q1, q2)." },
              text: { type: Type.STRING, description: "The question text in Marathi." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options in Marathi."
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "The index of the correct option (0 to 3)." },
              explanation: { type: Type.STRING, description: "A detailed explanation in Marathi of why the answer is correct." }
            },
            required: ["id", "text", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr) as Question[];
    }
    return [];
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

export const askChatbot = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: message,
      config: {
        systemInstruction: "You are a helpful General Knowledge assistant for a Marathi GK Quiz app. Answer questions accurately and concisely in Marathi.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text || "माफ करा, मला उत्तर देता आले नाही.";
  } catch (error) {
    console.error("Error asking chatbot:", error);
    return "माफ करा, काहीतरी चूक झाली.";
  }
};
