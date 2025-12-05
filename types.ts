export type Role = 'user' | 'model';

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
  url?: string; // For preview display
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
