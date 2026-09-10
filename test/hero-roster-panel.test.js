import test from 'node:test';
import assert from 'node:assert/strict';
import { HeroRosterPanel } from '../src/ui/HeroRosterPanel.js';

test('HeroRosterPanel renderiza tarjeta ligera y conserva acciones del roster', () => {
    const previousDocument = globalThis.document;
    globalThis.document = {
        createElement() {
            return createCardStub();
        }
    };

    const calls = [];
    const heroGrid = createHeroGridStub();
    const activeTeam = [
        { id: 'spiderman', name: 'Spider-Man', rarity: 'Epic', level: 2, sprite: 'spiderman.png', targetingPriority: 'Primero' },
        { id: 'black_widow', name: 'Black Widow', rarity: 'Common', level: 1, sprite: 'black_widow.png' }
    ];
    const deployedSpider = {
        id: 'spiderman',
        name: 'Spider-Man',
        rarity: 'Epic',
        level: 4,
        targetingPriority: 'Primero',
        config: { id: 'spiderman', targetingPriority: 'Primero' }
    };
    const ui = {
        heroGrid,
        nextWaveSummary: null,
        game: {
            activeTeam,
            heroes: [deployedSpider],
            resourceManager: { credits: 700 },
            waveManager: {
                isWaveActive: false,
                buildPreparedSummary: () => ({ stealthCount: 1 })
            },
            progression: {
                setHeroTargetingPriority(heroId, priority) {
                    calls.push(`priority:${heroId}:${priority}`);
                }
            },
            inputManager: {
                setRepositionMode(hero) {
                    calls.push(`reposition:${hero.id}`);
                },
                setPlacementMode(hero) {
                    calls.push(`place-mode:${hero.id}`);
                }
            }
        },
        getHeroUpgradeCost: () => 220,
        canAffordHeroUpgrade: () => true,
        getHeroLevel: (hero) => hero.level || 1,
        renderSprite(source, name) {
            return `<img src="${source}" alt="${name}">`;
        },
        getHeroDisplaySprite(hero) {
            return hero.sprite || `${hero.id}.png`;
        },
        findDeployedHeroById(id) {
            return id === 'spiderman' ? deployedSpider : null;
        },
        inspectUnit(hero) {
            calls.push(`inspect:${hero.id}`);
        },
        showToast(message) {
            calls.push(`toast:${message}`);
        },
        renderOnboardingCoach() {
            calls.push('coach');
        }
    };
    const panel = new HeroRosterPanel(ui, {
        buildTargetingControlState: () => ({
            icon: 'fa-crosshairs',
            key: 'first',
            label: 'Pri',
            color: '#40c9ff',
            next: 'Último',
            tooltip: 'Cambiar prioridad',
            ariaLabel: 'Cambiar prioridad'
        }),
        getNextTargetingPriority: () => 'Último'
    });

    try {
        panel.render(activeTeam, (hero) => calls.push(`select:${hero.id}`));

        assert.equal(heroGrid.children.length, 2);
        assert.match(heroGrid.children[0].innerHTML, /Nv\. 4/);
        assert.equal(heroGrid.children[0].attributes['aria-label'], 'Spider-Man. Rareza Epic. Nivel 4.');
        assert.doesNotMatch(heroGrid.children[0].attributes['aria-label'], /campo|banco/i);
        assert.match(heroGrid.children[0].innerHTML, /class="btn-action place-btn" type="button"/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="Reposicionar Spider-Man"/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="Spider-Man: Mejora rapida \$220"/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="Spider-Man: Cambiar prioridad"/);
        assert.match(heroGrid.children[0].innerHTML, /data-priority="first"/);
        assert.match(heroGrid.children[0].innerHTML, /data-next-priority="Último"/);
        assert.match(heroGrid.children[0].innerHTML, /style="--target-color:#40c9ff"/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="Abrir estadisticas y mejoras de Spider-Man"/);
        assert.match(heroGrid.children[1].innerHTML, /aria-label="Colocar Black Widow"/);
        assert.match(heroGrid.children[0].innerHTML, /data-upgrade-state="ready"/);
        assert.match(heroGrid.children[0].innerHTML, /Mejora rapida \$220/);
        assert.doesNotMatch(heroGrid.children[0].innerHTML, /hero-card-field-state|>Campo<|>Banco<|Respuesta ideal|rompe armadura|detecta sigilo|frena corredores/i);
        assert.doesNotMatch(heroGrid.children[1].innerHTML, /hero-card-field-state|>Campo<|>Banco<|Respuesta ideal|rompe armadura|detecta sigilo|frena corredores/i);
        assert.doesNotMatch(heroGrid.children[0].className, /wave-fit-/);
        assert.equal(heroGrid.children[0].dataset.waveFit, undefined);
        assert.ok(calls.includes('coach'));

        heroGrid.children[0].buttons.place.listeners.click(createClickEventStub());
        heroGrid.children[0].buttons.stats.listeners.click(createClickEventStub());
        heroGrid.children[1].buttons.place.listeners.click(createClickEventStub());
        heroGrid.children[0].buttons.target.listeners.click(createClickEventStub());

        assert.ok(calls.includes('reposition:spiderman'));
        assert.ok(calls.includes('inspect:spiderman'));
        assert.ok(calls.some((call) => call.includes('objetivo Último')));
        assert.ok(calls.includes('priority:spiderman:Último'));
        assert.ok(calls.includes('select:black_widow'));
        assert.equal(deployedSpider.targetingPriority, 'Último');
        assert.equal(activeTeam[0].targetingPriority, 'Último');
    } finally {
        globalThis.document = previousDocument;
    }
});

test('HeroRosterPanel muestra cuanto falta para mejora rapida', () => {
    const previousDocument = globalThis.document;
    globalThis.document = {
        createElement() {
            return createCardStub();
        }
    };

    const heroGrid = createHeroGridStub();
    const hero = { id: 'hawkeye', name: 'Hawkeye', rarity: 'Common', level: 8, sprite: 'hawkeye.png' };
    const deployedHero = { ...hero, level: 8, config: { id: hero.id } };
    const ui = {
        heroGrid,
        game: {
            activeTeam: [hero],
            heroes: [deployedHero],
            resourceManager: { credits: 100 },

            inputManager: {
                setRepositionMode() {},
                setPlacementMode() {}
            }
        },
        getHeroUpgradeCost: () => 220,
        canAffordHeroUpgrade: () => false,
        getMissionCredits: () => 100,
        getHeroLevel: (unit) => unit.level || 1,
        renderSprite(source, name) {
            return `<img src="${source}" alt="${name}">`;
        },
        getHeroDisplaySprite(unit) {
            return unit.sprite || `${unit.id}.png`;
        },
        findDeployedHeroById: () => deployedHero,
        inspectUnit() {},
        showToast() {},
        renderOnboardingCoach() {}
    };

    try {
        new HeroRosterPanel(ui).render([hero]);

        assert.equal(heroGrid.children.length, 1);
        assert.match(heroGrid.children[0].innerHTML, /data-affordable="false"/);
        assert.match(heroGrid.children[0].innerHTML, /data-upgrade-state="short"/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="Hawkeye: Faltan \$120 para mejorar"/);
        assert.match(heroGrid.children[0].innerHTML, /Faltan \$120 para mejorar/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('HeroRosterPanel normaliza icono y color del control de objetivo', () => {
    const previousDocument = globalThis.document;
    globalThis.document = {
        createElement() {
            return createCardStub();
        }
    };

    const heroGrid = createHeroGridStub();
    const hero = { id: 'storm" onclick="bad', name: '<Storm>', rarity: 'Epic', level: 3, sprite: 'storm.png', targetingPriority: 'Primero' };
    const deployedHero = { ...hero, config: { id: hero.id, targetingPriority: 'Primero' } };
    const ui = {
        heroGrid,
        game: {
            activeTeam: [hero],
            heroes: [deployedHero],
            resourceManager: { credits: 700 },
            progression: { setHeroTargetingPriority() {} },
            inputManager: {
                setRepositionMode() {},
                setPlacementMode() {}
            }
        },
        getHeroUpgradeCost: () => Number.POSITIVE_INFINITY,
        canAffordHeroUpgrade: () => false,
        getHeroLevel: (unit) => unit.level || 1,
        renderSprite() {
            return '<span class="sprite-safe"></span>';
        },
        getHeroDisplaySprite() {
            return 'storm.png';
        },
        findDeployedHeroById: () => deployedHero,
        inspectUnit() {},
        showToast() {},
        renderOnboardingCoach() {}
    };

    try {
        new HeroRosterPanel(ui, {
            buildTargetingControlState: () => ({
                icon: 'fa-eye" onclick="bad',
                key: 'first',
                label: '<Sig>',
                color: 'url(javascript:bad)',
                next: '<Next>',
                tooltip: '<Tooltip>',
                ariaLabel: '<Cambiar>'
            })
        }).render([hero]);

        assert.match(heroGrid.children[0].innerHTML, /data-testid="hero-target-storm&quot; onclick=&quot;bad"/);
        assert.match(heroGrid.children[0].innerHTML, /style="--target-color:var\(--level-accent\)"/);
        assert.match(heroGrid.children[0].innerHTML, /fa-circle-info/);
        assert.match(heroGrid.children[0].innerHTML, /&lt;Sig&gt;/);
        assert.match(heroGrid.children[0].innerHTML, /aria-label="&lt;Storm&gt;: &lt;Cambiar&gt;"/);
        assert.doesNotMatch(heroGrid.children[0].innerHTML, /javascript:bad|onclick="bad|<Sig>|<Storm>/);
    } finally {
        globalThis.document = previousDocument;
    }
});

function createHeroGridStub() {
    return {
        _innerHTML: '',
        children: [],
        set innerHTML(value) {
            this._innerHTML = value;
            if (value === '') this.children = [];
        },
        get innerHTML() {
            return this._innerHTML;
        },
        appendChild(card) {
            this.children.push(card);
        }
    };
}

function createCardStub() {
    const card = {
        className: '',
        dataset: {},
        attributes: {},
        innerHTML: '',
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        buttons: {
            place: createButtonStub(),
            stats: createButtonStub(),
            target: createButtonStub()
        },
        querySelector(selector) {
            if (selector === '.place-btn') return this.buttons.place;
            if (selector === '.stats-btn') return this.buttons.stats;
            if (selector === '.target-btn') return this.innerHTML.includes('target-btn') ? this.buttons.target : null;
            return null;
        }
    };
    return card;
}

function createButtonStub() {
    return {
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}

function createClickEventStub() {
    return {
        stopPropagation() {}
    };
}
