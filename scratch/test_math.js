var state = {
    onHand: { orbs: 20, flames: 0, crystals: 0, stars: 0 },
    completedGoals: {},
    selectedGoals: { "scroll_plenty": true },
    pieLevel: 0,
    bountyEnabled: false
};

var TARGETS_DATA = [
    { id: "scroll_plenty", name: "Scroll of Plenty", category: "Scrolls", cost: { orbs: 0, flames: 50, crystals: 10, stars: 0 } }
];

var CREATURES_DATA = {
    netherling: { orbCost: 1, flameCost: 0, crystalCost: 0, starCost: 0, dropType: "flames", baseDrops: { 1: 3, 2: 5, 3: 7 } },
    demon: { orbCost: 3, flameCost: 10, crystalCost: 0, starCost: 0, dropType: "crystals", baseDrops: { 1: 2, 2: 3, 3: 4 } },
    mountain: { orbCost: 0, flameCost: 0, crystalCost: 12, starCost: 0, dropType: "stars", baseDrops: { 1: 1, 2: 2 } }
};

function getCreatureDrop(creatureKey) {
    var creature = CREATURES_DATA[creatureKey];
    var currentLevel = 1;
    var baseDrop = creature.baseDrops[currentLevel];
    var pieBonus = state.pieLevel;
    var bountyBonus = state.bountyEnabled ? 1 : 0;
    return baseDrop + pieBonus + bountyBonus;
}

function calculateCosts() {
    var targetOrbs = 0;
    var targetFlames = 0;
    var targetCrystals = 0;
    var targetStars = 0;

    for (var i = 0; i < TARGETS_DATA.length; i++) {
        var goal = TARGETS_DATA[i];
        if (state.selectedGoals[goal.id] && !state.completedGoals[goal.id]) {
            targetOrbs += goal.cost.orbs;
            targetFlames += goal.cost.flames;
            targetCrystals += goal.cost.crystals;
            targetStars += goal.cost.stars;
        }
    }

    var drops = {
        netherling: getCreatureDrop("netherling"),
        demon: getCreatureDrop("demon"),
        mountain: getCreatureDrop("mountain")
    };

    var initialStarDeficit = Math.max(0, targetStars - state.onHand.stars);
    var mountainsToSummon = 0;
    var mountainCrystalsCost = 0;
    if (initialStarDeficit > 0) {
        mountainsToSummon = Math.ceil(initialStarDeficit / drops.mountain);
        mountainCrystalsCost = mountainsToSummon * CREATURES_DATA.mountain.crystalCost;
    }

    var totalCrystalsNeeded = targetCrystals + mountainCrystalsCost;
    var initialCrystalDeficit = Math.max(0, totalCrystalsNeeded - state.onHand.crystals);
    var demonsToSummon = 0;
    var demonFlamesCost = 0;
    var demonOrbsCost = 0;
    if (initialCrystalDeficit > 0) {
        demonsToSummon = Math.ceil(initialCrystalDeficit / drops.demon);
        demonFlamesCost = demonsToSummon * CREATURES_DATA.demon.flameCost;
        demonOrbsCost = demonsToSummon * CREATURES_DATA.demon.orbCost;
    }

    var totalFlamesNeeded = targetFlames + demonFlamesCost;
    var initialFlameDeficit = Math.max(0, totalFlamesNeeded - state.onHand.flames);
    var netherlingsToSummon = 0;
    var netherlingOrbsCost = 0;
    if (initialFlameDeficit > 0) {
        netherlingsToSummon = Math.ceil(initialFlameDeficit / drops.netherling);
        netherlingOrbsCost = netherlingsToSummon * CREATURES_DATA.netherling.orbCost;
    }

    var totalOrbsNeeded = targetOrbs + demonOrbsCost + netherlingOrbsCost;
    var initialOrbDeficit = Math.max(0, totalOrbsNeeded - state.onHand.orbs);

    return {
        summons: { netherling: netherlingsToSummon, demon: demonsToSummon, mountain: mountainsToSummon },
        deficits: { orbs: initialOrbDeficit, flames: initialFlameDeficit, crystals: initialCrystalDeficit, stars: initialStarDeficit }
    };
}

var results = calculateCosts();
WScript.Echo("Netherlings: " + results.summons.netherling);
WScript.Echo("Demons: " + results.summons.demon);
WScript.Echo("Mountains: " + results.summons.mountain);
WScript.Echo("Orb Deficit: " + results.deficits.orbs);
