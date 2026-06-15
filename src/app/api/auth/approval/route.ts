import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create a server-side client that doesn't persist sessions to avoid hangs
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

// GET: Check approval status of a user
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email')?.toLowerCase().trim();

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // Admins are always approved
        if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email)) {
            return NextResponse.json({ approved: true, status: 'approved' });
        }

        // Query waitlist in Supabase
        const { data: userStatus, error } = await supabase
            .from('waitlist')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('Supabase query error in GET approval:', error);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        if (!userStatus) {
            return NextResponse.json({ approved: false, status: 'none' });
        }

        return NextResponse.json({
            approved: userStatus.status === 'approved',
            status: userStatus.status,
            name: userStatus.name,
            createdAt: userStatus.created_at
        });
    } catch (error) {
        console.error('Error in GET /api/auth/approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Add a new user with 'pending' status (Waitlist or first Login/Signup)
export async function POST(req: Request) {
    try {
        const { email, name, phone, investorType, profession, experienceLevel, reason } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Missing email field' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanName = name?.trim() || cleanEmail.split('@')[0];

        // Query to check if user already exists
        const { data: existingUser, error: queryError } = await supabase
            .from('waitlist')
            .select('status')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (queryError) {
            console.error('Supabase query error in POST approval:', queryError);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        // If user already exists, don't overwrite approved status to pending
        if (existingUser) {
            return NextResponse.json({ 
                success: true, 
                message: 'User already exists', 
                status: existingUser.status 
            });
        }

        // If it's an admin, automatically mark as approved
        const isDefaultAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail);
        const status = isDefaultAdmin ? 'approved' : 'pending';

        // Insert new waitlist user in Supabase
        const { error: insertError } = await supabase
            .from('waitlist')
            .insert({
                email: cleanEmail,
                name: cleanName,
                status: status,
                phone: phone || '',
                investor_type: investorType || '',
                profession: profession || '',
                experience_level: experienceLevel || '',
                reason: reason || ''
            });

        if (insertError) {
            console.error('Supabase insert error in POST approval:', insertError);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: isDefaultAdmin ? 'Admin auto-approved' : 'User added to approval queue',
            status: status
        });
    } catch (error) {
        console.error('Error in POST /api/auth/approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

