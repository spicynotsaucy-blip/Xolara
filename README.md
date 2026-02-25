# Xolara - AI Inside Sales Agent for Real Estate

Xolara is an AI-powered Inside Sales Agent (ISA) platform for real estate agents. The core feature is an automated SMS conversation engine that instantly engages leads 24/7, qualifies them, and books appointments.

## Features

- **AI SMS Engine**: Powered by Groq's llama-3.3-70b-versatile model
- **Real-time Dashboard**: Live conversation feed and lead pipeline
- **Twilio Integration**: Send and receive SMS messages
- **Supabase Backend**: Real-time database with live subscriptions
- **Beautiful UI**: Dark theme with glass-morphism design and Framer Motion animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **SMS**: Twilio
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Styling**: Tailwind CSS + Framer Motion

## Prerequisites

- Node.js 18+ 
- A Twilio account with a phone number
- A Supabase account
- A Groq API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Fill in the following values:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Groq API Key
GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set Up Supabase Tables

In your Supabase project, run the following SQL in the SQL Editor:

```sql
-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'engaged', 'qualified', 'appointed')),
  budget TEXT,
  timeline TEXT,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_phone TEXT REFERENCES leads(phone_number) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('lead', 'ai')) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_leads_phone ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_conversations_lead_phone ON conversations(lead_phone);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

### 4. Configure Twilio Webhook

1. In your Twilio Console, go to Phone Numbers → Manage → Active Numbers
2. Click on your phone number
3. Under "Messaging", set the webhook URL for "A message comes in":
   ```
   https://your-domain.com/api/sms/incoming
   ```
   For local development, use ngrok to expose your localhost:
   ```bash
   npx ngrok http 3000
   ```
   Then use the ngrok URL + `/api/sms/incoming`

4. Set HTTP Method to POST

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to access the dashboard.

## Project Structure

```
xolara/
├── app/
│   ├── api/sms/incoming/     # Twilio webhook handler
│   ├── dashboard/            # Dashboard page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── HeroStatsBar.tsx      # Stats counter cards
│   ├── ConversationFeed.tsx  # Real-time chat feed
│   └── LeadPipeline.tsx      # Kanban pipeline view
├── lib/
│   ├── supabase.ts           # Supabase client config
│   └── db.ts                 # Database helper functions
├── types/
│   └── database.ts           # TypeScript types
├── .env.local.example        # Environment variables template
└── package.json
```

## How It Works

1. **Lead sends SMS** to your Twilio number
2. **Twilio webhook** sends the message to `/api/sms/incoming`
3. **API route** fetches conversation history from Supabase
4. **Groq AI** generates a response based on the conversation history and system prompt
5. **Response is sent** back to the lead via Twilio SMS
6. **Dashboard updates** in real-time via Supabase subscriptions
7. When `[APPOINTMENT_BOOKED]` is detected in AI response, the lead status is automatically updated to 'appointed'

## AI System Prompt

The AI (named Alex) follows this exact sequence:
1. Greet and ask what brought them to reach out
2. Ask about timeline (30 days, 3 months, or exploring)
3. Ask about budget/price range
4. Ask about area/neighborhood interest
5. Transition to booking a 15-minute call
6. Confirm appointment with `[APPOINTMENT_BOOKED]` tag

## Testing

To test the SMS flow locally:
1. Start ngrok: `npx ngrok http 3000`
2. Update Twilio webhook URL with your ngrok URL
3. Send a text message to your Twilio number
4. Watch the conversation appear in the dashboard in real-time

## Production Deployment

For production deployment:
1. Deploy to Vercel, Netlify, or your preferred platform
2. Update Twilio webhook URL to your production domain
3. Ensure all environment variables are set in your hosting platform
4. The Supabase real-time subscriptions will work automatically

## License

MIT License
