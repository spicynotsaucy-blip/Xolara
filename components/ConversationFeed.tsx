'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Conversation } from '@/types/database';

interface GroupedConversations {
  [phoneNumber: string]: Conversation[];
}

export default function ConversationFeed() {
  const [conversations, setConversations] = useState<GroupedConversations>({});
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial conversations
    fetchConversations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const newMessage = payload.new as Conversation;
          setConversations((prev) => {
            const phone = newMessage.lead_phone;
            const existing = prev[phone] || [];
            return {
              ...prev,
              [phone]: [...existing, newMessage],
            };
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  async function fetchConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Group by phone number
    const grouped = (data || []).reduce((acc: GroupedConversations, conv: Conversation) => {
      const phone = conv.lead_phone;
      if (!acc[phone]) {
        acc[phone] = [];
      }
      acc[phone].push(conv);
      return acc;
    }, {});

    setConversations(grouped);

    // Select first phone number by default
    if (Object.keys(grouped).length > 0 && !selectedPhone) {
      setSelectedPhone(Object.keys(grouped)[0]);
    }
  }

  const phoneNumbers = Object.keys(conversations).sort((a, b) => {
    const aLast = conversations[a][conversations[a].length - 1]?.created_at || '';
    const bLast = conversations[b][conversations[b].length - 1]?.created_at || '';
    return new Date(bLast).getTime() - new Date(aLast).getTime();
  });

  const activeConversations = selectedPhone ? conversations[selectedPhone] || [] : [];

  return (
    <div className="flex h-full gap-4">
      {/* Phone list sidebar */}
      <div className="w-48 flex-shrink-0 overflow-y-auto">
        <AnimatePresence>
          {phoneNumbers.map((phone, index) => {
            const lastMessage = conversations[phone][conversations[phone].length - 1];
            const isActive = selectedPhone === phone;

            return (
              <motion.button
                key={phone}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedPhone(phone)}
                className={`w-full text-left p-3 rounded-xl mb-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/30'
                    : 'hover:bg-[#12121A]'
                }`}
              >
                <p className="text-sm font-medium text-white truncate">{phone}</p>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {lastMessage?.message.slice(0, 30)}...
                </p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E1E2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">
              {selectedPhone || 'Select a conversation'}
            </h3>
            {selectedPhone && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </div>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full animate-pulse">
            LIVE
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {activeConversations.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.02,
                  ease: 'easeOut'
                }}
                className={`flex ${
                  message.role === 'lead' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    message.role === 'lead'
                      ? 'bg-[#12121A] text-white rounded-tl-none'
                      : 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-tr-none'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {new Date(message.created_at).toLocaleTimeString('en-US', {
                      timeZone: 'America/New_York',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
