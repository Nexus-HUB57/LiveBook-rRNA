import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata = {
  title: 'Chat com Agentes | CHIMERA',
  description: 'Chat streaming com RAG rRNA e agentes AI do ecossistema Nexus.',
};

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-120px)] min-h-[500px] max-w-[1400px] mx-auto">
      <ChatInterface />
    </div>
  );
}