import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const reportsDir = path.join(process.cwd(), 'public', 'reports');
        
        if (!fs.existsSync(reportsDir)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(reportsDir);
        
        // Filter only html and pdf files
        const reportFiles = files.filter(f => 
            f.toLowerCase().endsWith('.html') || 
            f.toLowerCase().endsWith('.htm') || 
            f.toLowerCase().endsWith('.pdf')
        );

        return NextResponse.json({ 
            files: reportFiles,
            count: reportFiles.length
        });
    } catch (error) {
        console.error("Error reading reports directory:", error);
        return NextResponse.json({ error: "Failed to read reports", files: [] }, { status: 500 });
    }
}
