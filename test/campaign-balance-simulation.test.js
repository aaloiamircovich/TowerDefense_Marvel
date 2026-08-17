import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateCampaignBalance } from '../scripts/simulate-campaign-balance.js';

test('simulacion de campaña mantiene bosses vencibles sin regalarlos', () => {
    const report = simulateCampaignBalance();

    assert.deepEqual(report.failures, []);

    const firstAttempt = report.results.find((result) => result.id === 'base-avengers-wave-25-first-attempt');
    const readyAttempts = report.results.filter((result) => result.expected === 'pass');

    assert.ok(firstAttempt.margin < 0.95);
    assert.equal(readyAttempts.length, 4);
    assert.ok(readyAttempts.every((result) => result.margin >= result.minMargin));
    assert.ok(readyAttempts.every((result) => result.margin <= result.maxMargin));
});
