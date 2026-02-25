'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import HeroStatsBar from '@/components/HeroStatsBar';
import ConversationFeed from '@/components/ConversationFeed';
import LeadPipeline from '@/components/LeadPipeline';
import { supabase } from '@/lib/supabase';
import { getCurrentAgent } from '@/lib/auth';
import { getAllLeads, getAllConversations } from '@/lib/db';
import { Lead } from '@/types/database';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and get agent
    getCurrentAgent().then((agentData) => {
      if (!agentData) {
        router.push('/login');
        return;
      }
      setAgent(agentData);
      fetchData(agentData.id);
    });
  }, []);

  async function fetchData(agentId: string) {
    try {
      const [leadsData, conversationsData] = await Promise.all([
        getAllLeads(agentId),
        getAllConversations(agentId)
      ]);
      
      setLeads(leadsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!agent) return;

    // Subscribe to real-time lead updates
    const leadSubscription = supabase
      .channel(`leads-${agent.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          fetchData(agent.id);
        }
      )
      .subscribe();

    // Subscribe to real-time conversation updates
    const conversationSubscription = supabase
      .channel(`conversations-${agent.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          fetchData(agent.id);
        }
      )
      .subscribe();

    return () => {
      leadSubscription.unsubscribe();
      conversationSubscription.unsubscribe();
    };
  }, [agent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return null; // Will redirect
  }

      return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time lead engagement and pipeline overview</p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8">
          <HeroStatsBar leads={leads} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-320px)]">
          {/* Conversation Feed - 60% width */}
          <div className="lg:col-span-3 h-full">
            <div className="h-full glass-card rounded-2xl p-4">
              <ConversationFeed />
            </div>
          </div>

          {/* Lead Pipeline - 40% width */}
          <div className="lg:col-span-2 h-full">
            <div className="h-full glass-card rounded-2xl p-4 overflow-hidden">
              <LeadPipeline leads={leads} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
