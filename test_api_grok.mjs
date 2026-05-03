// Native fetch used

const url = 'http://localhost:3000/api/grok';

async function testRequest(type, body) {
    console.log(`Testing ${type}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`✅ ${type} Success:`, JSON.stringify(data).substring(0, 100) + '...');
        } else {
            console.error(`❌ ${type} Failed (${res.status}):`, data);
        }
    } catch (e) {
        console.error(`❌ ${type} Error:`, e.message);
    }
}

async function runTests() {
    await testRequest('Fair Price', { ticker: 'PETR4', isFairPrice: true, assetName: 'Petrobras' });
    await testRequest('Sentiment', { ticker: 'BTC', isSentiment: true, variation: '2.5' });
    await testRequest('Health', { ticker: 'VALE3', isHealth: true, report: 'Vale report text...' });
}

runTests();
