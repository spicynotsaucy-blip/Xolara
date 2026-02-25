'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { getAllLeads, getConversationHistory } from '@/lib/db';
import { getCurrentAgent } from '@/lib/auth';
import { Lead, Conversation } from '@/types/database';
import { supabase } from '@/lib/supabase';

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);
  const selectedLeadRef = useRef<Lead | null>(null);
  const router = useRouter();

  const handleSelectLead = (lead: Lead) => {
    selectedLeadRef.current = lead;
    setSelectedLead(lead);
  };

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
      if (data.length > 0) handleSelectLead(data[0]);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!agent) return;

    const channel = supabase
      .channel(`conversations-${agent.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `agent_id=eq.${agent.id}`,
      }, () => {
        if (selectedLeadRef.current) {
          getConversationHistory(selectedLeadRef.current.phone_number, agent.id).then(setConversations);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agent]);

  useEffect(() => {
    if (selectedLead && agent) {
      getConversationHistory(selectedLead.phone_number, agent.id).then(setConversations);
    }
  }, [selectedLead, agent]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 flex flex-col" style={{ height: '100vh' }}>
        {/* Header */}
        <div className="p-6 border-b border-[#1E1E2E]">
          <h1 className="text-3xl font-bold text-white mb-1">Conversations</h1>
          <p className="text-gray-400">Full conversation history with every lead</p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Lead List */}
          <div className="w-80 border-r border-[#1E1E2E] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-500 text-sm">Loading...</div>
            ) : leads.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No conversations yet</div>
            ) : (
              leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  whileHover={{ backgroundColor: 'rgba(99,102,241,0.05)' }}
                  onClick={() => handleSelectLead(lead)}
                  className={`p-4 cursor-pointer border-b border-[#1E1E2E] transition-all ${
                    selectedLead?.id === lead.id ? 'bg-[#6366F1]/10 border-l-2 border-l-[#6366F1]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{lead.phone_number.slice(-2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{lead.phone_number}</p>
                      <p className={`text-xs capitalize mt-0.5 ${
                        lead.status === 'appointed' ? 'text-green-400' :
                        lead.status === 'qualified' ? 'text-yellow-400' :
                        lead.status === 'engaged' ? 'text-blue-400' : 'text-gray-500'
                      }`}>{lead.status}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedLead ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a lead to view conversation
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-[#1E1E2E] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{selectedLead.phone_number.slice(-2)}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedLead.phone_number}</p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      {selectedLead.budget && <span>Budget: {selectedLead.budget}</span>}
                      {selectedLead.timeline && <span>Timeline: {selectedLead.timeline}</span>}
                      {selectedLead.area && <span>Area: {selectedLead.area}</span>}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400">LIVE</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {conversations.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`flex ${msg.role === 'ai' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm ${
                            msg.role === 'ai'
                              ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-br-sm'
                              : 'bg-[#12121A] border border-[#1E1E2E] text-gray-200 rounded-bl-sm'
                          }`}>
                            {msg.message.replace('[APPOINTMENT_BOOKED]', '').trim()}
                            {msg.message.includes('[APPOINTMENT_BOOKED]') && (
                              <span className="ml-2 text-green-300 text-xs">✓ Appointment Booked</span>
                            )}
                          </div>
                          <p className={`text-xs text-gray-600 mt-1 ${msg.role === 'ai' ? 'text-right' : ''}`}>
                            {msg.role === 'ai' ? 'Alex' : 'Lead'} · {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {conversations.length === 0 && (
                    <div className="text-center text-gray-600 text-sm py-8">
                      No messages yet
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
