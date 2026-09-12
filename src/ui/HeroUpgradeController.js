import {
    calculateHeroLevelCost,
    getHeroDamageAtLevel,
    getHeroLevelUpgradeSteps,
    getScaledSupportAura,
    normalizeHeroLevel
} from '../utils/HeroLevel.js';

export class HeroUpgradeController {
    constructor(ui) {
        this.ui = ui;
    }

    getHeroLevel(unit) {
        const heroId = unit?.id || unit?.config?.id;
        return this.ui.game.progression?.getHeroLevel?.(heroId) || normalizeHeroLevel(unit?.level ?? unit?.config?.level ?? 1);
    }

    calculateLevelCost(currentLevel, amount = 1) {
        return calculateHeroLevelCost(currentLevel, amount);
    }

    getHeroUpgradeCost(unit, amount = 1) {
        return this.calculateLevelCost(this.getHeroLevel(unit), amount);
    }

    getHeroLevelPreviewLabel(unit, amount = 1) {
        return this.getHeroLevelPreviewRows(unit, amount)
            .map((row) => `${row.label} ${this.formatSignedPreviewValue(row.value, row.suffix, row.precision)}`)
            .join(', ');
    }

    getHeroLevelPreviewRows(unit, amount = 1) {
        const targetData = unit?.config || unit || {};
        const heroId = targetData.id || unit?.id;
        const currentLevel = this.getHeroLevel(unit);
        const steps = getHeroLevelUpgradeSteps(currentLevel, amount);
        if (!steps) return [];

        const databaseHero = this.ui.game.heroDatabase?.[heroId] || {};
        const rarity = targetData.rarity || databaseHero.rarity || 'Common';
        const baseDamage = Number(targetData.baseDamage ?? databaseHero.baseDamage ?? databaseHero.damage ?? targetData.damage ?? unit?.damage ?? 0);
        const currentDamage = getHeroDamageAtLevel(baseDamage, currentLevel, rarity);
        const nextDamage = getHeroDamageAtLevel(baseDamage, currentLevel + steps, rarity);
        const rows = [];
        if (nextDamage !== currentDamage) rows.push({ label: 'Dano', value: nextDamage - currentDamage });

        const aura = targetData.special?.supportAura || databaseHero.special?.supportAura || targetData.supportAura || databaseHero.supportAura;
        const currentAura = getScaledSupportAura(aura, currentLevel, rarity);
        const nextAura = getScaledSupportAura(aura, currentLevel + steps, rarity);
        const auraDelta = Number(nextAura?.power || 0) - Number(currentAura?.power || 0);
        if (auraDelta) rows.push({ label: 'Aura', value: auraDelta * 100, suffix: '%', precision: 1 });
        const auraRangeDelta = Number(nextAura?.range || 0) - Number(currentAura?.range || 0);
        if (auraRangeDelta) rows.push({ label: 'Radio', value: auraRangeDelta });

        return rows;
    }

    formatSignedPreviewValue(value, suffix = '', precision = 0) {
        const amount = Number(value) || 0;
        const fixed = Math.abs(amount).toFixed(precision);
        const clean = precision > 0 ? fixed.replace(/\.0$/, '') : fixed;
        return `${amount >= 0 ? '+' : '-'}${clean}${suffix}`;
    }

    getMissionCredits() {
        const rawCredits = Number(this.ui.game.resourceManager?.credits);
        if (rawCredits === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
        if (Number.isFinite(rawCredits)) return rawCredits;

        const hudValue = this.ui.creditsEl?.dataset?.value;
        if (hudValue === 'Infinity' || this.ui.creditsEl?.textContent === '∞') return Number.POSITIVE_INFINITY;
        const hudCredits = Number(String(hudValue ?? (this.ui.creditsEl?.textContent || '')).replace(/[^\d.-]/g, ''));
        return Number.isFinite(hudCredits) ? hudCredits : 0;
    }

    canAffordHeroUpgrade(unit, amount = 1) {
        const cost = this.getHeroUpgradeCost(unit, amount);
        return Boolean(unit) && Number.isFinite(cost) && this.getMissionCredits() >= cost;
    }

    findDeployedHeroById(heroId) {
        if (!heroId) return null;
        return this.ui.game.heroes?.find((unit) => (unit.id || unit.config?.id) === heroId) || null;
    }

    quickUpgradeHeroById(heroId) {
        return this.quickUpgradeHero(this.findDeployedHeroById(heroId));
    }

    spendMissionCredits(cost) {
        const resources = this.ui.game.resourceManager;
        const amount = Number(cost);
        if (!Number.isFinite(amount) || amount <= 0 || !resources) return false;

        if (resources.removeCredits?.(amount)) return true;

        const visibleCredits = this.getMissionCredits();
        if (visibleCredits < amount) return false;

        resources.credits = visibleCredits;
        if (resources.removeCredits?.(amount)) return true;

        resources.credits = visibleCredits - amount;
        return true;
    }

    refreshHeroUpgradeUi(unit) {
        const resources = this.ui.game.resourceManager || {};
        this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));
        this.ui.updateUI(
            resources.lives,
            this.getMissionCredits(),
            this.ui.game.waveManager?.currentWave || 1,
            this.ui.game.fps,
            this.ui.game.stars
        );
        this.ui.game.waveManager?.refreshWaveIntel?.();
        if (unit && !this.ui.overlay?.classList.contains('hidden')) {
            const view = this.ui.panelContent?.querySelector?.('.hero-detail-tab.active')?.dataset?.view || 'summary';
            this.ui.renderHeroDetails(unit, view);
        }
    }

    processUpgrade(unit, amount) {
        const cost = this.getHeroUpgradeCost(unit, amount);
        const steps = getHeroLevelUpgradeSteps(this.getHeroLevel(unit), amount);
        if (!Number.isFinite(cost) || steps <= 0) {
            this.ui.showToast('Este héroe ya está en nivel máximo', 'info');
            this.refreshHeroUpgradeUi(unit);
            return;
        }
        if (!this.spendMissionCredits(cost)) {
            this.ui.showToast('Créditos insuficientes para esta mejora', 'warning');
            return;
        }

        this.applyHeroLevelUpgrade(unit, steps);
        this.ui.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost });
        this.ui.showToast(`${unit.name} subió a nivel ${unit.level}`, 'success');
        this.refreshHeroUpgradeUi(unit);
    }

    quickUpgradeHero(unit) {
        if (!unit) return false;
        const cost = this.getHeroUpgradeCost(unit, 1);
        if (!Number.isFinite(cost) || getHeroLevelUpgradeSteps(this.getHeroLevel(unit), 1) <= 0) {
            this.ui.showToast('Este héroe ya está en nivel máximo', 'info');
            this.refreshHeroUpgradeUi(unit);
            return false;
        }
        if (!this.spendMissionCredits(cost)) {
            this.ui.showToast('Creditos insuficientes para mejora rapida', 'warning');
            this.refreshHeroUpgradeUi(unit);
            return false;
        }

        this.applyHeroLevelUpgrade(unit, 1);
        this.ui.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost, quick: true });
        this.ui.showToast(`${unit.name} nivel ${unit.level} listo para combate`, 'success');
        this.refreshHeroUpgradeUi(unit);
        return true;
    }

    applyHeroLevelUpgrade(unit, amount) {
        const targetData = unit.config || unit;
        const nextLevel = normalizeHeroLevel(this.getHeroLevel(unit) + Math.max(1, Math.floor(Number(amount) || 1)));
        if (targetData.id && this.ui.game.progression?.setHeroLevel) {
            this.ui.game.progression.setHeroLevel(targetData.id, nextLevel, { save: true, sync: false });
        }
        targetData.level = nextLevel;
        targetData.baseDamage = targetData.baseDamage || targetData.damage || unit.damage || 10;
        targetData.baseRange = targetData.baseRange || targetData.range || unit.range || 100;
        targetData.baseFireRate = targetData.baseFireRate || targetData.fireRate || unit.fireRate || 1;
        targetData.damage = getHeroDamageAtLevel(targetData.baseDamage, targetData.level, targetData.rarity || unit.rarity);
        targetData.range = targetData.baseRange;
        targetData.fireRate = targetData.baseFireRate;

        unit.level = nextLevel;
        unit.damage = targetData.damage;
        unit.range = targetData.range;
        unit.fireRate = targetData.fireRate;
        this.ui.game.progression?.applyHeroLevelStats?.(unit);
    }
}
