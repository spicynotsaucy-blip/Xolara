'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { getAllLeads } from '@/lib/db';
import { getCurrentAgent } from '@/lib/auth';
import { Lead } from '@/types/database';
import { supabase } from '@/lib/supabase';

const STATUS_CONFIG = {
  new: { label: 'New', bg: 'bg-gray-500/20', color: 'text-gray-400', dot: 'bg-gray-400' },
  engaged: { label: 'Engaged', bg: 'bg-blue-500/20', color: 'text-blue-400', dot: 'bg-blue-400' },
  qualified: { label: 'Qualified', bg: 'bg-yellow-500/20', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  appointed: { label: 'Appointed', bg: 'bg-green-500/20', color: 'text-green-400', dot: 'bg-green-400' },
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [agent, setAgent] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and get agent
    getCurrentAgent().then((agentData) => {
      if (!agentData) {
        router.push('/login');
        return;
      }
      setAgent(agentData);
      fetchLeads(agentData.id);
    });
  }, []);

  async function fetchLeads(agentId: string) {
    try {
      const data = await getAllLeads(agentId);
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!agent) return;

    const channel = supabase
      .channel(`leads-${agent.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `agent_id=eq.${agent.id}`,
      }, () => {
        fetchLeads(agent.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agent]);

  const filtered = leads.filter((lead) => {
    const matchesSearch = lead.phone_number.includes(search) ||
      (lead.budget?.toLowerCase().includes(search.toLowerCase())) ||
      (lead.area?.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || lead.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Leads</h1>
          <p className="text-gray-400">All leads engaging with your AI agent</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <input
            type="text"
            placeholder="Search by phone, budget, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1]/50 transition-colors"
          />
          <div className="flex gap-2">
            {['all', 'new', 'engaged', 'qualified', 'appointed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === status
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#12121A] text-gray-400 hover:text-white border border-[#1E1E2E]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
              <p className="text-gray-400 text-xs capitalize mb-1">{status}</p>
              <p className="text-2xl font-bold text-white">
                {leads.filter(l => l.status === status).length}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-[#1E1E2E] flex items-center justify-between">
            <p className="text-white font-medium">{filtered.length} leads</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leads found</div>
          ) : (
            <div className="divide-y divide-[#1E1E2E]">
              <AnimatePresence>
                {filtered.map((lead, i) => {
                  const config = STATUS_CONFIG[lead.status];
                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4 hover:bg-[#0A0A0F]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {lead.phone_number.slice(-2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{lead.phone_number}</p>
                            <p className="text-gray-500 text-xs">{formatTime(lead.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {lead.budget && (
                            <div className="hidden md:block">
                              <p className="text-xs text-gray-500">Budget</p>
                              <p className="text-sm text-white">{lead.budget}</p>
                            </div>
                          )}
                          {lead.timeline && (
                            <div className="hidden md:block">
                              <p className="text-xs text-gray-500">Timeline</p>
                              <p className="text-sm text-white">{lead.timeline}</p>
                            </div>
                          )}
                          {lead.area && (
                            <div className="hidden md:block">
                              <p className="text-xs text-gray-500">Area</p>
                              <p className="text-sm text-white">{lead.area}</p>
                            </div>
                          )}
                          <span className={`text-xs px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
