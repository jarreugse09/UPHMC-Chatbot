import { GoogleGenAI } from "@google/genai";
import { IConversationMessage } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private modelName: string = "gemini-2.0-flash";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(
      "GEMINI_API_KEY loaded:",
      apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET",
    );
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: Array<IConversationMessage> = [],
  ): Promise<string> {
    try {
      const systemInstruction = `You are an AI Chatbot for University of Perpetual Help System Dalta - Molino Campus named "Perps". You are designed to assist students, faculty, and visitors by providing instant responses to inquiries about programs such as basic education (kindergarten, grade school, junior high school, and senior high school) and college programs, admissions, academics, campus services, events, and general school information. Make it more of a Conversational rather than searching. And when the Inquiry is outside the content and scope of the University answer with "Sorry, my knowledge is limited for the University only." **Do not include the user's input in your response.** It is very important that when users ask the same or similar questions, you always provide the same response using the same wording and format as the first time it was answered to ensure consistency and maintain a professional experience. Even if the user rephrases or slightly changes the question, your answer should stay exactly the same. You should never include or repeat the user's input or question in your responses. Always maintain a positive, welcoming, and supportive attitude throughout every conversation.`;

      const contents = conversationHistory.map((msg: IConversationMessage) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction,
        },
      });

      return (
        response.text?.trim() || "I'm sorry, I couldn't generate a response."
      );
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate response from AI");
    }
  }
}

export default new GeminiService();
