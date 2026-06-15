import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ADMIN_EMAILS } from '@/lib/constants';

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
        // Pre-populate with a template or empty object
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

        const data = readData();
        const userStatus = data[email];

        if (!userStatus) {
            return NextResponse.json({ approved: false, status: 'none' });
        }

        return NextResponse.json({
            approved: userStatus.status === 'approved',
            status: userStatus.status,
            name: userStatus.name,
            createdAt: userStatus.createdAt
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

        const data = readData();

        // If user already exists, don't overwrite approved status to pending
        if (data[cleanEmail]) {
            return NextResponse.json({ 
                success: true, 
                message: 'User already exists', 
                status: data[cleanEmail].status 
            });
        }

        // If it's an admin, automatically mark as approved
        const isDefaultAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail);

        data[cleanEmail] = {
            name: cleanName,
            status: isDefaultAdmin ? 'approved' : 'pending',
            createdAt: new Date().toISOString(),
            phone: phone || '',
            investorType: investorType || '',
            profession: profession || '',
            experienceLevel: experienceLevel || '',
            reason: reason || ''
        };

        writeData(data);

        return NextResponse.json({ 
            success: true, 
            message: isDefaultAdmin ? 'Admin auto-approved' : 'User added to approval queue',
            status: data[cleanEmail].status
        });
    } catch (error) {
        console.error('Error in POST /api/auth/approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
