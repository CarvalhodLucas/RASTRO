import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'support_messages.json');

// Ensure data file exists
function ensureDataFile() {
    if (!fs.existsSync(path.dirname(DATA_PATH))) {
        fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    }
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, JSON.stringify([]));
    }
}

export async function GET() {
    try {
        ensureDataFile();
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const messages = JSON.parse(data);
        // Sort by most recent
        const sortedMessages = messages.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return NextResponse.json(sortedMessages);
    } catch (error) {
        console.error('Error reading support messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { email, subject, message } = await req.json();
        
        if (!email || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        ensureDataFile();
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const messages = JSON.parse(data);

        const newMessage = {
            id: Date.now().toString(),
            email,
            subject,
            message,
            createdAt: new Date().toISOString(),
            status: 'unread'
        };

        messages.push(newMessage);
        fs.writeFileSync(DATA_PATH, JSON.stringify(messages, null, 2));

        return NextResponse.json({ success: true, message: 'Message saved' });
    } catch (error) {
        console.error('Error saving support message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
        }

        ensureDataFile();
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        let messages = JSON.parse(data);

        messages = messages.filter((msg: any) => msg.id !== id);
        fs.writeFileSync(DATA_PATH, JSON.stringify(messages, null, 2));

        return NextResponse.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting support message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
