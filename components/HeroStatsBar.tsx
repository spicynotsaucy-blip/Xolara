'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Lead } from '@/types/database';

interface HeroStatsBarProps {
  leads: Lead[];
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

function AnimatedCounter({ value, duration = 2 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const spring = useSpring(0, { 
    duration: duration * 1000,
    bounce: 0
  });
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  
  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return <span>{displayValue}</span>;
}

export default function HeroStatsBar({ leads }: HeroStatsBarProps) {
  const totalLeads = leads.length;
  const activeConversations = leads.filter(l => l.status === 'engaged').length;
  const appointmentsBooked = leads.filter(l => l.status === 'appointed').length;

  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: UsersIcon,
      gradient: 'from-[#6366F1] to-[#818CF8]',
    },
    {
      label: 'Active Conversations',
      value: activeConversations,
      icon: ChatIcon,
      gradient: 'from-[#8B5CF6] to-[#A78BFA]',
    },
    {
      label: 'Appointments Booked',
      value: appointmentsBooked,
      icon: CalendarIcon,
      gradient: 'from-[#10B981] to-[#34D399]',
    },
    {
      label: 'Response Rate',
      value: '< 60s',
      icon: LightningIcon,
      gradient: 'from-[#F59E0B] to-[#FBBF24]',
      isText: true,
      showPulse: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: index * 0.1,
            ease: 'easeOut'
          }}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
          className="relative group"
        >
          {/* Glow effect on hover */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-30 transition duration-500 blur`} />
          
          <div className="relative glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <div className="flex items-center gap-2">
                  {stat.isText ? (
                    <span className="text-3xl font-bold text-white flex items-center gap-2">
                      {stat.value}
                      {stat.showPulse && (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      <AnimatedCounter value={stat.value as number} />
                    </span>
                  )}
                </div>
              </div>
              
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
