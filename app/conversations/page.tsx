import Sidebar from '@/components/Sidebar';

export default function ConversationsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Conversations</h1>
        <p className="text-gray-400">Full conversation history coming soon...</p>
      </main>
    </div>
  );
}
