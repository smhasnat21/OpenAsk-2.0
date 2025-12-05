import React, { useState, useEffect, useRef } from 'react';
import { streamGeminiResponse } from './services/geminiService';
import { Message, Attachment } from './types';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!text && attachments.length === 0) return;

    // 1. Create User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      attachments: attachments,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 2. Create Placeholder AI Message
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'model',
      content: '', // Starts empty
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, initialAiMessage]);

    try {
      // 3. Stream Response
      // Pass the current history (excluding the new user message we just added effectively, 
      // but the service function expects valid history to build context, so we pass current messages BEFORE this update 
      // OR we just rely on the service to handle the last message.
      // In our service implementation, we pass (history, newMessage, newAttachments).
      
      const stream = streamGeminiResponse(
        messages, // Pass existing history (before this new turn)
        text,
        attachments
      );

      let accumulatedText = '';

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: "Sorry, I encountered an error processing your request. Please check your API key or connection.", isError: true }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <Sparkles className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">OpenAsk</h1>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-500">
          Gemini 2.5 Flash
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="text-emerald-600" size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">How can I help you today?</h2>
            <p className="max-w-md text-gray-400 mb-8">
              I can help you analyze images, summarize documents, or answer questions about anything you see.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              <button 
                onClick={() => handleSendMessage("Analyze this invoice image and extract the total amount.", [])}
                className="p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <span className="block font-medium text-slate-900 group-hover:text-emerald-700 mb-1">Analyze an invoice</span>
                <span className="text-sm text-gray-400">Extract data from documents</span>
              </button>
              <button 
                onClick={() => handleSendMessage("Explain the diagram in this image in simple terms.", [])}
                className="p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
              >
                 <span className="block font-medium text-slate-900 group-hover:text-emerald-700 mb-1">Explain a diagram</span>
                 <span className="text-sm text-gray-400">Understand complex visuals</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
