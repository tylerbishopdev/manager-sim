import type { Fighter, FightRound, FightRoundEvent, FightOutcome, FightResult, FightEarnings, ScheduledFight, InjuryStatus } from '../types/gameplay';

// ── Commentary templates ─────────────────────────────────

const STRIKE_HIT = [
  '{attacker} lands a CRISP jab!',
  '{attacker} connects with a heavy right hand!',
  '{attacker} throws a spinning back fist — IT LANDS!',
  '{attacker} lights up {defender} with a combo!',
  '{attacker} snaps {defender}\'s head back with an uppercut!',
  '{attacker} lands a body shot that echoes through the arena!',
];

const STRIKE_MISS = [
  '{attacker} swings wild and misses!',
  '{defender} slips the punch beautifully!',
  '{attacker} throws leather but hits nothing but air!',
  '{defender} makes {attacker} look silly with the head movement!',
];

const GRAPPLE_SUCCESS = [
  '{attacker} scores a HUGE takedown!',
  '{attacker} drags {defender} to the mat!',
  '{attacker} gets the clinch and trips {defender}!',
  '{attacker} shoots in — double leg! They\'re on the ground!',
];

const GRAPPLE_FAIL = [
  '{attacker} shoots for a takedown — STUFFED!',
  '{defender} sprawls and stays on their feet!',
  '{attacker} can\'t get the clinch, {defender} shrugs it off!',
];

const KO_LINES = [
  '{attacker} DROPS {defender}! IT\'S ALL OVER!',
  'TIMBER! {defender} goes down like a sack of potatoes!',
  '{attacker} puts {defender}\'s lights OUT! What a shot!',
  'OH! {defender} is STIFF! The ref waves it off!',
];

const SUB_LINES = [
  '{attacker} sinks in the choke! {defender} taps!',
  '{attacker} locks up the armbar — {defender} has no choice but to tap!',
  'Triangle choke by {attacker}! {defender} is going to sleep!',
];

const TAUNT_LINES = [
  '{attacker} does a little dance. The crowd loves it.',
  '{attacker} points at the camera and winks.',
  '{attacker} flexes after landing that combo.',
  '{attacker} trash-talks {defender}. Bold strategy.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, attacker: string, defender: string): string {
  return template.replace(/\{attacker\}/g, attacker).replace(/\{defender\}/g, defender);
}

// ── Round Simulation ─────────────────────────────────────

function simulateRound(
  f1: Fighter, f2: Fighter,
  f1Hp: number, f2Hp: number,
  roundNum: number,
): FightRound {
  const events: FightRoundEvent[] = [];
  let f1Score = 0;
  let f2Score = 0;

  // Conditioning decay over rounds
  const f1Stamina = Math.max(0.5, 1 - (roundNum - 1) * (0.15 - f1.stats.conditioning * 0.01));
  const f2Stamina = Math.max(0.5, 1 - (roundNum - 1) * (0.15 - f2.stats.conditioning * 0.01));

  // Morale factor
  const f1Morale = 0.8 + (f1.morale / 100) * 0.4;
  const f2Morale = 0.8 + (f2.morale / 100) * 0.4;

  // 4-6 exchanges per round
  const exchanges = 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < exchanges; i++) {
    // Decide who initiates
    const f1Initiative = (f1.stats.striking + f1.stats.grappling) * f1Stamina * f1Morale + Math.random() * 4;
    const f2Initiative = (f2.stats.striking + f2.stats.grappling) * f2Stamina * f2Morale + Math.random() * 4;
    const attackerIsF1 = f1Initiative >= f2Initiative;

    const attacker = attackerIsF1 ? f1 : f2;
    const defender = attackerIsF1 ? f2 : f1;
    const aStamina = attackerIsF1 ? f1Stamina : f2Stamina;
    const side = attackerIsF1 ? 'player' : 'opponent' as const;

    // Striking or grappling?
    const goesForGrapple = Math.random() < (attacker.stats.grappling / (attacker.stats.striking + attacker.stats.grappling));

    if (goesForGrapple) {
      const success = Math.random() < (attacker.stats.grappling * aStamina) / (attacker.stats.grappling + defender.stats.grappling + 2);
      if (success) {
        const dmg = (attacker.stats.grappling * 0.8 + Math.random() * 3) * aStamina;
        const mitigated = dmg * (1 - defender.stats.durability * 0.06);
        if (attackerIsF1) { f2Hp -= mitigated; f1Score += 2; }
        else { f1Hp -= mitigated; f2Score += 2; }
        events.push({ text: fillTemplate(pick(GRAPPLE_SUCCESS), attacker.name, defender.name), type: 'grapple', fighter: side });
      } else {
        events.push({ text: fillTemplate(pick(GRAPPLE_FAIL), attacker.name, defender.name), type: 'grapple', fighter: side });
        // Defender scores for stuffing
        if (attackerIsF1) f2Score += 1;
        else f1Score += 1;
      }
    } else {
      const hitChance = (attacker.stats.striking * aStamina) / (attacker.stats.striking + defender.stats.durability + 3);
      const lands = Math.random() < hitChance;
      if (lands) {
        const dmg = (attacker.stats.striking * 1.2 + Math.random() * 4) * aStamina;
        const mitigated = dmg * (1 - defender.stats.durability * 0.05);
        if (attackerIsF1) { f2Hp -= mitigated; f1Score += 2; }
        else { f1Hp -= mitigated; f2Score += 2; }
        events.push({ text: fillTemplate(pick(STRIKE_HIT), attacker.name, defender.name), type: 'strike', fighter: side });

        // Critical hit chance (KO)
        if (mitigated > 12 && Math.random() < 0.08) {
          if (attackerIsF1) f2Hp = 0;
          else f1Hp = 0;
          events.push({ text: fillTemplate(pick(KO_LINES), attacker.name, defender.name), type: 'knockout', fighter: side });
          break;
        }
      } else {
        events.push({ text: fillTemplate(pick(STRIKE_MISS), attacker.name, defender.name), type: 'strike', fighter: side });
      }
    }

    // Submission attempt if HP low and grappler
    if (attacker.stats.grappling >= 6 && ((attackerIsF1 ? f2Hp : f1Hp) < 30) && Math.random() < 0.15) {
      const subChance = attacker.stats.grappling / (attacker.stats.grappling + defender.stats.durability);
      if (Math.random() < subChance) {
        if (attackerIsF1) f2Hp = 0;
        else f1Hp = 0;
        events.push({ text: fillTemplate(pick(SUB_LINES), attacker.name, defender.name), type: 'submission', fighter: side });
        break;
      }
    }

    // Random taunt (5% chance)
    if (Math.random() < 0.05) {
      events.push({ text: fillTemplate(pick(TAUNT_LINES), attacker.name, defender.name), type: 'taunt', fighter: side });
    }

    // Early stoppage if HP critically low
    if (f1Hp <= 0 || f2Hp <= 0) break;
  }

  return {
    number: roundNum,
    events,
    f1HpEnd: Math.max(0, f1Hp),
    f2HpEnd: Math.max(0, f2Hp),
    f1Score,
    f2Score,
  };
}

// ── Full Fight Simulation ────────────────────────────────

export function simulateFight(fight: ScheduledFight, playerFighter: Fighter): FightOutcome {
  const f1 = playerFighter;
  const f2 = fight.opponent;
  const rounds: FightRound[] = [];
  let f1Hp = 100;
  let f2Hp = 100;
  let result: FightResult = 'decision';
  let finalRound = 3;

  for (let r = 1; r <= 3; r++) {
    const round = simulateRound(f1, f2, f1Hp, f2Hp, r);
    rounds.push(round);
    f1Hp = round.f1HpEnd;
    f2Hp = round.f2HpEnd;

    // Check for finish
    if (f2Hp <= 0) {
      const lastEvent = round.events[round.events.length - 1];
      result = lastEvent?.type === 'submission' ? 'submission' : 'ko';
      finalRound = r;
      break;
    }
    if (f1Hp <= 0) {
      const lastEvent = round.events[round.events.length - 1];
      result = lastEvent?.type === 'submission' ? 'submission' : 'ko';
      finalRound = r;
      break;
    }
  }

  // Decision
  const totalF1 = rounds.reduce((s, r) => s + r.f1Score, 0);
  const totalF2 = rounds.reduce((s, r) => s + r.f2Score, 0);
  const playerWon = f2Hp <= 0 || (f1Hp > 0 && totalF1 >= totalF2);

  if (f1Hp > 0 && f2Hp > 0) {
    result = totalF1 === totalF2 ? 'draw' : 'decision';
  }

  // Earnings calculation
  const won = playerWon;
  const earnings = calculateEarnings(fight, f1, won);

  // Injury roll
  const injuryRoll = Math.random();
  let injury: InjuryStatus = 'none';
  if (!won && injuryRoll < 0.3) injury = 'minor';
  if (!won && injuryRoll < 0.1) injury = 'major';
  if (won && injuryRoll < 0.1) injury = 'minor';

  // Fame/ranking change
  const fameGain = won
    ? fight.prestige * 3 + (fight.isMainEvent ? 10 : 0)
    : -(fight.prestige);
  const rankingChange = won ? -Math.ceil(fight.prestige / 3) : 2;

  return {
    fightId: fight.id,
    winnerId: playerWon ? f1.id : f2.id,
    loserId: playerWon ? f2.id : f1.id,
    result,
    rounds,
    finalRound,
    earnings,
    injuryToPlayer: injury,
    rankingChange,
    fameGain,
  };
}

function calculateEarnings(fight: ScheduledFight, fighter: Fighter, won: boolean): FightEarnings {
  const basePurse = fight.basePurse;
  const winBonus = won ? Math.floor(basePurse * 0.5) : 0;

  // PPV: only if main event
  const ppvBuys = fight.isMainEvent ? Math.floor(50000 + fighter.fame * 1000 + Math.random() * 20000) : 0;
  const ppvRevenue = Math.floor(ppvBuys * 50 * (fight.ppvPoints / 100)); // $50 per buy × fighter's points %

  // Ticket revenue
  const gateTotal = fight.prestige * 10000 + Math.floor(Math.random() * 20000);
  const ticketRevenue = Math.floor(gateTotal * (fight.ticketRevenueSplit / 100));

  // Sponsor bonuses
  const sponsorBonuses = won ? Math.floor(fight.prestige * 200) : 0;

  // Medical costs (higher if lost / injured)
  const medicalCosts = won ? rng(100, 500) : rng(500, 2000);

  const total = basePurse + winBonus + ppvRevenue + ticketRevenue + sponsorBonuses - medicalCosts;

  return { basePurse, winBonus, ppvRevenue, ticketRevenue, sponsorBonuses, medicalCosts, total };
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
