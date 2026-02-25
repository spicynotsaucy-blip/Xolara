export interface Lead {
  id: string;
  phone_number: string;
  name: string | null;
  status: 'new' | 'engaged' | 'qualified' | 'appointed';
  budget: string | null;
  timeline: string | null;
  area: string | null;
  agent_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  lead_phone: string;
  role: 'lead' | 'ai';
  message: string;
  agent_id: string;
  created_at: string;
}

export interface Agent {
  id: string;
  email: string;
  full_name: string | null;
  assigned_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneNumber {
  id: string;
  number: string;
  agent_id: string | null;
  assigned_at: string | null;
  created_at: string;
}

export type LeadStatus = 'new' | 'engaged' | 'qualified' | 'appointed';
