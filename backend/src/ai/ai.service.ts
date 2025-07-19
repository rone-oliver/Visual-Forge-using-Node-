import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from 'src/chat/models/chat-message.schema';
import { IAiService } from './interfaces/ai-service.interface';

@Injectable()
export class AiService implements IAiService {
    private readonly _logger = new Logger(AiService.name);
    private _genAI: GoogleGenerativeAI;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            this._logger.error('GEMINI_API_KEY is not set in environment variables.');
            throw new Error('GEMINI_API_KEY is not set in environment variables.');
        }
        this._genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async generateSmartReplies(messages: Message[], currentUserId: string): Promise<string[]> {
        const model = this._genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `You are a chat reply assistant. Your task is to generate exactly three, 
            very short reply suggestions for the 'user' based on the last message from the 'model'.
            RULES:
            1. Provide EXACTLY THREE suggestions.
            2. Each suggestion must be 1-4 words.
            3. Output the three suggestions as a single string, separated only by commas.
            4. DO NOT add any introductory text, numbering, or quotes.
            EXAMPLE OUTPUT: 'Sounds good,Okay, thanks!,I understand'`
        });

        const history = messages.map(msg => ({
            role: msg.sender.toString() === currentUserId ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const lastMessage = history.length > 0 ? history[history.length - 1] : null;

        // We only generate replies if the last message was from the 'model' (the other user)
        if (!lastMessage || lastMessage.role !== 'model') {
            this._logger.log(`Skipping smart replies: Last message was from role '${lastMessage?.role || 'unknown'}', not 'model'.`);
            return [];
        }

        // Gemini API prefers history to start with a 'user' role.
        // Find the first user message and slice the history from that point.
        const firstUserIndex = history.findIndex(h => h.role === 'user');
        if (firstUserIndex === -1) {
            this._logger.log('Skipping smart replies: No user message found in history.');
            return [];
        }
        const validHistory = history.slice(firstUserIndex);

        try {
            const result = await model.generateContent({
                contents: [
                    ...validHistory,
                    {
                        role: 'user',
                        parts: [{ text: 'Based on the last message from the "model", provide three concise reply suggestions for the "user".' }]
                    }
                ],
            });
            const response = result.response;
            const text = response.text();

            this._logger.log('suggestions', text.split(',').map(s => s.trim()));
            return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } catch (error) {
            this._logger.error('Error getting smart replies from Gemini:', error);
            throw new Error('Failed to generate smart replies.');
        }
    }
}
