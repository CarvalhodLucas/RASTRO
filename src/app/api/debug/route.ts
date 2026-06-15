import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const diagnostic = {
        hasUrl: !!url,
        hasKey: !!key,
        urlValue: url ? `${url.substring(0, 15)}...${url.substring(url.length - 5)}` : 'undefined/empty',
        keyValueLength: key ? key.length : 0,
        serverTest: 'Not started',
        error: null as any
    };

    if (url && key) {
        try {
            const supabase = createClient(url, key);
            const { data, error } = await supabase.from('profiles').select('id').limit(1);
            if (error) {
                diagnostic.serverTest = 'Failed';
                diagnostic.error = error.message;
            } else {
                diagnostic.serverTest = 'Success';
            }
        } catch (err: any) {
            diagnostic.serverTest = 'Exception';
            diagnostic.error = err.message || String(err);
        }
    } else {
        diagnostic.serverTest = 'Skipped (missing env)';
    }

    return NextResponse.json(diagnostic);
}
