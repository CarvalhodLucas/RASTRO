import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all users from waitlist table
export async function GET() {
    try {
        const { data: users, error } = await supabase
            .from('waitlist')
            .select('*');

        if (error) {
            console.error('Supabase query error in GET admin users:', error);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        // Format snake_case to camelCase for the frontend
        const usersList = (users || []).map((info) => ({
            email: info.email,
            name: info.name,
            status: info.status,
            createdAt: info.created_at,
            phone: info.phone || '',
            investorType: info.investor_type || '',
            profession: info.profession || '',
            experienceLevel: info.experience_level || '',
            reason: info.reason || ''
        }));

        // Sort by most recent
        usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(usersList);
    } catch (error) {
        console.error('Error in GET /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Approve a pending user
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Missing email field' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Update status in Supabase and select the updated row
        const { data: updatedUser, error: updateError } = await supabase
            .from('waitlist')
            .update({ status: 'approved' })
            .eq('email', cleanEmail)
            .select()
            .maybeSingle();

        if (updateError) {
            console.error('Supabase update error in POST admin users:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Trigger n8n webhook if configured
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WAITLIST_WEBHOOK || process.env.N8N_WAITLIST_WEBHOOK;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: updatedUser.name,
                        email: cleanEmail,
                        status: 'approved',
                        phone: updatedUser.phone || ''
                    })
                });
            } catch (err) {
                console.error('Error initiating webhook fetch:', err);
            }
        }

        return NextResponse.json({ success: true, message: 'User approved successfully' });
    } catch (error) {
        console.error('Error in POST /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a user (Reject waitlist/registration or revoke access)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email')?.toLowerCase().trim();

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // Delete row in Supabase
        const { data: deletedUser, error: deleteError } = await supabase
            .from('waitlist')
            .delete()
            .eq('email', email)
            .select()
            .maybeSingle();

        if (deleteError) {
            console.error('Supabase delete error in DELETE admin users:', deleteError);
            return NextResponse.json({ error: 'Database delete failed' }, { status: 500 });
        }

        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User removed successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

