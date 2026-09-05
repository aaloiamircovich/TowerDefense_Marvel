import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateCampaignBalance } from '../scripts/simulate-campaign-balance.js';

test('simulacion de campaña mantiene bosses vencibles sin regalarlos', () => {
    const report = simulateCampaignBalance();

    assert.deepEqual(report.failures, []);

    const attempts = [1, 2, 3, 4].map((attempt) => report.results.find((result) => (
        result.id === `base-avengers-wave-25-attempt-${attempt}`
            || result.id === `base-avengers-wave-25-attempt-${attempt}-ready`
    )));
    const readyAttempts = report.results.filter((result) => result.expected === 'pass');

    assert.equal(attempts.every(Boolean), true);
    assert.ok(attempts.slice(0, 3).every((attempt) => attempt.expected === 'fail' && attempt.margin < 0.95));
    assert.equal(attempts[3].expected, 'pass');
    assert.ok(attempts[3].margin >= attempts[3].minMargin);
    assert.equal(readyAttempts.length, 6);
    assert.ok(readyAttempts.every((result) => result.margin >= result.minMargin));
    assert.ok(readyAttempts.every((result) => result.margin <= result.maxMargin));
});
