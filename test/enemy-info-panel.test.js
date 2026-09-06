import test from 'node:test';
import assert from 'node:assert/strict';
import { EnemyInfoPanel } from '../src/ui/EnemyInfoPanel.js';
import { buildEnemyIntel } from '../src/systems/UIManager.js';

function createElementStub() {
    return {
        textContent: '',
        innerHTML: '',
        classList: {
            values: new Set(),
            add(value) { this.values.add(value); },
            remove(value) { this.values.delete(value); },
            contains(value) { return this.values.has(value); }
        },
        querySelector() {
            return { remove() { } };
        },
        insertAdjacentHTML(_position, html) {
            this.innerHTML += html;
        }
    };
}

test('EnemyInfoPanel renderiza datos y counter tactico del enemigo inspeccionado', () => {
    const previousDocument = globalThis.document;
    const elements = Object.fromEntries([
        'enemy-info-empty',
        'enemy-info-content',
        'en-info-name',
        'en-info-hp',
        'en-info-speed',
        'en-info-armor',
        'en-info-reward',
        'en-info-faction',
        'en-info-role',
        'en-info-resists',
        'en-info-threat',
        'en-info-phase'
    ].map((id) => [id, createElementStub()]));
    globalThis.document = { getElementById: (id) => elements[id] || null };
    const panel = new EnemyInfoPanel({
        getEnemyRole: (archetype, isBoss) => isBoss ? 'Jefe' : archetype,
        getResistanceText: () => 'energy 25%, Estados 30%'
    }, { buildEnemyIntel });

    try {
        panel.render({
            name: 'Loki',
            hp: 420.4,
            maxHp: 1000,
            speed: 38.6,
            armor: 0.24,
            reward: 450,
            faction: 'Chitauri',
            archetype: 'boss',
            isBoss: true,
            threat: 5,
            currentPhase: 'Ilusiones',
            phases: [{ name: 'Ilusiones' }]
        });

        assert.equal(elements['enemy-info-empty'].classList.contains('hidden'), true);
        assert.equal(elements['enemy-info-content'].classList.contains('hidden'), false);
        assert.equal(elements['en-info-name'].textContent, 'LOKI');
        assert.equal(elements['en-info-hp'].textContent, '421 / 1000');
        assert.equal(elements['en-info-speed'].textContent, 39);
        assert.equal(elements['en-info-armor'].textContent, '24%');
        assert.equal(elements['en-info-reward'].textContent, '$450');
        assert.equal(elements['en-info-faction'].textContent, 'Chitauri');
        assert.equal(elements['en-info-role'].textContent, 'Jefe');
        assert.equal(elements['en-info-resists'].textContent, 'energy 25%, Estados 30%');
        assert.equal(elements['en-info-threat'].textContent, '5 / 5');
        assert.equal(elements['en-info-phase'].textContent, 'Ilusiones');
        assert.match(elements['enemy-info-content'].innerHTML, /enemy-tactical-brief critical/);
        assert.match(elements['enemy-info-content'].innerHTML, /DPS sostenido/);
        assert.match(elements['enemy-info-content'].innerHTML, /Si el jefe llega a la base pierdes/);
    } finally {
        globalThis.document = previousDocument;
    }
});
