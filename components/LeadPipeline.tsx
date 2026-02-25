'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '@/types/database';

interface LeadPipelineProps {
  leads: Lead[];
}

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  engaged: { label: 'Engaged', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  qualified: { label: 'Qualified', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  appointed: { label: 'Appointed', color: 'text-green-400', bg: 'bg-green-500/20' },
};

const statusOrder: LeadStatus[] = ['new', 'engaged', 'qualified', 'appointed'];

export default function LeadPipeline({ leads }: LeadPipelineProps) {
  const [celebratingLead, setCelebratingLead] = useState<string | null>(null);

  // Watch for newly appointed leads and trigger celebration
  useEffect(() => {
    const appointedLeads = leads.filter(l => l.status === 'appointed');
    appointedLeads.forEach(lead => {
      // Only celebrate if it's a recent appointment (within last 30 seconds)
      const createdAt = new Date(lead.created_at).getTime();
      const now = Date.now();
      if (now - createdAt < 30000 && lead.id !== celebratingLead) {
        setCelebratingLead(lead.id);
        setTimeout(() => setCelebratingLead(null), 3000);
      }
    });
  }, [leads]);

  function formatTimeSince(dateString: string): string {
    const dateMs = Date.parse(dateString);
    const nowMs = Date.now();
    const diffMs = nowMs - dateMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">Lead Pipeline</h3>

      <div className="flex-1 overflow-y-auto space-y-6">
        {statusOrder.map((status, statusIndex) => {
          const statusLeads = leads.filter(l => l.status === status);
          const config = statusConfig[status];

          return (
            <div key={status} className="relative">
              {/* Status header */}
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[#0A0A0F]/95 backdrop-blur py-2 z-10">
                <div className={`w-3 h-3 rounded-full ${config.bg} ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-gray-500 bg-[#12121A] px-2 py-0.5 rounded-full">
                  {statusLeads.length}
                </span>
              </div>

              {/* Lead cards */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {statusLeads.map((lead, leadIndex) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.3,
                        delay: statusIndex * 0.1 + leadIndex * 0.05,
                        layout: { duration: 0.2 }
                      }}
                      className="relative"
                    >
                      {/* Celebration particles for appointed leads */}
                      {celebratingLead === lead.id && (
                        <CelebrationParticles />
                      )}

                      <div
                        className={`p-3 rounded-xl bg-[#12121A] border border-[#1E1E2E] hover:border-[#6366F1]/30 transition-all ${
                          status === 'appointed' ? 'border-green-500/30 bg-green-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-white text-sm">{lead.phone_number}</p>
                            {lead.name && (
                              <p className="text-xs text-gray-400">{lead.name}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>

                        {/* Lead details */}
                        {(lead.budget || lead.timeline || lead.area) && (
                          <div className="mt-2 pt-2 border-t border-[#1E1E2E] space-y-1">
                            {lead.budget && (
                              <p className="text-xs text-gray-400">
                                <span className="text-gray-500">Budget:</span> {lead.budget}
                              </p>
                            )}
                            {lead.timeline && (
                              <p className="text-xs text-gray-400">
                                <span className="text-gray-500">Timeline:</span> {lead.timeline}
                              </p>
                            )}
                            {lead.area && (
                              <p className="text-xs text-gray-400">
                                <span className="text-gray-500">Area:</span> {lead.area}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeSince(lead.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {statusLeads.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-600 italic py-2"
                  >
                    No leads in this stage
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CelebrationParticles() {
  const particles = Array.from({ length: 8 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${50 + Math.cos((i / 8) * Math.PI * 2) * 60}%`,
            y: `${50 + Math.sin((i / 8) * Math.PI * 2) * 60}%`,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-full bg-green-400"
          style={{
            boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)',
          }}
        />
      ))}
    </div>
  );
}
