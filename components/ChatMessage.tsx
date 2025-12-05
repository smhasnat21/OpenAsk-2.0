import React from 'react';
import { Message } from '../types';
import { Bot, User, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div
      className={`group w-full text-slate-800 border-b border-gray-100 last:border-0 ${
        isUser ? 'bg-white' : 'bg-gray-50/50'
      }`}
    >
      <div className="max-w-3xl mx-auto py-8 px-4 flex gap-6 md:gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
              isUser ? 'bg-slate-900 text-white' : isError ? 'bg-red-100 text-red-600' : 'bg-white border border-gray-200 text-emerald-600'
            }`}
          >
            {isUser ? (
              <User size={18} />
            ) : isError ? (
              <AlertCircle size={18} />
            ) : (
              <Bot size={18} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="font-semibold text-sm mb-1 opacity-90">
            {isUser ? 'You' : 'OpenAsk'}
          </div>
          
          {/* Attachments (Images) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {message.attachments.map((att, index) => (
                <div key={index} className="relative group/image overflow-hidden rounded-md border border-gray-200">
                   <img
                    src={att.url || `data:${att.mimeType};base64,${att.data}`}
                    alt="attachment"
                    className="h-48 w-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Text */}
          <div className={`prose prose-slate prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 max-w-none ${isError ? 'text-red-600' : ''}`}>
             <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
