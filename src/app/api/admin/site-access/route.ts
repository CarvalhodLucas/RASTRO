import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_DIR = path.join(process.cwd(), "public");
const CONFIG_PATH = path.join(CONFIG_DIR, "site-access.config.json");

// Garante que o arquivo e a pasta existam com configuração padrão (restrito: true)
function getOrCreateConfig() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig = { restricted: true };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 4), "utf-8");
        return defaultConfig;
    }
    try {
        const content = fs.readFileSync(CONFIG_PATH, "utf-8");
        return JSON.parse(content);
    } catch (e) {
        return { restricted: true };
    }
}

export async function GET() {
    try {
        const config = getOrCreateConfig();
        return NextResponse.json(config);
    } catch (e) {
        return NextResponse.json({ error: "Erro ao ler configuração de acesso" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (typeof body.restricted !== "boolean") {
            return NextResponse.json({ error: "Campo 'restricted' deve ser boolean" }, { status: 400 });
        }

        const config = { restricted: body.restricted };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), "utf-8");
        return NextResponse.json(config);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
