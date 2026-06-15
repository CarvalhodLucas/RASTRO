import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'users_status.json');

// Helper to ensure data file exists and is populated
function ensureDataFile() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));
    }
}

// Helper to read data
function readData(): Record<string, { name: string; status: 'pending' | 'approved'; createdAt: string; phone?: string; investorType?: string; profession?: string; experienceLevel?: string; reason?: string }> {
    ensureDataFile();
    try {
        const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading users_status.json:', error);
        return {};
    }
}

// Helper to write data
function writeData(data: Record<string, any>) {
    ensureDataFile();
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET: List all users from users_status.json
export async function GET() {
    try {
        const data = readData();
        // Format object to array
        const usersList = Object.entries(data).map(([email, info]) => ({
            email,
            name: info.name,
            status: info.status,
            createdAt: info.createdAt,
            phone: info.phone || '',
            investorType: info.investorType || '',
            profession: info.profession || '',
            experienceLevel: info.experienceLevel || '',
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
        const data = readData();

        if (!data[cleanEmail]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        data[cleanEmail].status = 'approved';
        writeData(data);

        // Trigger n8n webhook if configured
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WAITLIST_WEBHOOK || process.env.N8N_WAITLIST_WEBHOOK;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data[cleanEmail].name,
                        email: cleanEmail,
                        status: 'approved',
                        phone: data[cleanEmail].phone || ''
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

        const data = readData();

        if (!data[email]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        delete data[email];
        writeData(data);

        return NextResponse.json({ success: true, message: 'User removed successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
