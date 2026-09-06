var state = {
    onHand: { orbs: 20, flames: 0, crystals: 0, stars: 0 },
    completedGoals: {},
    selectedGoals: { "scroll_plenty": true },
    pieLevel: 0,
    bountyEnabled: false,
    shinySkins: { netherling: false, demon: false, mountain: false },
    transientGoal: {
        active: false,
        collapsed: true,
        cost: { orbs: 0, flames: 0, crystals: 0, stars: 0 },
        creatures: { netherling: 0, demon: 0, mountain: 0 }
    },
    customGoals: []
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
    var pieBonus = state.pieLevel || 0;
    var bountyBonus = state.bountyEnabled ? 1 : 0;
    var shinyBonus = (state.shinySkins && state.shinySkins[creatureKey]) ? 3 : 0;
    return baseDrop + pieBonus + bountyBonus + shinyBonus;
}

function calculateCosts() {
    var targetOrbs = 0;
    var targetFlames = 0;
    var targetCrystals = 0;
    var targetStars = 0;
    var targetNetherlings = 0;
    var targetDemons = 0;
    var targetMountains = 0;

    // Standard goals
    for (var i = 0; i < TARGETS_DATA.length; i++) {
        var goal = TARGETS_DATA[i];
        if (state.selectedGoals[goal.id] && !state.completedGoals[goal.id]) {
            targetOrbs += goal.cost.orbs || 0;
            targetFlames += goal.cost.flames || 0;
            targetCrystals += goal.cost.crystals || 0;
            targetStars += goal.cost.stars || 0;
        }
    }

    // Saved custom goals
    if (state.customGoals) {
        for (var j = 0; j < state.customGoals.length; j++) {
            var cg = state.customGoals[j];
            if (state.selectedGoals[cg.id] && !state.completedGoals[cg.id]) {
                if (cg.cost) {
                    targetOrbs += cg.cost.orbs || 0;
                    targetFlames += cg.cost.flames || 0;
                    targetCrystals += cg.cost.crystals || 0;
                    targetStars += cg.cost.stars || 0;
                }
                if (cg.creatures) {
                    var prog = (cg.trackProgress !== false && cg.progress) ? cg.progress : { netherling: 0, demon: 0, mountain: 0 };
                    targetNetherlings += Math.max(0, (cg.creatures.netherling || 0) - (prog.netherling || 0));
                    targetDemons += Math.max(0, (cg.creatures.demon || 0) - (prog.demon || 0));
                    targetMountains += Math.max(0, (cg.creatures.mountain || 0) - (prog.mountain || 0));
                }
            }
        }
    }

    // Transient goal
    if (state.transientGoal && state.transientGoal.active) {
        if (state.transientGoal.cost) {
            targetOrbs += state.transientGoal.cost.orbs || 0;
            targetFlames += state.transientGoal.cost.flames || 0;
            targetCrystals += state.transientGoal.cost.crystals || 0;
            targetStars += state.transientGoal.cost.stars || 0;
        }
        if (state.transientGoal.creatures) {
            var prog = (state.transientGoal.trackProgress !== false && state.transientGoal.progress) ? state.transientGoal.progress : { netherling: 0, demon: 0, mountain: 0 };
            targetNetherlings += Math.max(0, (state.transientGoal.creatures.netherling || 0) - (prog.netherling || 0));
            targetDemons += Math.max(0, (state.transientGoal.creatures.demon || 0) - (prog.demon || 0));
            targetMountains += Math.max(0, (state.transientGoal.creatures.mountain || 0) - (prog.mountain || 0));
        }
    }

    var drops = {
        netherling: getCreatureDrop("netherling"),
        demon: getCreatureDrop("demon"),
        mountain: getCreatureDrop("mountain")
    };

    // A. Stars -> Mountains
    var initialStarDeficit = Math.max(0, targetStars - state.onHand.stars);
    var mountainsForStars = initialStarDeficit > 0 ? Math.ceil(initialStarDeficit / drops.mountain) : 0;
    var mountainsToSummon = Math.max(targetMountains, mountainsForStars);
    var mountainCrystalsCost = mountainsToSummon * CREATURES_DATA.mountain.crystalCost;

    // B. Crystals -> Demons
    var totalCrystalsNeeded = targetCrystals + mountainCrystalsCost;
    var initialCrystalDeficit = Math.max(0, totalCrystalsNeeded - state.onHand.crystals);
    var demonsForCrystals = initialCrystalDeficit > 0 ? Math.ceil(initialCrystalDeficit / drops.demon) : 0;
    var demonsToSummon = Math.max(targetDemons, demonsForCrystals);
    var demonFlamesCost = demonsToSummon * CREATURES_DATA.demon.flameCost;
    var demonOrbsCost = demonsToSummon * CREATURES_DATA.demon.orbCost;

    // C. Flames -> Netherlings
    var totalFlamesNeeded = targetFlames + demonFlamesCost;
    var initialFlameDeficit = Math.max(0, totalFlamesNeeded - state.onHand.flames);
    var netherlingsForFlames = initialFlameDeficit > 0 ? Math.ceil(initialFlameDeficit / drops.netherling) : 0;
    var netherlingsToSummon = Math.max(targetNetherlings, netherlingsForFlames);
    var netherlingOrbsCost = netherlingsToSummon * CREATURES_DATA.netherling.orbCost;

    // D. Orbs
    var totalOrbsNeeded = targetOrbs + demonOrbsCost + netherlingOrbsCost;
    var initialOrbDeficit = Math.max(0, totalOrbsNeeded - state.onHand.orbs);

    return {
        targetResources: { orbs: targetOrbs, flames: targetFlames, crystals: targetCrystals, stars: targetStars },
        targetCreatures: { netherling: targetNetherlings, demon: targetDemons, mountain: targetMountains },
        summons: { netherling: netherlingsToSummon, demon: demonsToSummon, mountain: mountainsToSummon },
        deficits: { orbs: initialOrbDeficit, flames: initialFlameDeficit, crystals: initialCrystalDeficit, stars: initialStarDeficit }
    };
}

function assert(condition, message) {
    if (!condition) {
        WScript.Echo("FAIL: " + message);
        WScript.Quit(1);
    } else {
        WScript.Echo("PASS: " + message);
    }
}

// Test 1: Original baseline Scroll of Plenty
var res1 = calculateCosts();
assert(res1.summons.netherling === 34, "Test 1: 34 Netherlings");
assert(res1.summons.demon === 5, "Test 1: 5 Demons");
assert(res1.summons.mountain === 0, "Test 1: 0 Mountains");
assert(res1.deficits.orbs === 29, "Test 1: Orb deficit is 29");

// Test 2: Custom pure creature goal (5 Mountains + 24 Netherlings) with empty inventory
state.selectedGoals = {};
state.onHand = { orbs: 0, flames: 0, crystals: 0, stars: 0 };
state.transientGoal.active = true;
state.transientGoal.creatures = { netherling: 24, demon: 0, mountain: 5 };
var res2 = calculateCosts();
assert(res2.summons.mountain === 5, "Test 2: 5 Mountains");
assert(res2.summons.demon === 30, "Test 2: 30 Demons");
assert(res2.summons.netherling === 100, "Test 2: 100 Netherlings (cascade covers 24 minimum)");
assert(res2.deficits.orbs === 190, "Test 2: 190 Orbs required");

// Test 3: Custom creature where minimum exceeds cascade (1 Mountain + 50 Netherlings)
state.transientGoal.creatures = { netherling: 50, demon: 0, mountain: 1 };
var res3 = calculateCosts();
assert(res3.summons.mountain === 1, "Test 3: 1 Mountain");
assert(res3.summons.demon === 6, "Test 3: 6 Demons");
assert(res3.summons.netherling === 50, "Test 3: 50 Netherlings (minimum requested exceeds 20 cascade)");
assert(res3.deficits.orbs === 68, "Test 3: 68 Orbs required");

// Test 4: Combined creature & resource goal (5 Mountains + 10 Stars)
state.transientGoal.creatures = { netherling: 0, demon: 0, mountain: 5 };
state.transientGoal.cost = { orbs: 0, flames: 0, crystals: 0, stars: 10 };
var res4 = calculateCosts();
assert(res4.summons.mountain === 10, "Test 4: 10 Mountains to satisfy 10 stars");
assert(res4.summons.demon === 60, "Test 4: 60 Demons");
assert(res4.summons.netherling === 200, "Test 4: 200 Netherlings");
assert(res4.deficits.orbs === 380, "Test 4: 380 Orbs required");

// Test 5: Saved custom goals aggregation with Transient goal
state.transientGoal.active = true;
state.transientGoal.cost = { orbs: 10, flames: 0, crystals: 0, stars: 0 };
state.transientGoal.creatures = { netherling: 5, demon: 1, mountain: 0 };
state.customGoals = [
    {
        id: "custom_1",
        name: "Goal 1",
        cost: { orbs: 5, flames: 0, crystals: 0, stars: 0 },
        creatures: { netherling: 10, demon: 2, mountain: 1 }
    }
];
state.selectedGoals["custom_1"] = true;
var res5 = calculateCosts();
assert(res5.targetCreatures.mountain === 1, "Test 5: Target mountains is 1");
assert(res5.targetCreatures.demon === 3, "Test 5: Target demons is 3");
assert(res5.targetCreatures.netherling === 15, "Test 5: Target netherlings is 15");
assert(res5.summons.mountain === 1, "Test 5: Mountain summons is 1");
assert(res5.summons.demon === 6, "Test 5: Demon summons is 6");
assert(res5.summons.netherling === 20, "Test 5: Netherling summons is 20");
assert(res5.deficits.orbs === 53, "Test 5: Total orb deficit is 53");

// Test 6: Shiny Skin standalone drops (+3 yield per creature)
state.shinySkins = { netherling: true, demon: true, mountain: true };
assert(getCreatureDrop("netherling") === 6, "Test 6: Netherling Lvl 1 drop with Shiny Skin is 3 + 3 = 6");
assert(getCreatureDrop("demon") === 5, "Test 6: Demon Lvl 1 drop with Shiny Skin is 2 + 3 = 5");
assert(getCreatureDrop("mountain") === 4, "Test 6: Mountain Lvl 1 drop with Shiny Skin is 1 + 3 = 4");

// Test 7: Cascade calculation with Shiny Skins enabled on Scroll of Plenty
// Target: 50 flames, 10 crystals. OnHand: 20 orbs.
// Demons: need 10 crystals. Demon drop = 5. Demons needed = 2.
// Demon cost: 2 * 10 = 20 flames, 2 * 3 = 6 orbs.
// Flames total needed: 50 + 20 = 70. Netherling drop = 6. Netherlings needed = ceil(70 / 6) = 12.
// Netherling orb cost: 12 * 1 = 12 orbs.
// Total orbs needed: 6 + 12 = 18 orbs.
// OnHand orbs = 20, so orb deficit is 0! (versus 29 without shiny skins)
state.selectedGoals = { "scroll_plenty": true };
state.customGoals = [];
state.transientGoal.active = false;
state.onHand = { orbs: 20, flames: 0, crystals: 0, stars: 0 };
var res7 = calculateCosts();
assert(res7.summons.demon === 2, "Test 7: 2 Demons with shiny skin (yield 5 crystals each)");
assert(res7.summons.netherling === 12, "Test 7: 12 Netherlings with shiny skin (yield 6 flames each)");
// Test 8: Custom goal creature progress tracking
// Goal: 5 Mountains. Without progress: 5 Mountains.
// With progress = 2 Mountains summoned: remaining Mountains is 3.
state.shinySkins = { netherling: false, demon: false, mountain: false };
state.selectedGoals = { "custom_prog_test": true };
state.customGoals = [
    {
        id: "custom_prog_test",
        name: "5 Mountains Goal",
        cost: { orbs: 0, flames: 0, crystals: 0, stars: 0 },
        creatures: { netherling: 0, demon: 0, mountain: 5 },
        trackProgress: true,
        progress: { netherling: 0, demon: 0, mountain: 2 }
    }
];
state.onHand = { orbs: 0, flames: 0, crystals: 0, stars: 0 };
var res8 = calculateCosts();
assert(res8.targetCreatures.mountain === 3, "Test 8: Remaining target mountains is 5 - 2 = 3");
assert(res8.summons.mountain === 3, "Test 8: Mountains to summon is 3");
assert(res8.summons.demon === 18, "Test 8: Demons to summon is 18 (3 * 12 / 2)");
assert(res8.summons.netherling === 60, "Test 8: Netherlings to summon is 60 (18 * 10 / 3)");
// Test 9: Quick Target creature progress tracking
// Quick Target: 4 Demons, 2 Mountains.
// TrackProgress: true. Progress: 1 Demon, 1 Mountain.
// Remaining target: 3 Demons, 1 Mountain.
state.selectedGoals = {};
state.customGoals = [];
state.transientGoal = {
    active: true,
    trackProgress: true,
    cost: { orbs: 0, flames: 0, crystals: 0, stars: 0 },
    creatures: { netherling: 0, demon: 4, mountain: 2 },
    progress: { netherling: 0, demon: 1, mountain: 1 }
};
state.onHand = { orbs: 0, flames: 0, crystals: 0, stars: 0 };
var res9 = calculateCosts();
assert(res9.targetCreatures.demon === 3, "Test 9: Remaining target demons is 4 - 1 = 3");
assert(res9.targetCreatures.mountain === 1, "Test 9: Remaining target mountains is 2 - 1 = 1");
assert(res9.summons.mountain === 1, "Test 9: Mountain summons is 1");
assert(res9.summons.demon === 6, "Test 9: Demons to summon is 6 (covers 12 crystals for 1 mountain and 3 target demons)");

WScript.Echo("ALL TESTS PASSED SUCCESSFULLY!");


