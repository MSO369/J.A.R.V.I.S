
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { PaperAirplaneIcon, CpuChipIcon, SparklesIcon } from '../icons/HeroIcons';
import { marked } from 'marked';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const initializeChat = useCallback(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
      });
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Error: Could not initialize the AI chat model. Please check your API key and configuration."}]);
    }
  }, []);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (isThinkingMode) {
        // One-off call for complex tasks
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: input,
          config: {
            thinkingConfig: { thinkingBudget: 32768 }
          }
        });
        const botMessage: ChatMessage = { role: 'model', content: response.text };
        setMessages(prev => [...prev, botMessage]);

      } else {
        // Streaming chat for faster responses
        if (!chatRef.current) {
            throw new Error("Chat not initialized");
        }
        const stream = await chatRef.current.sendMessageStream({ message: input });
        
        let currentBotMessage = '';
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        for await (const chunk of stream) {
            currentBotMessage += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', content: currentBotMessage };
                return newMessages;
            });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-500/50 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-cyan-300" /></div>}
            <div className={`p-4 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gray-800'}`}>
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
              />
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>
      <div className="mt-6">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isThinkingMode ? "Ask a complex question..." : "Ask me anything..."}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-4 pr-24 py-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              onClick={() => setIsThinkingMode(!isThinkingMode)}
              className={`p-2 rounded-md transition-colors ${isThinkingMode ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
              title="Toggle Thinking Mode"
            >
              <CpuChipIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="ml-2 p-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-gray-500"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
