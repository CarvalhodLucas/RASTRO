
const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        const result = await yahooFinance.quote('BTC-USD');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
