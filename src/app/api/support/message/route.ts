import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch all support messages from Supabase
export async function GET() {
    try {
        const { data: messages, error } = await supabase
            .from('support_messages')
            .select('*');

        if (error) {
            console.error('Supabase query error in GET support messages:', error);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        // Map snake_case to camelCase and sort by most recent
        const formattedMessages = (messages || []).map((msg) => ({
            id: msg.id,
            email: msg.email,
            subject: msg.subject,
            message: msg.message,
            createdAt: msg.created_at,
            status: msg.status
        }));

        formattedMessages.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error('Error reading support messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST: Save a new support message in Supabase
export async function POST(req: Request) {
    try {
        const { email, subject, message } = await req.json();
        
        if (!email || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        const { error } = await supabase
            .from('support_messages')
            .insert({
                id,
                email,
                subject,
                message,
                status: 'unread'
            });

        if (error) {
            console.error('Supabase insert error in POST support messages:', error);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Message saved' });
    } catch (error) {
        console.error('Error saving support message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

// DELETE: Delete a support message from Supabase
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
        }

        const { error } = await supabase
            .from('support_messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error in DELETE support messages:', error);
            return NextResponse.json({ error: 'Database delete failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting support message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}

