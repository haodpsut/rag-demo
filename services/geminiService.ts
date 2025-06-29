import { GoogleGenAI, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initGemini = (apiKey: string) => {
  if (!apiKey) {
    console.error("Gemini API Key is missing for initialization.");
    throw new Error("Gemini API Key is missing for initialization.");
  }
  ai = new GoogleGenAI({ apiKey });
};

const model = "gemini-2.5-flash-preview-04-17";

export const createRAGChatSession = (context: string): Chat => {
  if (!ai) {
    throw new Error("Gemini AI service has not been initialized. Please configure the API Key.");
  }
  
  const systemInstruction = `You are an expert assistant. Your task is to answer user questions based *only* on the provided context from Google Drive documents.
  Do not use any external knowledge.
  If the answer cannot be found in the provided context, you must explicitly state: "I could not find an answer in the provided documents."
  Be concise and directly answer the question.
  
  CONTEXT:
  ---
  ${context}
  ---
  `;
  
  const chat: Chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
};

export const sendMessage = async (
  chat: Chat, 
  message: string, 
  onChunk: (chunk: string) => void
): Promise<void> => {
  if (!ai) {
    throw new Error("Gemini AI service has not been initialized.");
  }
  const stream = await chat.sendMessageStream({ message });
  for await (const chunk of stream) {
    onChunk(chunk.text);
  }
};
