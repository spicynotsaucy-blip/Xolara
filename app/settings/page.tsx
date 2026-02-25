'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { getCurrentAgent, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Agent } from '@/types/database';

export default function SettingsPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [fullName, setFullName] = useState('');
  const [telnyxApiKey, setTelnyxApiKey] = useState('');
  const [telnyxNumber, setTelnyxNumber] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    getCurrentAgent().then((agentData) => {
      if (agentData) {
        setAgent(agentData);
        setFullName(agentData.full_name || '');
        setTelnyxApiKey(agentData.telnyx_api_key || '');
        setTelnyxNumber(agentData.telnyx_number || '');
      }
    });
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateProfile = async () => {
    if (!agent) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({ full_name: fullName })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, full_name: fullName });
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTelnyx = async () => {
    if (!agent) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          telnyx_api_key: telnyxApiKey,
          telnyx_number: telnyxNumber,
        })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, telnyx_api_key: telnyxApiKey, telnyx_number: telnyxNumber });
      showToast('Telnyx configuration updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update Telnyx configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8">
        {/* Toast Notification */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                messageType === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </motion.div>

        <div className="space-y-8">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-white focus:outline-none focus:border-[#6366F1]/50 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={agent.email}
                  disabled
                  className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-gray-500 cursor-not-allowed"
                  placeholder="Email (read-only)"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <motion.button
                onClick={updateProfile}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                Save Profile
              </motion.button>
            </div>
          </motion.div>

          {/* Your Xolara Number Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Your Xolara Number</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dedicated Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={agent.assigned_number || 'Number being assigned...'}
                    readOnly
                    className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-white font-mono text-lg focus:outline-none cursor-not-allowed"
                  />
                  {agent.assigned_number && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(agent.assigned_number!);
                        showToast('Number copied to clipboard', 'success');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6366F1] hover:text-[#8B5CF6] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Need a different number? Contact support.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-gray-300 mb-4">Sign out of your account</p>
            
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
            >
              Sign Out
            </motion.button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
