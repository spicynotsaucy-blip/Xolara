export interface Lead {
  id: string;
  phone_number: string;
  name: string | null;
  status: 'new' | 'engaged' | 'qualified' | 'appointed';
  budget: string | null;
  timeline: string | null;
  area: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  lead_phone: string;
  role: 'lead' | 'ai';
  message: string;
  created_at: string;
}

export type LeadStatus = 'new' | 'engaged' | 'qualified' | 'appointed';
