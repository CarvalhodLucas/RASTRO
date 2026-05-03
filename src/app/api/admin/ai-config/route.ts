import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "ai-models.config.json");

export async function GET() {
    try {
        const content = fs.readFileSync(CONFIG_PATH, "utf-8");
        return NextResponse.json(JSON.parse(content));
    } catch (e) {
        return NextResponse.json({ error: "Erro ao ler config" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const current = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

        // Merge apenas as sections para não sobrescrever metadados
        current.sections = { ...current.sections, ...body.sections };

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(current, null, 4), "utf-8");
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
