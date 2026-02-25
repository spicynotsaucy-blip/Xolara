'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import HeroStatsBar from '@/components/HeroStatsBar';
import ConversationFeed from '@/components/ConversationFeed';
import LeadPipeline from '@/components/LeadPipeline';
import { supabase } from '@/lib/supabase';
import { Lead } from '@/types/database';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial leads
    fetchLeads();

    // Subscribe to real-time lead updates
    const subscription = supabase
      .channel('leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
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
