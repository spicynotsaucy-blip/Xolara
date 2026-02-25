import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { Agent } from '@/types/database';
import { assignPhoneNumber } from '@/lib/db';
import { redirect } from 'next/navigation';

/**
 * Get the currently authenticated agent with full profile
 */
export async function getCurrentAgent(): Promise<Agent | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return agent;
}

/**
 * Server-side helper that redirects to login if not authenticated
 */
export async function requireAuth(): Promise<Agent> {
  const agent = await getCurrentAgent();
  if (!agent) {
    redirect('/login');
  }
  return agent;
}

/**
 * Sign up a new agent - creates auth user and agents record
 */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) throw error;

  if (data.user) {
    // Create agent record
    const { error: agentError } = await supabase
      .from('agents')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
      });

    if (agentError) throw agentError;

    // Auto-assign a phone number from the pool
    await assignPhoneNumber(data.user.id);
  }

  return data;
}

/**
 * Sign in agent and redirect to dashboard
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  return data;
}

/**
 * Sign out and redirect to login
 */
export async function signOut() {
  await supabase.auth.signOut();
  redirect('/login');
}
