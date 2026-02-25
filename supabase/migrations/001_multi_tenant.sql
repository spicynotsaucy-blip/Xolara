-- Create agents table linked to Supabase auth
CREATE TABLE agents (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  telnyx_number TEXT UNIQUE,
  telnyx_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add agent_id to leads table
ALTER TABLE leads ADD COLUMN agent_id UUID REFERENCES agents(id);

-- Add agent_id to conversations table  
ALTER TABLE conversations ADD COLUMN agent_id UUID REFERENCES agents(id);

-- Create indexes
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own profile
CREATE POLICY "agents_own_profile" ON agents
  FOR ALL USING (auth.uid() = id);

-- Agents can only see their own leads
CREATE POLICY "agents_own_leads" ON leads
  FOR ALL USING (auth.uid() = agent_id);

-- Agents can only see their own conversations
CREATE POLICY "agents_own_conversations" ON conversations
  FOR ALL USING (auth.uid() = agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
