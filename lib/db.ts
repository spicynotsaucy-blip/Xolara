import { supabase } from '@/lib/supabase';
import { Lead, Conversation, LeadStatus } from '@/types/database';

/**
 * Get or create a lead by phone number
 */
export async function getOrCreateLead(phoneNumber: string): Promise<Lead> {
  // Try to get existing lead
  const { data: existingLead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('phone_number', phoneNumber)
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
 * Get conversation history for a lead
 */
export async function getConversationHistory(phoneNumber: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('lead_phone', phoneNumber)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error fetching conversations: ${error.message}`);
  }

  return (data || []) as Conversation[];
}

/**
 * Save a message to the conversation history
 */
export async function saveMessage(
  phoneNumber: string,
  role: 'lead' | 'ai',
  message: string
): Promise<void> {
  const { error } = await supabase.from('conversations').insert({
    lead_phone: phoneNumber,
    role,
    message,
  });

  if (error) {
    throw new Error(`Error saving message: ${error.message}`);
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  phoneNumber: string,
  status: LeadStatus,
  updates?: Partial<Omit<Lead, 'id' | 'phone_number' | 'created_at'>>
): Promise<void> {
  const updateData: Partial<Lead> = { status, ...updates };

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('phone_number', phoneNumber);

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
 * Get all leads with their status counts
 */
export async function getAllLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching leads: ${error.message}`);
  }

  return (data || []) as Lead[];
}

/**
 * Get all conversations grouped by lead
 */
export async function getAllConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error fetching all conversations: ${error.message}`);
  }

  return (data || []) as Conversation[];
}
