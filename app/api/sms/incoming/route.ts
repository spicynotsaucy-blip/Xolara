import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {
  getOrCreateLead,
  getConversationHistory,
  saveMessage,
  updateLeadStatus,
  hasAppointmentBooked,
} from '@/lib/db';
import { supabaseServer } from '@/lib/supabaseServer';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// AI System Prompt - Alex the Inside Sales Agent
const SYSTEM_PROMPT = `You are Alex, a warm, professional, and highly skilled real estate Inside Sales Agent working for a top real estate agent. Your ONLY job is to engage new leads over SMS, build rapport quickly, qualify them, and book appointments.

Follow this exact sequence:
1. First, greet them warmly and ask what brought them to reach out today.
2. Second, once they respond, ask about their timeline — are they looking to buy/sell in the next 30 days, 3 months, or just exploring?
3. Third, ask about their budget or home price range.
4. Fourth, ask what area or neighborhood they're interested in.
5. Fifth, once you have timeline, budget, and area — transition to booking: say something like "Based on what you've shared, I'd love to set up a quick 15-minute call with our agent to show you exactly what's available in your budget. Are you free tomorrow morning or afternoon?"
6. Sixth, when they confirm a time, say "Perfect! I've got you booked. You'll receive a confirmation shortly. [APPOINTMENT_BOOKED]" — always include that exact tag when an appointment is confirmed.

Keep messages SHORT (under 2 sentences). Sound human, never robotic. Never mention you are an AI unless directly asked.`;

/**
 * Format conversation history for Groq API
 * Lead messages become "user" role, AI messages become "assistant" role
 */
function formatConversationForGroq(history: Array<{ role: string; message: string }>) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const entry of history) {
    messages.push({
      role: entry.role === 'lead' ? 'user' : 'assistant',
      content: entry.message,
    });
  }

  return messages;
}

/**
 * Get AI response from Groq API
 */
async function getAIResponse(conversationHistory: Array<{ role: string; message: string }>) {
  const messages = formatConversationForGroq(conversationHistory);

  const completion = await groq.chat.completions.create({
    messages: messages as any,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 150,
  });

  return completion.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you repeat?';
}

type Qualification = {
  timeline: string | null;
  budget: string | null;
  area: string | null;
};

function normalizeQualification(q: Qualification): Qualification {
  const normalize = (v: unknown) => {
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (trimmed.toLowerCase() === 'null') return null;
    if (trimmed.toLowerCase() === 'unknown') return null;
    if (trimmed.toLowerCase() === 'n/a') return null;
    return trimmed;
  };

  return {
    timeline: normalize(q.timeline),
    budget: normalize(q.budget),
    area: normalize(q.area),
  };
}

async function extractQualification(conversationHistory: Array<{ role: string; message: string }>): Promise<Qualification> {
  const messages = formatConversationForGroq(conversationHistory);

  messages.push({
    role: 'user',
    content:
      'From the conversation so far, extract the lead\'s qualification info. Return ONLY valid JSON with keys: timeline, budget, area. Use null when unknown. Keep values short and literal. Example: {"timeline":"next 30 days","budget":"$500k","area":"Austin"}.',
  } as any);

  const completion = await groq.chat.completions.create({
    messages: messages as any,
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 120,
  });

  const raw = completion.choices[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(raw);
    return normalizeQualification({
      timeline: parsed?.timeline ?? null,
      budget: parsed?.budget ?? null,
      area: parsed?.area ?? null,
    });
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return normalizeQualification({
        timeline: parsed?.timeline ?? null,
        budget: parsed?.budget ?? null,
        area: parsed?.area ?? null,
      });
    }
    return { timeline: null, budget: null, area: null };
  }
}

/**
 * Send SMS via Telnyx using global credentials
 */
async function sendSMS(to: string, text: string, from?: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error('Missing TELNYX_API_KEY');

  const fromNumber = from || process.env.TELNYX_FROM_NUMBER;
  if (!fromNumber) throw new Error('Missing TELNYX_FROM_NUMBER');

  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromNumber,
      to,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telnyx send failed: ${res.status} ${res.statusText} ${body}`);
  }
}

type InboundSms = {
  from: string;
  to?: string;
  body: string;
  provider: 'telnyx' | 'twilio';
};

async function parseInboundSms(request: NextRequest): Promise<InboundSms> {
  const contentType = request.headers.get('content-type') || '';

  const isJson = contentType.includes('application/json');
  const isFormUrlEncoded = contentType.includes('application/x-www-form-urlencoded');
  const isMultipart = contentType.includes('multipart/form-data');

  // Twilio sends x-www-form-urlencoded (or sometimes multipart/form-data)
  if (isFormUrlEncoded || isMultipart) {
    const formData = await request.formData();
    const from = (formData.get('From') as string | null)?.trim();
    const body = (formData.get('Body') as string | null)?.trim();
    const to = (formData.get('To') as string | null)?.trim() || undefined;

    if (!from || !body) {
      throw new Error('Invalid Twilio payload: missing From/Body');
    }

    return { from, to, body, provider: 'twilio' };
  }

  // Telnyx inbound message webhook is JSON. Some providers may omit content-type,
  // so attempt JSON parse for any non-form content-type.
  const text = isJson ? undefined : await request.text();
  const json: any = isJson ? await request.json() : (() => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  })();

  const payload = json?.data?.payload;
  const from = payload?.from?.phone_number as string | undefined;
  const to = (payload?.to?.[0]?.phone_number as string | undefined) || (payload?.to?.phone_number as string | undefined);
  const body = payload?.text as string | undefined;

  if (!from || !body) {
    throw new Error('Unsupported inbound webhook: expected Telnyx JSON or Twilio form payload');
  }

  return { from, to, body, provider: 'telnyx' };
}

/**
 * Handle incoming SMS webhook with multi-tenant support
 */
export async function POST(request: NextRequest) {
  try {
    const inbound = await parseInboundSms(request);

    // Normalize phone number
    const phoneNumber = inbound.from.trim();
    const messageBody = inbound.body.trim();
    const toNumber = inbound.to?.trim();

    if (!toNumber) {
      console.error('No "to" number found in webhook payload');
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // Look up agent by the 'to' number using phone_numbers pool table
    const { data: phoneRecord } = await supabaseServer
      .from('phone_numbers')
      .select('agent_id')
      .eq('number', toNumber)
      .single();

    if (!phoneRecord?.agent_id) {
      console.warn(`No agent found for phone number: ${toNumber}`);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // Get the agent details
    const { data: agent } = await supabaseServer
      .from('agents')
      .select('*')
      .eq('id', phoneRecord.agent_id)
      .single();

    if (!agent) {
      console.warn(`Agent not found for ID: ${phoneRecord.agent_id}`);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // Get or create the lead for this specific agent
    const lead = await getOrCreateLead(phoneNumber, agent.id);

    // Get conversation history for this agent's lead
    const conversationHistory = await getConversationHistory(phoneNumber, agent.id);

    // Save the incoming lead message for this agent
    await saveMessage(phoneNumber, agent.id, 'lead', messageBody);

    // Add the new message to history for context
    const fullHistory = [
      ...conversationHistory,
      { role: 'lead', message: messageBody },
    ];

    // Get AI response from Groq
    const aiResponse = await getAIResponse(fullHistory);

    // Save the AI response for this agent
    await saveMessage(phoneNumber, agent.id, 'ai', aiResponse);

    // Send SMS using global Telnyx credentials
    await sendSMS(phoneNumber, aiResponse, inbound.to);

    // Fire qualification extraction in background - don't await it
    extractQualification([...fullHistory, { role: 'ai', message: aiResponse }])
      .then(async (qualification) => {
        const leadUpdates = {
          budget: lead.budget ?? qualification.budget,
          timeline: lead.timeline ?? qualification.timeline,
          area: lead.area ?? qualification.area,
        };
        const hasAllQualification = Boolean(leadUpdates.timeline && leadUpdates.budget && leadUpdates.area);
        const isAppointed = hasAppointmentBooked(aiResponse);
        const nextStatus = isAppointed
          ? 'appointed'
          : hasAllQualification
            ? 'qualified'
            : lead.status === 'new'
              ? 'engaged'
              : lead.status;
        await updateLeadStatus(phoneNumber, agent.id, nextStatus as any, leadUpdates as any);
      })
      .catch(console.error);

    // Telnyx expects a fast 2xx response; no TwiML.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in SMS webhook:', error);

    // Always return 200 to prevent provider retries from spamming.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
