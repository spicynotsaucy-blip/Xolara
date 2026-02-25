import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';
import Groq from 'groq-sdk';
import { getOrCreateLead, getConversationHistory, saveMessage, updateLeadStatus, hasAppointmentBooked } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

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

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, body: string) {
  await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
}

/**
 * Generate TwiML response for Twilio
 */
function generateTwiMLResponse(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Handle incoming SMS webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    if (!from || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: From and Body' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const phoneNumber = from.trim();
    const messageBody = body.trim();

    // Get or create the lead
    const lead = await getOrCreateLead(phoneNumber);

    // Get conversation history
    const conversationHistory = await getConversationHistory(phoneNumber);

    // Save the incoming lead message
    await saveMessage(phoneNumber, 'lead', messageBody);

    // Add the new message to history for context
    const fullHistory = [
      ...conversationHistory,
      { role: 'lead', message: messageBody },
    ];

    // Get AI response from Groq
    const aiResponse = await getAIResponse(fullHistory);

    // Save the AI response
    await saveMessage(phoneNumber, 'ai', aiResponse);

    // Check if appointment was booked and update status
    if (hasAppointmentBooked(aiResponse)) {
      await updateLeadStatus(phoneNumber, 'appointed');
    } else if (lead.status === 'new') {
      // Update to engaged if this is the first interaction
      await updateLeadStatus(phoneNumber, 'engaged');
    }

    // Send the AI response back via Twilio SMS
    await sendSMS(phoneNumber, aiResponse);

    // Return TwiML response
    const twiml = generateTwiMLResponse(aiResponse);

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in SMS webhook:', error);
    
    // Return error TwiML
    const errorTwiml = generateTwiMLResponse('I apologize, I had trouble processing your message. Please try again.');
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
      status: 200, // Return 200 so Twilio doesn't retry
    });
  }
}
