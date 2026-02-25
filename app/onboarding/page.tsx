'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentAgent } from '@/lib/auth';

// Generate deterministic positions for celebration particles
const particles = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  left: ((i * 37) % 100),
  top: ((i * 73) % 100),
  duration: 2 + ((i * 13) % 4),
  delay: ((i * 17) % 3),
  size: 4 + (i % 8),
}));

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [agent, setAgent] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentAgent().then(setAgent);
  }, []);

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Progress Bar */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNumber
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: stepNumber * 0.1 }}
                >
                  {stepNumber}
                </motion.div>
                {stepNumber < 3 && (
                  <motion.div
                    className={`flex-1 h-1 mx-4 ${
                      step > stepNumber ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]' : 'bg-gray-700'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: stepNumber * 0.1 + 0.2 }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-gray-400 text-sm">
            {step === 1 && 'Welcome'}
            {step === 2 && 'Your Number'}
            {step === 3 && 'Complete'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md w-full"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {agent.full_name?.charAt(0) || agent.email.charAt(0)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome, {agent.full_name || agent.email}!
                  </h2>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 mb-8 leading-relaxed"
                >
                  Xolara is your AI-powered Inside Sales Agent that automatically engages leads,
                  qualifies them, and books appointments. When leads text your dedicated number,
                  Alex responds instantly with personalized conversations.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Let's Get Started
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md w-full"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Your Dedicated Number
                  </h2>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  {agent.assigned_number ? (
                    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-4">
                      <div className="text-3xl font-mono font-bold text-white mb-2">
                        {agent.assigned_number}
                      </div>
                      <button
                        onClick={() => copyToClipboard(agent.assigned_number)}
                        className="text-sm text-[#6366F1] hover:text-[#8B5CF6] transition-colors"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-4 flex items-center justify-center">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400">Assigning number...</span>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-300 text-sm leading-relaxed">
                    This is your Xolara number. Share it with leads, add it to your website,
                    or put it in your email signature. When anyone texts this number,
                    Alex responds instantly with personalized conversations.
                  </p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  disabled={!agent.assigned_number}
                  className="w-full py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {agent.assigned_number ? 'Continue' : 'Waiting for number...'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md w-full relative"
            >
              {/* Celebration Particles */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute bg-green-400 rounded-full"
                    style={{
                      left: `${particle.left}%`,
                      top: `${particle.top}%`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                    }}
                    animate={{
                      y: [0, -200, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    You're Ready!
                  </h2>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 mb-8 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-gray-300 text-sm">Account created and verified</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-gray-300 text-sm">Dedicated number assigned: {agent.assigned_number}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-gray-300 text-sm">AI agent ready to engage leads</p>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToDashboard}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
