import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { numbers, adminKey } = await request.json();

    // Validate admin key
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({ error: 'Invalid numbers array' }, { status: 400 });
    }

    // Validate phone number format (basic validation)
    const validNumbers = numbers.filter((num: string) => {
      return typeof num === 'string' && num.startsWith('+') && num.length >= 10;
    });

    if (validNumbers.length === 0) {
      return NextResponse.json({ error: 'No valid phone numbers provided' }, { status: 400 });
    }

    // Insert numbers into phone_numbers table
    const { data, error } = await supabaseServer
      .from('phone_numbers')
      .insert(
        validNumbers.map((number: string) => ({
          number,
        }))
      )
      .select();

    if (error) {
      console.error('Error inserting phone numbers:', error);
      return NextResponse.json({ error: 'Failed to add numbers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added: data?.length || 0,
      numbers: validNumbers,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
