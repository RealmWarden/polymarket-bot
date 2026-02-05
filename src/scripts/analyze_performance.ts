import axios from 'axios';

const TRADERS = [
    '0xc2e7800b5af46e6093872b177b7a5e7f0563be51', // beachboy4
    '0xbddf61af533ff524d27154e589d2d7a81510c684', // Countryside
    '0x1f1dd8cf3d2c653edbdf319b81079bd753409a6f'  // A1d29
];

const CONFIG = {
    WALLET_SIZE: 50,
    PER_TRADE: 2,
    MAX_DAILY_VOLUME: 20,
    MAX_POSITION: 10
};

async function analyze() {
    console.log('Fetching trade history for analysis...');

    let allTrades: any[] = [];

    for (const trader of TRADERS) {
        try {
            // Fetch last 100 trades
            const url = `https://data-api.polymarket.com/activity?user=${trader}&type=TRADE&limit=100`;
            const res = await axios.get(url);
            if (res.data && Array.isArray(res.data)) {
                allTrades = allTrades.concat(res.data);
            }
        } catch (e) {
            console.error(`Error fetching for ${trader}: ${(e as Error).message}`);
        }
    }

    // Sort by time
    allTrades.sort((a, b) => a.timestamp - b.timestamp);

    // Group by day to check daily limits
    const dailyVolume: { [key: string]: number } = {};
    const dailyTrades: { [key: string]: number } = {};

    let simulatedTrades = 0;
    let simulatedWins = 0;
    let simulatedLosses = 0;
    let potentialProfit = 0;

    // We can't easily know if a trade "won" just from the trade data without checking market resolution
    // But we can estimate activity levels and fee impact

    // Filter to last 7 days for realistic current activity
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentTrades = allTrades.filter(t => t.timestamp * 1000 > oneWeekAgo);

    console.log(`\nAnalyzing ${recentTrades.length} trades from last 7 days across 3 traders...`);

    for (const trade of recentTrades) {
        const date = new Date(trade.timestamp * 1000).toISOString().split('T')[0];

        // 1. Check Daily Volume Limit
        if ((dailyVolume[date] || 0) >= CONFIG.MAX_DAILY_VOLUME) {
            continue; // Skip, hit limit
        }

        // 2. Simulate Trade
        dailyVolume[date] = (dailyVolume[date] || 0) + CONFIG.PER_TRADE;
        dailyTrades[date] = (dailyTrades[date] || 0) + 1;
        simulatedTrades++;
    }

    const daysAnalyzed = Object.keys(dailyTrades).length || 1;
    const avgTradesPerDay = simulatedTrades / 7; // Over 7 days

    console.log('\n--- ESTIMATED PERFORMANCE (Based on last 7 days) ---');
    console.log(`Avg Bot Trades/Day: ${avgTradesPerDay.toFixed(1)}`);
    console.log(`Avg Daily Volume: $${(avgTradesPerDay * CONFIG.PER_TRADE).toFixed(2)}`);

    console.log('\n--- CONSTRAINTS HIT ---');
    console.log(`Daily Limit ($20) would be hit on ${Object.values(dailyVolume).filter(v => v >= 20).length} of 7 days.`);
}

analyze();
