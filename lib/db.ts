import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { Lead, Conversation, LeadStatus } from '@/types/database';

/**
 * Get or create a lead by phone number for a specific agent
 */
export async function getOrCreateLead(phoneNumber: string, agentId: string): Promise<Lead> {     
  // Try to get existing lead for this agent
  const { data: existingLead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('agent_id', agentId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Error fetching lead: ${fetchError.message}`);
  }

  if (existingLead) {
    return existingLead as Lead;
  }

  // Create new lead if not found
  const { data: newLead, error: insertError } = await supabase
    .from('leads')
    .insert({
      phone_number: phoneNumber,
      agent_id: agentId,
      status: 'new',
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error creating lead: ${insertError.message}`);
  }

  return newLead as Lead;
}

/**
 * Get conversation history for a lead for a specific agent
 */
export async function getConversationHistory(phoneNumber: string, agentId: string): Promise<Conversation[]> {                                                                      
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('lead_phone', phoneNumber)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error fetching conversations: ${error.message}`);
  }

  return (data || []) as Conversation[];
}

/**
 * Save a message to the conversation history for a specific agent
 */
export async function saveMessage(
  phoneNumber: string,
  agentId: string,
  role: 'lead' | 'ai',
  message: string
): Promise<void> {
  const { error } = await supabase.from('conversations').insert({
    lead_phone: phoneNumber,
    agent_id: agentId,
    role,
    message,
  });

  if (error) {
    throw new Error(`Error saving message: ${error.message}`);
  }
}

/**
 * Update lead status for a specific agent
 */
export async function updateLeadStatus(
  phoneNumber: string,
  agentId: string,
  status: LeadStatus,
  updates?: Partial<Omit<Lead, 'id' | 'phone_number' | 'created_at' | 'agent_id'>>
): Promise<void> {
  const updateData: Partial<Lead> = { status, ...updates };

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('phone_number', phoneNumber)
    .eq('agent_id', agentId);

  if (error) {
    throw new Error(`Error updating lead status: ${error.message}`);
  }
}

/**
 * Check if AI response contains appointment booked tag
 */
export function hasAppointmentBooked(aiResponse: string): boolean {
  return aiResponse.includes('[APPOINTMENT_BOOKED]');
}

/**
 * Get all leads for a specific agent
 */
export async function getAllLeads(agentId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching leads: ${error.message}`);
  }

  return (data || []) as Lead[];
}

/**
 * Get all conversations for a specific agent
 */
export async function getAllConversations(agentId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error fetching all conversations: ${error.message}`);      
  }

  return (data || []) as Conversation[];
}

/**
 * Assign an available phone number to a new agent
 * Picks the first unassigned number from the pool
 */
export async function assignPhoneNumber(agentId: string): Promise<string | null> {
  // Find first available number (no agent assigned)
  const { data: available, error: findError } = await supabaseServer
    .from('phone_numbers')
    .select('*')
    .is('agent_id', null)
    .limit(1)
    .single();

  if (findError || !available) {
    console.error('No available phone numbers in pool');
    return null;
  }

  // Assign it to this agent
  const { error: assignError } = await supabaseServer
    .from('phone_numbers')
    .update({ 
      agent_id: agentId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', available.id);

  if (assignError) {
    throw new Error(`Error assigning phone number: ${assignError.message}`);
  }

  // Update agent's assigned_number field
  await supabaseServer
    .from('agents')
    .update({ assigned_number: available.number })
    .eq('id', agentId);

  return available.number;
}
