function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededOrder(values, seed) {
    return [...values].sort((a, b) => hashText(`${seed}:${a.id}`) - hashText(`${seed}:${b.id}`));
}

export class ShopSystem {
    constructor(game, progression, dateProvider = () => new Date()) {
        this.game = game;
        this.progression = progression;
        this.dateProvider = dateProvider;
    }

    getRotationKey() {
        return this.dateProvider().toISOString().slice(0, 10);
    }

    ensureRotation() {
        const shop = this.progression.state.shop;
        const key = this.getRotationKey();
        if (shop.rotationKey === key && shop.slotIds.length > 0) return;

        const available = Object.values(this.game.itemDatabase);
        const bands = [
            available.filter((item) => item.tier === 1),
            available.filter((item) => item.tier === 2),
            available.filter((item) => item.tier >= 3)
        ];
        const selected = bands.flatMap((band, index) => seededOrder(band, `${key}:${index}`).slice(0, 1));
        const remainder = seededOrder(available.filter((item) => !selected.includes(item)), `${key}:extra`);
        shop.rotationKey = key;
        shop.slotIds = [...selected, ...remainder].slice(0, 3).map((item) => item.id);
        shop.purchasedIds = [];
        this.progression.save();
    }

    getRotation() {
        this.ensureRotation();
        const shop = this.progression.state.shop;
        return shop.slotIds.map((id) => ({
            item: this.game.itemDatabase[id],
            purchased: shop.purchasedIds.includes(id)
        }));
    }

    purchaseItem(itemId) {
        this.ensureRotation();
        const shop = this.progression.state.shop;
        const item = this.game.itemDatabase[itemId];
        if (!item || !shop.slotIds.includes(itemId) || shop.purchasedIds.includes(itemId)) {
            return { ok: false, reason: 'Objeto no disponible' };
        }
        if (!this.progression.spendMetaCredits(item.price)) return { ok: false, reason: 'Fondos S.H.I.E.L.D. insuficientes' };
        this.progression.addOwnedItem(itemId);
        shop.purchasedIds.push(itemId);
        this.progression.save();
        return { ok: true, item };
    }

    recruitHero() {
        const cost = 500;
        const pool = Object.values(this.game.heroDatabase)
            .filter((hero) => hero.visual)
            .filter((hero) => !this.progression.state.unlockedHeroIds.includes(hero.id));
        if (pool.length === 0) return { ok: false, reason: 'Ya tienes todos los héroes' };
        if (this.progression.state.metaCredits < cost) return { ok: false, reason: 'Fondos S.H.I.E.L.D. insuficientes' };

        const shop = this.progression.state.shop;
        const guaranteed = shop.heroPity >= 4;
        const candidates = guaranteed ? pool.filter((hero) => hero.rarity !== 'Common') : pool;
        const weights = { Common: 60, Rare: 30, Legendary: 10 };
        const weighted = (candidates.length ? candidates : pool)
            .flatMap((hero) => Array(weights[hero.rarity] || 20).fill(hero));
        const hero = this.game.random.pick(weighted);
        this.progression.spendMetaCredits(cost);
        this.progression.unlockHero(hero.id);
        shop.heroPity = hero.rarity === 'Common' ? shop.heroPity + 1 : 0;
        this.progression.save();
        return { ok: true, hero, guaranteed };
    }
}
