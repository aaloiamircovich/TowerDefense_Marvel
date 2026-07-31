import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data', 'items.json');

function item(id, name, desc, price, tier, rarity, slot, set, effects) {
    return {
        id,
        name,
        desc,
        icon: `assets/images/items/${id}.png`,
        price,
        tier,
        slot,
        set,
        effects,
        rarity
    };
}

const items = [
    item('chaleco_tactico', 'CHALECO TACTICO', '+6% dano, +6% cadencia y 6% penetracion. El primer anti-blindaje economico.', 260, 1, 'Common', 'armor', 'tactical', { damagePct: 0.06, fireRatePct: 0.06, armorPenetration: 0.06 }),
    item('baliza_fury', 'BALIZA TACTICA', 'Detecta sigilo y extiende 8% el alcance.', 320, 1, 'Common', 'artifact', 'tactical', { detectStealth: true, rangePct: 0.08 }),
    item('telarana_sintetica', 'TELARANA SINTETICA', '35% de ralentizar al impactar.', 360, 1, 'Common', 'weapon', 'street', { slowChance: 0.35, slowPower: 0.3 }),
    item('aguijon_wasp', 'AGUIJON WASP', '22% de ralentizar y +3% critico.', 420, 1, 'Common', 'weapon', 'pym', { slowChance: 0.22, slowPower: 0.22, critChance: 3 }),
    item('lentes_edith', 'LENTES E.D.I.T.H.', 'Detecta sigilo, +4% alcance y +2% critico.', 480, 1, 'Common', 'artifact', 'stark', { detectStealth: true, rangePct: 0.04, critChance: 2 }),
    item('aerodeslizador', 'AERODESLIZADOR PYM', 'Permite colocacion sobre agua y +4% alcance.', 520, 1, 'Common', 'armor', 'pym', { allowWater: true, rangePct: 0.04 }),
    item('botas_antigrav', 'BOTAS ANTIGRAV', 'Permite colocacion en montana y +5% alcance.', 600, 1, 'Common', 'armor', 'stark', { allowMountain: true, rangePct: 0.05 }),
    item('fertilizante_groot', 'ESPORAS DE GROOT', 'Permite colocacion en pasto y +5% dano.', 680, 1, 'Common', 'artifact', 'cosmic', { allowGrass: true, damagePct: 0.05 }),
    item('emisor_termico', 'EMISOR TERMICO', '18% de aplicar quemadura corta por impacto.', 760, 1, 'Common', 'weapon', 'stark', { burnChance: 0.18, burnDuration: 3, burnPower: 0.012 }),
    item('carga_viuda', 'CARGA WIDOW', '12% de aturdir brevemente y +4% cadencia.', 820, 1, 'Common', 'weapon', 'street', { stunChance: 0.12, stunDuration: 0.18, fireRatePct: 0.04 }),

    item('reactor_arc', 'REACTOR ARC', '+18% cadencia y +4% dano.', 950, 2, 'Rare', 'weapon', 'stark', { fireRatePct: 0.18, damagePct: 0.04 }),
    item('tejido_cinetico', 'TEJIDO CINETICO', '+12% cadencia y +4% alcance.', 1050, 2, 'Rare', 'armor', 'vibranium', { fireRatePct: 0.12, rangePct: 0.04 }),
    item('escudo_vibranium', 'ESCUDO DE VIBRANIUM', '+8% dano, +4% alcance y +8% contra blindaje.', 1120, 2, 'Rare', 'armor', 'vibranium', { damagePct: 0.08, rangePct: 0.04, armorDamagePct: 0.08 }),
    item('contrato_stark', 'CONTRATO STARK', 'Cada impacto genera 2.5% de la recompensa del enemigo y +3% dano.', 1220, 2, 'Rare', 'artifact', 'stark', { onHitCreditPct: 0.025, damagePct: 0.03 }),
    item('regulador_cuantico', 'REGULADOR CUANTICO', '+7% critico y +15% dano critico.', 1300, 2, 'Rare', 'artifact', 'pym', { critChance: 7, critDamageBonus: 0.15 }),
    item('municion_ice', 'MUNICION I.C.E.R.', '28% de ralentizar y 8% penetracion.', 1380, 2, 'Rare', 'weapon', 'tactical', { slowChance: 0.28, slowPower: 0.22, armorPenetration: 0.08 }),
    item('localizador_fury', 'LOCALIZADOR FURY', 'Detecta sigilo, +8% alcance y +8% dano a larga distancia.', 1460, 2, 'Rare', 'artifact', 'tactical', { detectStealth: true, rangePct: 0.08, longRangeDamagePct: 0.08, longRangeThreshold: 150 }),
    item('runas_kamar_taj', 'RUNAS DE KAMAR-TAJ', '20% de maldecir y +6% dano por estado activo.', 1540, 2, 'Rare', 'weapon', 'mystic', { curseChance: 0.2, curseDuration: 4, cursePower: 0.01, statusDamagePct: 0.06, statusDamageCap: 0.24 }),
    item('brazalete_kun_lun', 'BRAZALETE KUN-LUN', '16% de aturdir y +20% dano critico.', 1620, 2, 'Rare', 'artifact', 'mystic', { stunChance: 0.16, stunDuration: 0.22, critDamageBonus: 0.2 }),
    item('memoria_colmena', 'MEMORIA COLMENA', 'Detecta sigilo, +5% alcance y dano acumulativo por foco.', 1700, 2, 'Rare', 'artifact', 'symbiote', { detectStealth: true, rangePct: 0.05, consecutiveDamagePct: 0.015 }),

    item('municion_repulsora', 'MUNICION REPULSORA', '22% penetracion y +15% dano contra enemigos blindados.', 2100, 3, 'Epic', 'weapon', 'stark', { armorPenetration: 0.22, armorDamagePct: 0.15 }),
    item('guanteletes_gigantes', 'GUANTELETES GIGANTES', 'Impactos en area pequena, pero -12% dano si el enemigo esta demasiado cerca.', 2250, 3, 'Epic', 'weapon', 'pym', { splashRadius: 42, splashFactor: 0.32, closeRangeDamagePenaltyPct: 0.12, closeRangeThreshold: 110 }),
    item('anillo_portal', 'ANILLO PORTAL', 'Los proyectiles rebotan una vez entre enemigos cercanos.', 2400, 3, 'Epic', 'weapon', 'mystic', { chainCount: 1, chainRange: 105, chainFactor: 0.55 }),
    item('lanza_dora', 'LANZA DORA MILAJE', '+5% critico, +20% dano critico y 18% penetracion.', 2550, 3, 'Epic', 'weapon', 'vibranium', { critChance: 5, critDamageBonus: 0.2, armorPenetration: 0.18 }),
    item('corazon_wakanda', 'CORAZON DE WAKANDA', '+14% dano y +10% contra blindaje.', 2700, 3, 'Epic', 'artifact', 'vibranium', { damagePct: 0.14, armorDamagePct: 0.1 }),
    item('particulas_pym', 'PARTICULAS PYM', '+25% cadencia, pero -8% dano base.', 2850, 3, 'Epic', 'artifact', 'pym', { fireRatePct: 0.25, damagePct: -0.08 }),
    item('tentaculo_klyntar', 'TENTACULO KLYNTAR', 'Rompe armadura y puede aplicar veneno ligero.', 3000, 3, 'Epic', 'weapon', 'symbiote', { armorBreakChance: 0.32, armorBreakPower: 0.16, poisonChance: 0.2, poisonDuration: 4, poisonPower: 0.008, poisonStacks: 1 }),
    item('sello_kun_lun', 'SELLO KUN-LUN', '+9% dano, 18% de aturdir y +10% contra enemigos controlados.', 3150, 3, 'Epic', 'artifact', 'mystic', { damagePct: 0.09, stunChance: 0.18, stunDuration: 0.24, damageToControlledPct: 0.1 }),
    item('tridente_atlante', 'TRIDENTE ATLANTE', 'Permite agua, 20% penetracion y +8% contra jefes.', 3300, 3, 'Epic', 'weapon', 'cosmic', { allowWater: true, armorPenetration: 0.2, bossDamagePct: 0.08 }),
    item('alas_wasp', 'ALAS WASP', '+16% cadencia y +4% critico.', 3450, 3, 'Epic', 'armor', 'pym', { fireRatePct: 0.16, critChance: 4 }),
    item('guante_quake', 'GUANTE QUAKE', 'Ralentiza y rompe armadura por vibracion.', 3600, 3, 'Epic', 'weapon', 'tactical', { slowChance: 0.25, slowPower: 0.22, armorBreakChance: 0.28, armorBreakPower: 0.14 }),
    item('casco_nova', 'CASCO NOVA', 'Rebote energetico y +8% dano contra jefes.', 3750, 3, 'Epic', 'artifact', 'cosmic', { chainCount: 1, chainRange: 110, chainFactor: 0.58, bossDamagePct: 0.08 }),
    item('armadura_war_machine', 'ARMADURA WAR MACHINE', 'Area pequena y 12% penetracion.', 3900, 3, 'Epic', 'armor', 'stark', { splashRadius: 38, splashFactor: 0.28, armorPenetration: 0.12 }),
    item('simbionte', 'SIMBIONTE VENOM', 'Dano acumulativo por foco y +8% contra enemigos controlados.', 4100, 3, 'Epic', 'armor', 'symbiote', { consecutiveDamagePct: 0.025, damageToControlledPct: 0.08 }),

    item('protocolo_extremis', 'PROTOCOLO EXTREMIS', '+18% dano, quemadura estable y bonus si la base esta en peligro.', 5400, 4, 'Legendary', 'armor', 'stark', { damagePct: 0.18, burnChance: 0.25, burnDuration: 4, burnPower: 0.014, lowLifeDamagePct: 0.18 }),
    item('ojo_agamotto', 'OJO DE AGAMOTTO', 'Detecta sigilo, +13% alcance y +8% dano por estado activo.', 5850, 4, 'Legendary', 'artifact', 'mystic', { detectStealth: true, rangePct: 0.13, statusDamagePct: 0.08, statusDamageCap: 0.32 }),
    item('capa_levitacion', 'CAPA DE LEVITACION', 'Permite agua y montana, con +12% alcance.', 6200, 4, 'Legendary', 'armor', 'mystic', { allowWater: true, allowMountain: true, rangePct: 0.12 }),
    item('prisma_luz_oscura', 'PRISMA LUZ OSCURA', 'Detecta sigilo, rebota y castiga enemigos malditos.', 6600, 4, 'Legendary', 'artifact', 'mystic', { detectStealth: true, chainCount: 1, chainRange: 90, chainFactor: 0.5, curseChance: 0.22, curseDuration: 4, cursePower: 0.012, damageToCursedPct: 0.18 }),
    item('moneda_madripoor', 'MONEDA DE MADRIPOOR', 'Cada impacto genera 6% de recompensa, pero reduce 5% el dano.', 7000, 4, 'Legendary', 'artifact', 'street', { onHitCreditPct: 0.06, damagePct: -0.05 }),
    item('visor_sniper', 'VISOR SNIPER', '+8% alcance y +22% dano a larga distancia, pero penaliza el combate cercano.', 7350, 4, 'Legendary', 'artifact', 'tactical', { rangePct: 0.08, longRangeDamagePct: 0.22, longRangeThreshold: 165, closeRangeDamagePenaltyPct: 0.18, closeRangeThreshold: 115 }),
    item('collar_pantera', 'COLLAR PANTERA', '+6% critico, +35% dano critico y +16% contra blindaje.', 7700, 4, 'Legendary', 'artifact', 'vibranium', { critChance: 6, critDamageBonus: 0.35, armorDamagePct: 0.16 }),
    item('cetro_loki', 'CETRO DE LOKI', 'Maldice con frecuencia y propaga dano entre grupos.', 8200, 4, 'Legendary', 'weapon', 'asgard', { curseChance: 0.28, curseDuration: 5, cursePower: 0.013, statusDamagePct: 0.1, statusDamageCap: 0.35, chainCount: 1, chainRange: 80, chainFactor: 0.45 }),

    item('fragmento_carnage', 'FRAGMENTO CARNAGE', '+18% dano, +5% critico y veneno acumulable.', 11500, 5, 'Mythic', 'artifact', 'symbiote', { damagePct: 0.18, critChance: 5, poisonChance: 0.35, poisonDuration: 5, poisonPower: 0.01, poisonStacks: 2 }),
    item('formula_phoenix', 'FORMULA PHOENIX', 'Quemadura fuerte, area y +25% contra enemigos quemados.', 13500, 5, 'Mythic', 'artifact', 'cosmic', { burnChance: 0.45, burnDuration: 5, burnPower: 0.02, damageToBurnedPct: 0.25, splashRadius: 44, splashFactor: 0.28 }),
    item('tabla_surfer', 'TABLA DEL SURFER', '+18% alcance, rebote y +18% dano a larga distancia.', 15000, 5, 'Mythic', 'armor', 'cosmic', { rangePct: 0.18, chainCount: 1, chainRange: 130, chainFactor: 0.5, longRangeDamagePct: 0.18, longRangeThreshold: 170 }),
    item('orbe_caos_wanda', 'ORBE DE CAOS', 'Alta probabilidad de maldicion y +12% dano por estado activo.', 17000, 5, 'Mythic', 'artifact', 'mystic', { curseChance: 0.4, curseDuration: 5, cursePower: 0.014, statusDamagePct: 0.12, statusDamageCap: 0.48 }),
    item('nanites_stark_prime', 'NANITES STARK PRIME', '+14% dano, +18% cadencia y deteccion de sigilo.', 19000, 5, 'Mythic', 'armor', 'stark', { damagePct: 0.14, fireRatePct: 0.18, detectStealth: true }),

    item('gema_poder', 'GEMA DEL PODER', '+30% dano total y +15% contra jefes.', 36000, 6, 'Secret', 'artifact', 'cosmic', { damagePct: 0.3, bossDamagePct: 0.15 }),
    item('necroespada', 'NECROESPADA', 'Maldice, castiga jefes y destruye enemigos ya malditos.', 52000, 6, 'Secret', 'weapon', 'asgard', { damagePct: 0.26, curseChance: 0.42, curseDuration: 6, cursePower: 0.016, damageToCursedPct: 0.35, bossDamagePct: 0.18 }),
    item('corazon_multiverso', 'CORAZON MULTIVERSAL', '+20% alcance, +8% critico, +55% dano critico y +20% a larga distancia.', 56000, 6, 'Secret', 'artifact', 'mystic', { rangePct: 0.2, critChance: 8, critDamageBonus: 0.55, longRangeDamagePct: 0.2, longRangeThreshold: 170 }),
    item('guantelete_infinito', 'GUANTELETE DEL INFINITO', '+32% dano, dos rebotes y +12% dano por estado activo.', 65000, 6, 'Secret', 'weapon', 'cosmic', { damagePct: 0.32, chainCount: 2, chainRange: 120, chainFactor: 0.55, statusDamagePct: 0.12, statusDamageCap: 0.5 })
];

const ordered = Object.fromEntries(items.map((entry) => [entry.id, entry]));
fs.writeFileSync(outputPath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
console.log(`Objetos rebalanceados: ${items.length}`);
