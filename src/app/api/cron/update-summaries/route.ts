import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { b3Assets, cryptoAssets } from '@/lib/data';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');

    // Validação de segurança
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && searchParams.get('secret') !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const allAssets = [...b3Assets, ...cryptoAssets];
    const results = [];

    for (const asset of allAssets) {
        // Tenta encontrar um relatório (PDF ou HTML) para o ativo
        const fileBaseNames = [
            asset.name,
            asset.ticker,
            asset.ticker.split('.')[0],
            'Bitcoin'
        ];

        let pdfPath = null;
        let htmlPath = null;

        for (const base of fileBaseNames) {
            const pPdf = path.join(process.cwd(), 'src', 'reports', `${base}.pdf`);
            const pHtml = path.join(process.cwd(), 'src', 'reports', `${base}.html`);

            if (fs.existsSync(pHtml)) {
                htmlPath = pHtml;
                break;
            }
            if (fs.existsSync(pPdf)) {
                pdfPath = pPdf;
                break;
            }
        }

        if (htmlPath || pdfPath) {
            try {
                let text = "";
                let htmlContent = "";

                if (htmlPath) {
                    htmlContent = fs.readFileSync(htmlPath, 'utf8');
                    // Remove tags html e body para renderização segura
                    htmlContent = htmlContent.replace(/<html[^>]*>/gi, '')
                        .replace(/<\/html>/gi, '')
                        .replace(/<body[^>]*>/gi, '')
                        .replace(/<\/body>/gi, '')
                        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
                        .replace(/<!DOCTYPE[^>]*>/gi, '');

                    // Extrai texto bruto para o resumo do Gemini (opcionalmente limpar tags)
                    text = htmlContent.replace(/<[^>]*>/g, ' ');
                } else if (pdfPath) {
                    const dataBuffer = fs.readFileSync(pdfPath);
                    const pdfData = await pdf(dataBuffer);
                    text = pdfData.text;
                }

                // 1. Geração de Resumo (Gemini)
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const summaryPrompt = `
                    Analise o seguinte relatório sobre o ativo ${asset.name} (${asset.ticker}) e gere um resumo executivo técnico.
                    O resumo deve conter exatamente 3 pontos positivos (Bull Case) e 3 pontos negativos (Bear Case).
                    Retorne APENAS um JSON no seguinte formato:
                    {
                        "bullCase": [{"title": "título curto", "desc": "descrição curta"}],
                        "bearCase": [{"title": "título curto", "desc": "descrição curta"}]
                    }
                    
                    Conteúdo do Relatório:
                    ${text.substring(0, 10000)}
                `;

                const summaryResult = await model.generateContent(summaryPrompt);
                const summaryResponse = summaryResult.response.text();

                // 2. Formatação do Relatório Completo (Groq) - Apenas se for PDF
                let formattedReport = "";
                if (pdfPath && !htmlPath) {
                    const groqPrompt = `
                        Abaixo está um texto extraído de um PDF que perdeu a formatação. Reorganize este texto em Markdown, preservando 100% das palavras originais. Identifique o que são títulos, separe os parágrafos corretamente e recrie as tabelas usando o formato de tabelas do Markdown (|---|). Não mude uma vírgula do conteúdo, apenas a organização visual.

                        Texto extraído:
                        ${text.substring(0, 30000)}
                    `;

                    const groqResult = await groq.chat.completions.create({
                        messages: [{ role: 'user', content: groqPrompt }],
                        model: 'llama-3.3-70b-versatile',
                    });

                    formattedReport = groqResult.choices[0]?.message?.content || "";
                }

                // Limpeza básica para extrair JSON se o Gemini colocar markdown
                const jsonMatch = summaryResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);

                    results.push({
                        ticker: asset.ticker,
                        status: 'Success',
                        analysis,
                        deepResearchText: formattedReport,
                        reportHtmlContent: htmlContent
                    });
                }
            } catch (err) {
                console.error(`Erro ao processar ${asset.ticker}:`, err);
                results.push({ ticker: asset.ticker, status: 'Error', error: (err as Error).message });
            }
        }
    }

    return NextResponse.json({
        message: 'Cron job executado com sucesso',
        timestamp: new Date().toISOString(),
        updates: results
    });
}
