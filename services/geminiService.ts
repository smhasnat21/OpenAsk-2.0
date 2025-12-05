import { GoogleGenAI, GenerateContentResponse, Content, Part } from "@google/genai";
import { Message, Attachment } from "../types";

// Initialize the Gemini API client
// Ideally, in a real production app, you might proxy this through a backend to hide the key,
// but for this client-side demo, we use the env variable directly as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Converts our internal Message structure to the Gemini Content format.
 */
const formatHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => {
    const parts: Part[] = [];

    // Add attachments if they exist
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });
    }

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role,
      parts: parts,
    };
  });
};

/**
 * Streams a response from the Gemini API based on the conversation history.
 */
export const streamGeminiResponse = async function* (
  history: Message[],
  newMessage: string,
  newAttachments: Attachment[]
) {
  try {
    // 1. Construct the full history including the new message being sent
    // We do not add the new message to 'history' array here because the UI state handles that.
    // We need to construct the API payload.
    const validHistory = history.filter(m => !m.isError); // Filter out UI error messages
    
    const formattedHistory = formatHistory(validHistory);

    // 2. Add the current new message to the contents payload
    const currentParts: Part[] = [];
    newAttachments.forEach(att => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
    if (newMessage) {
      currentParts.push({ text: newMessage });
    }

    const newContent: Content = {
      role: 'user',
      parts: currentParts
    };

    // 3. Call the API
    // We use generateContentStream with the full history + new message as "contents".
    // This allows us to maintain state manually and handle images in history easily.
    const allContents = [...formattedHistory, newContent];

    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: allContents,
    });

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate response");
  }
};
