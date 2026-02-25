-- Remove telnyx_api_key from agents (Xolara owns the Telnyx account)
ALTER TABLE agents DROP COLUMN IF EXISTS telnyx_api_key;

-- Rename telnyx_number to assigned_number for clarity
ALTER TABLE agents RENAME COLUMN telnyx_number TO assigned_number;

-- Create phone number pool table
CREATE TABLE phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by number (webhook uses this constantly)
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX idx_phone_numbers_agent_id ON phone_numbers(agent_id);

-- Enable RLS
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own assigned number
CREATE POLICY "agents_own_number" ON phone_numbers
  FOR SELECT USING (auth.uid() = agent_id);
