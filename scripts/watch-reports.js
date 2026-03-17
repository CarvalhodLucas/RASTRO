const chokidar = require('chokidar');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do Banco de Dados
// Você pode ajustar esses valores ou defini-los em um arquivo .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://usuario:senha@localhost:5432/nome_do_banco',
});

// Caminho para monitorar
const watchPath = path.join(__dirname, '../public/reports');

console.log(`🚀 Iniciando monitoramento em: ${watchPath}`);

// Inicializa o watcher
const watcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../, // Ignora arquivos ocultos
    persistent: true,
    ignoreInitial: false // Processa arquivos já existentes na inicialização
});

// Função para processar o arquivo
async function processFile(filePath) {
    if (path.extname(filePath).toLowerCase() !== '.html') return;

    const fileName = path.basename(filePath);
    const ticker = fileName.replace('.html', '').toUpperCase();

    try {
        console.log(`📄 Lendo arquivo: ${fileName} para o ticker: ${ticker}`);
        const content = fs.readFileSync(filePath, 'utf8');

        const query = 'UPDATE assets SET html_report = $1 WHERE ticker = $2';
        const values = [content, ticker];

        await pool.query(query, values);
        console.log(`✅ Banco de dados atualizado com sucesso para ${ticker}!`);
    } catch (err) {
        console.error(`❌ Erro ao processar arquivo ${fileName}:`, err.message);
    }
}

// Eventos de monitoramento
watcher
    .on('add', filePath => processFile(filePath))
    .on('change', filePath => processFile(filePath))
    .on('error', error => console.error(`Error: ${error}`));

// Limpeza ao encerrar
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando monitoramento...');
    await pool.end();
    process.exit(0);
});
