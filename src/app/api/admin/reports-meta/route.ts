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
        ).map(f => {
            const filePath = path.join(reportsDir, f);
            const stats = fs.statSync(filePath);
            return {
                name: f,
                mtime: stats.mtime,
                size: stats.size // Size in bytes
            };
        });

        return NextResponse.json({ 
            files: reportFiles,
            count: reportFiles.length
        });
    } catch (error) {
        console.error("Error reading reports directory:", error);
        return NextResponse.json({ error: "Failed to read reports", files: [] }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');
        
        if (!fileName) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }

        // Security: Prevent path traversal by extracting only the filename
        const cleanName = path.basename(fileName);
        const filePath = path.join(process.cwd(), 'public', 'reports', cleanName);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Delete file
        fs.unlinkSync(filePath);

        return NextResponse.json({ 
            success: true, 
            message: `File ${cleanName} deleted successfully` 
        });
    } catch (error) {
        console.error("Error deleting report file:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

