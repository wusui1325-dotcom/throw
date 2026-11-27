import { ICONS } from './icons.js?v=3.0';
import { sound } from './audio.js?v=3.0';

// ============================================================
// CONFIG & DATA DEFINITIONS
// ============================================================
const GRAVITY = 820;
const API_BASE = location.hostname === 'throw.wusper.com' ? '' : 'https://throw.wusper.com';
const SAVE_KEY = 'throw_autosave_v1';
let autoSaveAccum = 0;

function saveProgress() {
  if (!state || state.gameOver || state.collapsing || state.elapsed < 0.5) return;
  try {
    const payload = {
      v: 1,
      elapsed: state.elapsed,
      intensity: state.intensity,
      coins: state.coins,
      kills: state.kills,
      combo: state.combo,
      maxCombo: state.maxCombo,
      comboTimer: state.comboTimer,
      towerTier: state.towerTier,
      towerHp: state.towerHp,
      towerMaxHp: state.towerMaxHp,
      towerArmor: state.towerArmor,
      towerDents: state.towerDents,
      towerCracks: state.towerCracks,
      shieldTimer: state.shieldTimer,
      slowmoTimer: state.slowmoTimer,
      overdriveTimer: state.overdriveTimer,
      rushTimer: state.rushTimer,
      selectedProj: state.selectedProj,
      projectiles: state.projectiles,
      skills: state.skills,
      addons: state.addons,
      forge: state.forge,
      launcher: state.launcher,
      unlockedLaunchers: state.unlockedLaunchers,
      empTimer: state.empTimer,
      gameSpeed: state.gameSpeed,
      weatherIdx: state.weatherIdx,
      weatherTimer: state.weatherTimer,
      windX: state.windX,
      targetWindX: state.targetWindX,
      spawnTimer: state.spawnTimer,
      hasSpawnedAny: state.hasSpawnedAny,
      bossTimer: state.bossTimer,
      crateTimer: state.crateTimer,
      mines: state.mines,
      crates: state.crates,
      enemies: state.enemies.map((e) => ({
        id: e.id, type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
        armor: e.armor, speed: e.speed, damage: e.damage, stopX: e.stopX,
        stopped: e.stopped, attackTimer: e.attackTimer, windup: e.windup,
        fireRecoil: e.fireRecoil, bounty: e.bounty, burnTimer: e.burnTimer,
        burnDps: e.burnDps, freezeTimer: e.freezeTimer || 0, bobPhase: e.bobPhase,
        listAngle: e.listAngle, cracks: e.cracks, crew: e.crew, unmannedTimer: e.unmannedTimer,
        armorMod: e.armorMod || null, armorHp: e.armorHp || 0, empAmmo: !!e.empAmmo, missileAmmo: !!e.missileAmmo,
        autoTurrets: e.autoTurrets || [], deployed: !!e.deployed, subDepth: e.subDepth || 0,
      })),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

function clearProgress() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.v !== 1 || typeof d.elapsed !== 'number' || d.towerHp <= 0) return false;

    const base = createInitialState();
    Object.assign(base, {
      elapsed: d.elapsed,
      intensity: d.intensity || 1,
      coins: d.coins || 0,
      kills: d.kills || 0,
      combo: d.combo || 0,
      maxCombo: d.maxCombo || 0,
      comboTimer: d.comboTimer || 0,
      towerTier: clamp(d.towerTier || 0, 0, TOWER_TIERS.length - 1),
      towerHp: d.towerHp,
      towerMaxHp: d.towerMaxHp || TOWER_TIERS[d.towerTier || 0].maxHp,
      towerArmor: d.towerArmor ?? TOWER_TIERS[d.towerTier || 0].armor,
      towerDents: Array.isArray(d.towerDents) ? d.towerDents : [],
      towerCracks: Array.isArray(d.towerCracks) ? d.towerCracks : [],
      shieldTimer: d.shieldTimer || 0,
      slowmoTimer: d.slowmoTimer || 0,
      overdriveTimer: d.overdriveTimer || 0,
      rushTimer: d.rushTimer || 0,
      weatherIdx: clamp(d.weatherIdx || 0, 0, WEATHER_STATES.length - 1),
      weatherTimer: d.weatherTimer ?? 28,
      windX: d.windX || 0,
      targetWindX: d.targetWindX || 0,
      spawnTimer: d.spawnTimer ?? 1.2,
      hasSpawnedAny: !!d.hasSpawnedAny,
      bossTimer: d.bossTimer ?? 72,
      crateTimer: d.crateTimer ?? 16,
      mines: Array.isArray(d.mines) ? d.mines : [],
      crates: Array.isArray(d.crates) ? d.crates : [],
      hintDismissed: true,
    });

    // Merge saved projectiles, skills, addons & forge safely (forward-compatible with newly added items!)
    if (d.projectiles) {
      Object.keys(base.projectiles).forEach((k) => {
        if (d.projectiles[k]) Object.assign(base.projectiles[k], d.projectiles[k]);
      });
    }
    if (d.selectedProj && base.projectiles[d.selectedProj]?.unlocked) {
      base.selectedProj = d.selectedProj;
    }
    if (d.skills) {
      Object.keys(base.skills).forEach((k) => {
        if (d.skills[k]) Object.assign(base.skills[k], d.skills[k]);
      });
    }
    if (d.addons) {
      Object.keys(base.addons).forEach((k) => {
        if (typeof d.addons[k] === 'number') base.addons[k] = d.addons[k];
      });
    }
    if (d.forge) {
      Object.keys(base.forge).forEach((k) => {
        if (typeof d.forge[k] === 'number') base.forge[k] = d.forge[k];
      });
    }
    if (d.unlockedLaunchers) Object.assign(base.unlockedLaunchers, d.unlockedLaunchers);
    if (d.launcher && base.unlockedLaunchers[d.launcher]) base.launcher = d.launcher;
    base.empTimer = d.empTimer || 0;
    base.gameSpeed = d.gameSpeed === 3 ? 3 : 1;
    if (Array.isArray(d.enemies)) {
      base.enemies = d.enemies
        .filter((e) => e && ENEMY_TYPES[e.type])
        .map((e) => ({ ...e, cfg: ENEMY_TYPES[e.type], hitFlash: 0 }));
    }

    state = base;
    // Start in paused resume screen so enemies don't ambush immediately on refresh
    state.paused = true;
    dom.controlHint.classList.add('fade-out');
    dom.pauseModal.querySelector('h2').textContent = '已恢復上次進度';
    dom.pauseModal.querySelector('.modal-sub').textContent = `${TOWER_TIERS[state.towerTier].name} · Lv.${state.intensity} · ${formatTime(state.elapsed)} · ${state.coins}G`;
    dom.pauseModal.classList.remove('hidden');
    dom.pauseBtn.querySelector('.ico').innerHTML = ICONS.play;
    return true;
  } catch {
    return false;
  }
}

const TOWER_TIERS = [
  { id: 0, name: '木塔', maxHp: 110, armor: 0, cost: 0, color: '#332b24', debrisColor: '#a88c6c', desc: '基礎原木結構高塔，中彈易碎裂掉木塊。' },
  { id: 1, name: '石塔', maxHp: 195, armor: 2, cost: 90, color: '#2b3038', debrisColor: '#9aa4b2', desc: '厚實切石砌築，抗凹陷能力大幅提升。' },
  { id: 2, name: '木板混合石塔', maxHp: 300, armor: 4, cost: 170, color: '#312f2a', debrisColor: '#b5a895', desc: '石材核心外覆強化木板支撐，緩衝砲火衝擊。' },
  { id: 3, name: '鐵塔', maxHp: 440, armor: 7, cost: 280, color: '#232933', debrisColor: '#7b8798', desc: '鉚接熟鐵裝甲覆蓋，有效抵禦弓箭與輕砲。' },
  { id: 4, name: '框架鐵塔', maxHp: 620, armor: 10, cost: 430, color: '#1c222b', debrisColor: '#8d99ab', desc: '桁架式鋼鐵骨架分散衝擊力，結構穩固。' },
  { id: 5, name: '水泥塔', maxHp: 870, armor: 14, cost: 640, color: '#343a42', debrisColor: '#b8c0cc', desc: '一體澆築厚重混凝土堡壘，極難撼動。' },
  { id: 6, name: '鐵架水泥塔', maxHp: 1190, armor: 19, cost: 920, color: '#2c333d', debrisColor: '#c4cbd6', desc: '混凝土主體搭配外部鐵架補強，防線升級。' },
  { id: 7, name: '鋼塔', maxHp: 1590, armor: 25, cost: 1300, color: '#1e252f', debrisColor: '#d0d7e2', desc: '流線型精鋼裝甲塔身，大幅減免敵艦衝擊。' },
  { id: 8, name: '鋼筋水泥塔', maxHp: 2180, armor: 34, cost: 1850, color: '#242c36', debrisColor: '#e2e8f0', desc: '複合鋼筋混凝土要塞，屹立於無盡狂潮。' },
  { id: 9, name: '鈦合金塔', maxHp: 3100, armor: 46, cost: 2700, color: '#28313d', debrisColor: '#cbd5e1', desc: '航太級鈦合金外殼，極高韌性大幅抵抗重砲凹陷。' },
  { id: 10, name: '複合裝甲堡壘', maxHp: 4400, armor: 62, cost: 3900, color: '#1d242e', debrisColor: '#e2e8f0', desc: '多層反應裝甲結構，正面硬扛導彈與旗艦齊射。' },
  { id: 11, name: '碳纖維骨架塔', maxHp: 6200, armor: 82, cost: 5600, color: '#161b22', debrisColor: '#94a3b8', desc: '超輕高強碳纖網格骨架，將衝擊力均勻導入海崖。' },
  { id: 12, name: '電磁力場塔', maxHp: 8800, armor: 108, cost: 8000, color: '#182433', debrisColor: '#a5f3fc', desc: '內建高能偏折線圈，極大削弱實體砲彈與衝擊動能。' },
  { id: 13, name: '黑曜岩要塞', maxHp: 12500, armor: 140, cost: 11500, color: '#111419', debrisColor: '#cbd5e1', desc: '高密度黑曜岩鑄造巨碑，彷彿不可撼動的海防山峰。' },
  { id: 14, name: '星際光棱巨塔', maxHp: 18000, armor: 185, cost: 16500, color: '#1d2838', debrisColor: '#ffffff', desc: '流線光棱終極堡壘，為無盡後期狂潮而生的神話防線。' },
];

const LAUNCHER_DEFS = [
  { id: 'catapult', name: '木製投石車', icon: 'launcher_catapult', cost: 0, dmgMult: 1.0, speedMult: 1.0, gravMult: 1.0, windMult: 1.0, extraShots: 0, desc: '經典海岸投石機，操作平衡、手感純粹。' },
  { id: 'trebuchet', name: '重型配重巨弩', icon: 'launcher_trebuchet', cost: 240, dmgMult: 1.32, speedMult: 1.15, gravMult: 0.95, windMult: 0.85, extraShots: 0, desc: '配重槓桿大幅強化動能，傷害 +32%、初速更快。' },
  { id: 'twin', name: '雙臂連發投石機', icon: 'launcher_twin', cost: 520, dmgMult: 1.12, speedMult: 1.08, gravMult: 0.95, windMult: 0.85, extraShots: 1, desc: '雙臂同步拋射，每次投擲額外附帶 1 發高速副彈！' },
  { id: 'cannon', name: '蒸汽加農砲', icon: 'launcher_cannon', cost: 920, dmgMult: 1.48, speedMult: 1.28, gravMult: 0.72, windMult: 0.45, extraShots: 0, desc: '低伸高速重砲彈道，下墜幅度大幅降低且無懼強風。' },
  { id: 'railgun', name: '電磁軌道投射器', icon: 'launcher_railgun', cost: 1650, dmgMult: 1.75, speedMult: 1.45, gravMult: 0.55, windMult: 0.1, extraShots: 0, desc: '近乎直線的超高初速軌道彈道，幾乎完全無視風偏與重力。' },
  { id: 'tricannon', name: '三聯艦砲塔', icon: 'launcher_tricannon', cost: 2900, dmgMult: 1.55, speedMult: 1.32, gravMult: 0.68, windMult: 0.3, extraShots: 2, desc: '終極三管齊射砲塔，單次投擲同時轟出 3 發主彈藥！' },
];

const PROJECTILE_DEFS = [
  {
    id: 'stone',
    name: '石頭',
    short: '石頭',
    icon: 'proj_stone',
    key: '1',
    unlockCost: 0,
    upgradeBase: 75,
    reload: 0.5,
    maxCharges: 1,
    damage: 25,
    radius: 10,
    desc: '初始無限石塊。每 0.5 秒充能 1 顆，上限 1 顆；命中船體會依動能碎裂、滾壓船員或砸穿船底。',
  },
  {
    id: 'triple',
    name: '三連石',
    short: '三連石',
    icon: 'proj_triple',
    key: '2',
    unlockCost: 95,
    upgradeBase: 110,
    reload: 0.85,
    maxCharges: 2,
    damage: 18,
    radius: 8,
    desc: '單次發射 3 塊散射石頭，易觸發多重甲板滾壓與碎石橫掃。',
  },
  {
    id: 'bomb',
    name: '炸彈',
    short: '炸彈',
    icon: 'proj_bomb',
    key: '3',
    unlockCost: 175,
    upgradeBase: 140,
    reload: 1.25,
    maxCharges: 2,
    damage: 56,
    aoe: 114,
    radius: 13,
    desc: '命中或落水引爆，造成大範圍高爆發結構破壞與震盪波。',
  },
  {
    id: 'spike',
    name: '刺球',
    short: '刺球',
    icon: 'proj_spike',
    key: '4',
    unlockCost: 240,
    upgradeBase: 165,
    reload: 1.0,
    maxCharges: 2,
    damage: 44,
    pierce: 3,
    radius: 12,
    desc: '重型破甲刺球，極易貫穿船底直接引發斷裂沉船。',
  },
  {
    id: 'fire',
    name: '火球',
    short: '火球',
    icon: 'proj_fire',
    key: '5',
    unlockCost: 310,
    upgradeBase: 185,
    reload: 1.15,
    maxCharges: 2,
    damage: 38,
    aoe: 94,
    burnDps: 15,
    burnDur: 4.5,
    radius: 12,
    desc: '烈焰投擲物，濺射並點燃敵船甲板與船帆造成持續灼燒。',
  },
  {
    id: 'chain',
    name: '鎖鏈彈',
    short: '鎖鏈彈',
    icon: 'proj_chain',
    key: '6',
    unlockCost: 390,
    upgradeBase: 210,
    reload: 1.1,
    maxCharges: 2,
    damage: 34,
    pierce: 4,
    radius: 22,
    desc: '旋轉雙鐵球鎖鏈，橫掃範圍極廣，專克高空瞭望台與密集船員。',
  },
  {
    id: 'cluster',
    name: '集束彈',
    short: '集束彈',
    icon: 'proj_cluster',
    key: '7',
    unlockCost: 480,
    upgradeBase: 240,
    reload: 1.45,
    maxCharges: 2,
    damage: 32,
    aoe: 72,
    radius: 13,
    desc: '飛越最高點下落時自動於半空分裂成 5 顆破片炸彈覆蓋海面。',
  },
  {
    id: 'frost',
    name: '冰霜巨石',
    short: '冰霜石',
    icon: 'proj_frost',
    key: '8',
    unlockCost: 560,
    upgradeBase: 260,
    reload: 1.35,
    maxCharges: 2,
    damage: 40,
    aoe: 118,
    freezeDur: 4.2,
    radius: 13,
    desc: '極寒巨石，命中爆發冰霧凍結範圍內敵艦 4.2 秒，中斷所有砲擊。',
  },
];

const SKILL_DEFS = [
  {
    id: 'repair',
    name: '修復塔',
    short: '修復',
    icon: 'skill_repair',
    cost: 65,
    cooldown: 4,
    targeted: false,
    desc: '修補高塔結構裂縫與凹陷，恢復約 35% 結構強度。',
  },
  {
    id: 'arrows',
    name: '區域箭雨',
    short: '箭雨',
    icon: 'skill_arrows',
    cost: 90,
    cooldown: 5,
    targeted: true,
    targetType: 'air',
    desc: '拖曳或點擊指定區域，降下 28 支高速流線箭矢清空甲板船員。',
  },
  {
    id: 'shield',
    name: '5秒盾',
    short: '5秒盾',
    icon: 'skill_shield',
    cost: 110,
    cooldown: 8,
    targeted: false,
    desc: '展開 5 秒無敵幾何力場護盾，彈開一切砲火與衝撞。',
  },
  {
    id: 'meteor',
    name: '區域火球',
    short: '火雨',
    icon: 'skill_meteor',
    cost: 150,
    cooldown: 7,
    targeted: true,
    targetType: 'air',
    desc: '拖曳或點擊指定區域，召喚 7 顆毀滅火球轟炸並點燃敵艦。',
  },
  {
    id: 'mine',
    name: '水雷',
    short: '水雷',
    icon: 'skill_mine',
    cost: 75,
    cooldown: 2,
    targeted: true,
    targetType: 'sea',
    desc: '拖曳或點擊投放至海面，敵船觸碰立即從船底炸裂沉沒。',
  },
  {
    id: 'wave',
    name: '巨浪衝擊',
    short: '巨浪',
    icon: 'skill_wave',
    cost: 135,
    cooldown: 9,
    targeted: false,
    desc: '自高塔掀起巨型海嘯浪牆向右橫掃，大幅擊退敵艦並清空空中砲彈。',
  },
  {
    id: 'lightning',
    name: '雷霆審判',
    short: '落雷',
    icon: 'skill_lightning',
    cost: 125,
    cooldown: 5,
    targeted: true,
    targetType: 'air',
    desc: '拖曳或點擊指定目標海域降下高壓落雷（暴風雨天氣傷害額外 +50%）。',
  },
  {
    id: 'slowmo',
    name: '時間緩速',
    short: '緩速',
    icon: 'skill_slowmo',
    cost: 140,
    cooldown: 11,
    targeted: false,
    desc: '未來 6 秒內所有敵艦、砲手與飛來砲彈速度降至 30%，從容反擊。',
  },
];

const ADDON_DEFS = [
  {
    id: 'ballista',
    name: '自動連弩',
    icon: 'addon_ballista',
    baseCost: 140,
    maxLv: 15,
    desc: '架設於塔身中層的自動弩砲，持續點射逼近的海盜船員與輕舟。',
  },
  {
    id: 'aa',
    name: '防空攔截網',
    icon: 'addon_aa',
    baseCost: 180,
    maxLv: 15,
    desc: '自動擊落來襲的敵方砲彈、弓箭與空投炸彈，並對海盜飛艇開火。',
  },
  {
    id: 'magnet',
    name: '金幣磁石',
    icon: 'addon_magnet',
    baseCost: 120,
    maxLv: 10,
    desc: '自動吸附戰場掉落的實體金幣，並額外提升金幣收益倍率。',
  },
  {
    id: 'repairbot',
    name: '自動修復工匠',
    icon: 'addon_repairbot',
    baseCost: 160,
    maxLv: 15,
    desc: '駐守塔內的機械工匠，持續修補高塔結構裂縫與砲彈凹陷。',
  },
  {
    id: 'mortar',
    name: '岸防迫擊砲',
    icon: 'addon_mortar',
    baseCost: 230,
    maxLv: 15,
    desc: '架設於塔身中段的自動迫擊砲，定時朝遠處敵艦發射高拋重砲。',
  },
  {
    id: 'stabilizer',
    name: '風力穩定器',
    icon: 'addon_stabilizer',
    baseCost: 150,
    maxLv: 8,
    desc: '大幅抵消強側風對投石彈道的干擾（滿級完全無視風偏）。',
  },
];

const FORGE_DEFS = [
  {
    id: 'power',
    name: '重型絞盤',
    icon: 'forge_power',
    baseCost: 110,
    maxLv: 999999,
    desc: '強化投石機扭力，永久提升所有投擲物破壞力（每級 +14%）。',
  },
  {
    id: 'reload',
    name: '快速裝填軸',
    icon: 'forge_reload',
    baseCost: 130,
    maxLv: 999999,
    desc: '優化拋射裝填機構，縮短所有投擲物充能時間（每級 -8%）。',
  },
  {
    id: 'greed',
    name: '海盜懸賞令',
    icon: 'forge_greed',
    baseCost: 125,
    maxLv: 999999,
    desc: '擊倒海盜與擊沉敵艦獲得更多懸賞金幣（每級 +15%）。',
  },
  {
    id: 'plating',
    name: '吸能複合護板',
    icon: 'forge_plating',
    baseCost: 145,
    maxLv: 999999,
    desc: '吸收敵軍砲彈動能，減少高塔凹陷與結構損耗（每級減傷 9%）。',
  },
];

const WEATHER_STATES = [
  { id: 'clear', name: '晴夜', icon: 'weather_clear', wind: 0, waveAmp: 4.5, rain: 0, mist: 0 },
  { id: 'mist', name: '海霧', icon: 'weather_mist', wind: -38, waveAmp: 6.5, rain: 0, mist: 0.42 },
  { id: 'wind', name: '強側風', icon: 'weather_wind', wind: -115, waveAmp: 9.5, rain: 0, mist: 0.12 },
  { id: 'storm', name: '暴風雨', icon: 'weather_storm', wind: -145, waveAmp: 14.5, rain: 1.0, mist: 0.28 },
];

const ENEMY_TYPES = {
  skiff: {
    name: '海盜輕舟', minLv: 1, hp: 36, armor: 0, speed: 68, damage: 10, attackCd: 5.0,
    width: 80, height: 24, bounty: 15, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [{ ox: 4, oy: -20, gunner: true }],
    turrets: [{ ox: -18, oy: -22, scale: 0.85 }],
  },
  archer: {
    name: '弓手砲艇', minLv: 1, hp: 50, armor: 0, speed: 54, damage: 9, attackCd: 5.0,
    width: 96, height: 30, bounty: 22, ranged: true, projType: 'arrow', air: false,
    crewSlots: [{ ox: 28, oy: -42, gunner: true }, { ox: -4, oy: -78, gunner: false }],
    turrets: [{ ox: -22, oy: -28, scale: 0.9 }, { ox: 18, oy: -42, scale: 0.8 }],
  },
  cannon: {
    name: '雙砲加農艦', minLv: 2, hp: 88, armor: 3, speed: 44, damage: 18, attackCd: 5.0,
    width: 114, height: 34, bounty: 38, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [{ ox: -12, oy: -32, gunner: true }, { ox: 34, oy: -46, gunner: true }],
    turrets: [{ ox: -36, oy: -40, scale: 1.05 }, { ox: 22, oy: -46, scale: 0.95 }],
  },
  rammer: {
    name: '鐵甲重砲艦', minLv: 3, hp: 142, armor: 8, speed: 56, damage: 22, attackCd: 5.0,
    width: 118, height: 38, bounty: 50, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [{ ox: -20, oy: -40, gunner: true }, { ox: 24, oy: -38, gunner: true }],
    turrets: [{ ox: -32, oy: -40, scale: 1.1 }, { ox: 6, oy: -48, scale: 1.0 }],
  },
  catapult: {
    name: '海盜投石砲艦', minLv: 3, hp: 112, armor: 4, speed: 38, damage: 24, attackCd: 5.0,
    width: 122, height: 36, bounty: 56, ranged: true, projType: 'boulder', air: false,
    crewSlots: [{ ox: -32, oy: -42, gunner: true }, { ox: 34, oy: -46, gunner: true }],
    turrets: [{ ox: -42, oy: -42, scale: 1.0 }, { ox: 22, oy: -46, scale: 1.0 }],
  },
  zeppelin: {
    name: '武裝飛艇', minLv: 4, hp: 98, armor: 2, speed: 50, damage: 20, attackCd: 5.0,
    width: 120, height: 48, bounty: 62, ranged: true, projType: 'airbomb', air: true,
    crewSlots: [{ ox: 0, oy: 12, gunner: true }],
    turrets: [{ ox: -24, oy: 16, scale: 0.95 }, { ox: 18, oy: 16, scale: 0.85 }],
  },
  fireship: {
    name: '烈焰火藥舟', minLv: 2, hp: 28, armor: 0, speed: 78, damage: 24, attackCd: 5.0,
    width: 82, height: 24, bounty: 28, ranged: true, projType: 'cannonball', air: false, explosive: true,
    crewSlots: [{ ox: 18, oy: -22, gunner: true }],
    turrets: [{ ox: -16, oy: -22, scale: 0.85 }],
  },
  suicideYacht: {
    name: '自爆突擊遊艇', minLv: 2, hp: 32, armor: 0, speed: 122, damage: 46, attackCd: 5.0,
    width: 72, height: 20, bounty: 32, ranged: false, air: false, kamikaze: true, explosive: true,
    crewSlots: [{ ox: 12, oy: -20, gunner: false }],
    turrets: [],
  },
  gunship: {
    name: '砲艇直升機', minLv: 3, hp: 82, armor: 2, speed: 78, damage: 18, attackCd: 5.0,
    width: 96, height: 34, bounty: 58, ranged: true, projType: 'cannonball', air: true, heli: true,
    crewSlots: [{ ox: -12, oy: 4, gunner: true }],
    turrets: [{ ox: -28, oy: 12, scale: 0.9 }],
  },
  miniTurretBoat: {
    name: '單人砲台小艇', minLv: 999, hp: 28, armor: 0, speed: 72, damage: 11, attackCd: 5.0,
    width: 58, height: 18, bounty: 16, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [{ ox: 8, oy: -18, gunner: true }],
    turrets: [{ ox: -12, oy: -18, scale: 0.78 }],
  },
  carrier: {
    name: '海盜運兵母艦', minLv: 4, hp: 210, armor: 8, speed: 32, damage: 20, attackCd: 5.0,
    width: 152, height: 42, bounty: 92, ranged: true, projType: 'cannonball', air: false, carrier: true,
    crewSlots: [{ ox: -42, oy: -46, gunner: true }, { ox: 42, oy: -52, gunner: true }],
    turrets: [{ ox: -56, oy: -46, scale: 1.0 }, { ox: 28, oy: -52, scale: 0.95 }],
  },
  missileDestroyer: {
    name: '導彈驅逐艦', minLv: 5, hp: 195, armor: 10, speed: 44, damage: 30, attackCd: 5.0,
    width: 138, height: 38, bounty: 98, ranged: true, projType: 'missile', air: false,
    crewSlots: [{ ox: -28, oy: -42, gunner: true }, { ox: 32, oy: -48, gunner: true }],
    turrets: [{ ox: -46, oy: -42, scale: 1.05 }, { ox: 14, oy: -48, scale: 1.0 }],
  },
  sub: {
    name: '幽靈潛艇', minLv: 3, hp: 92, armor: 5, speed: 58, damage: 20, attackCd: 5.0,
    width: 112, height: 26, bounty: 54, ranged: true, projType: 'cannonball', air: false, stealthSub: true,
    crewSlots: [{ ox: 4, oy: -42, gunner: true }],
    turrets: [{ ox: -22, oy: -28, scale: 0.95 }, { ox: 26, oy: -28, scale: 0.85 }],
  },
  catamaran: {
    name: '雙體巨砲艦', minLv: 4, hp: 165, armor: 7, speed: 36, damage: 24, attackCd: 5.0,
    width: 136, height: 42, bounty: 78, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [{ ox: -36, oy: -42, gunner: true }, { ox: 0, oy: -54, gunner: true }, { ox: 36, oy: -42, gunner: false }],
    turrets: [{ ox: -44, oy: -42, scale: 1.05 }, { ox: -8, oy: -54, scale: 1.05 }, { ox: 24, oy: -42, scale: 0.95 }],
  },
  dreadnought: {
    name: '無畏黑帆旗艦', minLv: 5, hp: 330, armor: 12, speed: 28, damage: 32, attackCd: 5.0,
    width: 176, height: 50, bounty: 160, ranged: true, projType: 'cannonball', air: false,
    crewSlots: [
      { ox: -54, oy: -62, gunner: true },
      { ox: -6, oy: -46, gunner: true },
      { ox: 54, oy: -70, gunner: true },
      { ox: 12, oy: -118, gunner: false },
    ],
    turrets: [
      { ox: -68, oy: -62, scale: 1.2 },
      { ox: -18, oy: -46, scale: 1.15 },
      { ox: 40, oy: -70, scale: 1.15 },
    ],
    boss: true,
  },
};

// Returns deck Y offset (relative to ship.y) at horizontal offset ox
function getShipDeckY(type, cfg, ox) {
  const w = cfg.width;
  const h = cfg.height;
  if (type === 'skiff') {
    const t = clamp(ox / (w * 0.5), -1, 1);
    return -h + 4 - (t * t) * 10; // Crescent U-shaped deck
  }
  if (type === 'archer') {
    return ox > 10 ? -h - 12 : -h + 2; // Raised stern castle
  }
  if (type === 'cannon') {
    if (ox < -28) return -h - 6; // Raised bow gunwale
    if (ox > 18) return -h - 12; // Raised quarterdeck
    return -h + 2;
  }
  if (type === 'rammer') {
    const t = clamp(ox / (w * 0.45), -1, 1);
    return -h - 10 + (t * t) * 14; // Domed turtleback armor
  }
  if (type === 'catapult') {
    if (ox < -18) return -h - 6;
    if (ox > 18) return -h - 10;
    return -h + 2;
  }
  if (type === 'fireship') {
    const t = clamp(ox / (w * 0.5), -1, 1);
    return -h + 4 - (t * t) * 8;
  }
  if (type === 'sub') {
    return Math.abs(ox) < 18 ? -h - 16 : -h - 2; // Raised conning tower in center
  }
  if (type === 'catamaran') {
    return Math.abs(ox) < 22 ? -h - 12 : -h; // Elevated central bridge
  }
  if (type === 'dreadnought') {
    if (ox < -36) return -h - 12; // High forecastle
    if (ox > 32) return -h - 20;  // Towering stern castle
    return -h + 4;                // Deep waist deck
  }
  return -h + 4;
}

// ============================================================
// DOM & RESPONSIVE LAYOUT (DESKTOP + MOBILE PORTRAIT)
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const dom = {
  projectileDock: document.getElementById('projectileDock'),
  skillDock: document.getElementById('skillDock'),
  towerPill: document.getElementById('towerPill'),
  towerTierIcon: document.getElementById('towerTierIcon'),
  towerTierBadge: document.getElementById('towerTierBadge'),
  coinText: document.getElementById('coinText'),
  intensityText: document.getElementById('intensityText'),
  weatherIcon: document.getElementById('weatherIcon'),
  weatherText: document.getElementById('weatherText'),
  timeText: document.getElementById('timeText'),
  killText: document.getElementById('killText'),
  speedBtn: document.getElementById('speedBtn'),
  speedText: document.getElementById('speedText'),
  empBanner: document.getElementById('empBanner'),
  empTimerText: document.getElementById('empTimerText'),
  shopBtn: document.getElementById('shopBtn'),
  leaderboardBtn: document.getElementById('leaderboardBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  soundBtn: document.getElementById('soundBtn'),
  comboBanner: document.getElementById('comboBanner'),
  comboText: document.getElementById('comboText'),
  comboFill: document.getElementById('comboFill'),
  rushBanner: document.getElementById('rushBanner'),
  rushFill: document.getElementById('rushFill'),
  shieldBanner: document.getElementById('shieldBanner'),
  shieldTimerText: document.getElementById('shieldTimerText'),
  targetHint: document.getElementById('targetHint'),
  targetHintText: document.getElementById('targetHintText'),
  cancelTargetBtn: document.getElementById('cancelTargetBtn'),
  controlHint: document.getElementById('controlHint'),
  skillDragGhost: document.getElementById('skillDragGhost'),
  shopModal: document.getElementById('shopModal'),
  shopCoinText: document.getElementById('shopCoinText'),
  shopBody: document.getElementById('shopBody'),
  closeShopBtn: document.getElementById('closeShopBtn'),
  leaderboardModal: document.getElementById('leaderboardModal'),
  lbBody: document.getElementById('lbBody'),
  closeLbBtn: document.getElementById('closeLbBtn'),
  pauseModal: document.getElementById('pauseModal'),
  resumeBtn: document.getElementById('resumeBtn'),
  pauseRestartBtn: document.getElementById('pauseRestartBtn'),
  gameOverModal: document.getElementById('gameOverModal'),
  finalTime: document.getElementById('finalTime'),
  finalIntensity: document.getElementById('finalIntensity'),
  finalKills: document.getElementById('finalKills'),
  finalCombo: document.getElementById('finalCombo'),
  playerNameInput: document.getElementById('playerNameInput'),
  submitScoreBtn: document.getElementById('submitScoreBtn'),
  submitStatus: document.getElementById('submitStatus'),
  restartBtn: document.getElementById('restartBtn'),
  goLbBtn: document.getElementById('goLbBtn'),
};

let L = {
  isPortrait: false,
  worldW: 1280,
  worldH: 720,
  seaY: 560,
  towerX: 138,
  towerW: 92,
  towerTopY: 334,
  catapultX: 144,
  catapultY: 322,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

let cachedSkyGrad = null;
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, vh);
  cachedSkyGrad.addColorStop(0, '#090b0f');
  cachedSkyGrad.addColorStop(0.55, '#141922');
  cachedSkyGrad.addColorStop(0.78, '#1e2530');
  cachedSkyGrad.addColorStop(1, '#0c1016');

  const isPortrait = vh > vw * 1.05;
  L.isPortrait = isPortrait;

  if (isPortrait) {
    // Edge-to-edge ergonomic vertical battlefield (zero tiny letterboxing!)
    L.worldW = 760;
    L.scale = vw / L.worldW;
    L.worldH = vh / L.scale;
    L.offsetX = 0;
    L.offsetY = 0;
    L.seaY = Math.round(L.worldH * 0.68);
    L.towerX = 86;
    L.towerW = 76;
    L.towerTopY = L.seaY - 196;
  } else {
    L.worldW = 1280;
    L.worldH = 720;
    L.scale = Math.min(vw / L.worldW, vh / L.worldH);
    L.offsetX = (vw - L.worldW * L.scale) * 0.5;
    L.offsetY = (vh - L.worldH * L.scale) * 0.5;
    L.seaY = 560;
    L.towerX = 138;
    L.towerW = 92;
    L.towerTopY = 334;
  }
  L.catapultX = L.towerX + 6;
  L.catapultY = L.towerTopY - 12;

  if (state && state.enemies) {
    const towerEdge = L.towerX + L.towerW * 0.5;
    const span = Math.max(180, L.worldW - towerEdge);
    const minS = towerEdge + span * 0.15;
    const maxS = L.worldW - span * 0.15;
    state.enemies.forEach((e) => {
      e.stopX = clamp(e.stopX, minS, maxS);
      if (e.stopped) e.x = clamp(e.x, minS, maxS);
      if (e.cfg.air) e.y = clamp(e.y, 90, L.seaY - 160);
    });
  }
}

function screenToWorld(clientX, clientY) {
  return {
    x: (clientX - L.offsetX) / L.scale,
    y: (clientY - L.offsetY) / L.scale,
  };
}

function hydrateStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const key = el.getAttribute('data-icon');
    if (ICONS[key]) el.innerHTML = ICONS[key];
  });
}

// ============================================================
// GAME STATE
// ============================================================
let state = null;
let shopTab = 'tower';

function createInitialState() {
  const projectiles = {};
  PROJECTILE_DEFS.forEach((def) => {
    projectiles[def.id] = {
      unlocked: def.id === 'stone',
      level: 1,
      charges: def.id === 'stone' ? 1 : def.maxCharges,
      timer: 0,
    };
  });

  const skills = {};
  SKILL_DEFS.forEach((def) => {
    skills[def.id] = { count: 0, cd: 0 };
  });

  const addons = { ballista: 0, aa: 0, magnet: 0, repairbot: 0, mortar: 0, stabilizer: 0 };
  const forge = { power: 0, reload: 0, greed: 0, plating: 0 };

  return {
    elapsed: 0,
    intensity: 1,
    coins: 0,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    towerTier: 0,
    towerHp: TOWER_TIERS[0].maxHp,
    towerMaxHp: TOWER_TIERS[0].maxHp,
    towerArmor: TOWER_TIERS[0].armor,
    towerDents: [],
    towerCracks: [],
    collapsing: false,
    collapseTimer: 0,
    collapseBlocks: [],
    shieldTimer: 0,
    selectedProj: 'stone',
    projectiles,
    skills,
    addons,
    forge,
    launcher: 'catapult',
    unlockedLaunchers: { catapult: true },
    empTimer: 0,
    gameSpeed: 1,
    plumes: [],
    wreckage: [],
    ballistaTimer: 0,
    aaTimer: 0,
    mortarTimer: 0,
    repairTick: 0,
    slowmoTimer: 0,
    waves: [],
    lightningBolts: [],
    // Weather
    weatherIdx: 0,
    weatherTimer: 28,
    windX: 0,
    targetWindX: 0,
    lightningFlash: 0,
    rainDrops: Array.from({ length: 70 }, () => ({ x: Math.random() * 1400, y: Math.random() * 1000, len: 14 + Math.random() * 14 })),
    stars: Array.from({ length: 48 }, () => ({
      x: Math.random(), y: Math.random() * 0.52, r: 0.7 + Math.random() * 1.4, phase: Math.random() * Math.PI * 2,
    })),
    birds: Array.from({ length: 4 }, (_, i) => ({
      x: 200 + i * 280, y: 85 + i * 32, vx: -18 - i * 4, phase: i * 1.4,
    })),
    crates: [],
    crateTimer: 16,
    overdriveTimer: 0,
    ripples: [],
    shootingStars: [],
    shootingStarTimer: 4.5,
    // Entities
    enemies: [],
    sinking: [],
    ragdolls: [],
    playerProjs: [],
    rollingStones: [],
    enemyProjs: [],
    mines: [],
    coinDrops: [],
    debris: [],
    particles: [],
    popups: [],
    rainArrows: [],
    tracers: [],
    // Spawning & Rush
    spawnTimer: 1.0,
    hasSpawnedAny: false,
    rushTimer: 0,
    rushMax: 3.5,
    bossTimer: 72,
    // UI state
    shopOpen: false,
    lbOpen: false,
    paused: false,
    gameOver: false,
    scoreSubmitted: false,
    shake: 0,
    towerFlash: 0,
    catapultRecoil: 0,
    hintDismissed: false,
    // Aiming
    aiming: false,
    aimStartX: 0,
    aimStartY: 0,
    aimCurrX: 0,
    aimCurrY: 0,
    aimVx: 0,
    aimVy: 0,
    activeTargetSkill: null,
    draggingSkill: null,
    pointerWorldX: L.worldW * 0.55,
    pointerWorldY: L.seaY - 20,
  };
}

// ============================================================
// HELPERS & EFFECTS
// ============================================================
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function getWaveY(x) {
  const w = WEATHER_STATES[state.weatherIdx];
  return L.seaY + Math.sin(x * 0.017 - state.elapsed * 2.5) * w.waveAmp;
}
function getComboMultiplier() {
  if (state.combo < 2) return 1;
  return Math.min(3.0, 1 + Math.floor(state.combo / 2) * 0.2);
}
function registerComboHit() {
  state.combo += 1;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  state.comboTimer = 5.5;
}
function resetCombo() {
  state.combo = 0;
  state.comboTimer = 0;
}
function addPopup(x, y, text, color = '#ffffff', size = 14) {
  state.popups.push({ x, y, text, color, size, life: 1.0, maxLife: 1.0, vy: -44 });
}
function spawnParticles(x, y, count, opts = {}) {
  const { color = '#ffffff', speed = 160, gravity = 380, size = 3, life = 0.65, spread = Math.PI * 2, angle = -Math.PI / 2 } = opts;
  if (state.particles.length > 220) state.particles.splice(0, state.particles.length - 180);
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const sp = speed * (0.35 + Math.random() * 0.85);
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      gravity, size: size * (0.6 + Math.random() * 0.8), color,
      life: life * (0.65 + Math.random() * 0.55), maxLife: life,
    });
  }
}
function spawnDebris(x, y, count, color, vxBias = 60) {
  if (state.debris.length > 60) state.debris.splice(0, state.debris.length - 45);
  for (let i = 0; i < count; i++) {
    state.debris.push({
      x, y,
      vx: vxBias + (Math.random() - 0.5) * 200,
      vy: -90 - Math.random() * 190,
      w: 5 + Math.random() * 7,
      h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 11,
      color,
      life: 1.6,
    });
  }
}
function spawnWaterSplash(x, power = 1) {
  const sy = getWaveY(x);
  if (state.ripples.length > 24) state.ripples.shift();
  state.ripples.push({ x, y: sy + 4, r: 6, maxR: 26 + 22 * power, life: 0.75, maxLife: 0.75 });
  if (power >= 0.8 && state.plumes.length < 16) {
    state.plumes.push({ x, y: sy + 4, h: 10, maxH: 28 + 34 * power, w: 6 + 6 * power, life: 0.46, maxLife: 0.46 });
  }
  spawnParticles(x, sy, Math.round(10 * power), {
    color: 'rgba(255,255,255,0.85)', speed: 155 * power, gravity: 480,
    size: 3.1, life: 0.6, spread: Math.PI * 0.65, angle: -Math.PI / 2,
  });
  sound.playSplash();
}
function spawnExplosion(x, y, radius, isFire = false) {
  state.shake = Math.min(18, state.shake + (isFire ? 7 : 10));
  sound.playExplosion();
  state.particles.push({
    type: 'ring', x, y, r: 10, maxR: radius,
    color: isFire ? '#ff9f43' : '#ffffff', life: 0.34, maxLife: 0.34,
  });
  spawnParticles(x, y, isFire ? 24 : 20, {
    color: isFire ? '#ffb142' : '#ffffff', speed: 240, gravity: 220, size: 3.8, life: 0.65,
  });
}
function spawnCoinBurst(x, y, totalCoins) {
  const magnetMult = [1, 1.2, 1.45, 1.75][state.addons.magnet] || 1;
  const greedMult = 1 + (state.forge.greed || 0) * 0.15;
  const finalAmount = Math.max(1, Math.round(totalCoins * getComboMultiplier() * magnetMult * greedMult));
  const pieces = clamp(Math.ceil(finalAmount / 12), 2, 7);
  const perPiece = Math.floor(finalAmount / pieces);
  let rem = finalAmount - perPiece * pieces;

  for (let i = 0; i < pieces; i++) {
    const val = perPiece + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    state.coinDrops.push({
      x, y,
      vx: (Math.random() - 0.5) * 170,
      vy: -160 - Math.random() * 140,
      val,
      life: 0,
      spin: Math.random() * Math.PI * 2,
    });
  }
  addPopup(x, y - 24, `+${finalAmount}G`, '#ffeaa7', 15);
}
function spawnRagdoll(x, y, vx, vy) {
  state.ragdolls.push({
    x, y, vx, vy,
    rot: 0,
    vrot: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 8),
    life: 2.0,
  });
}

// ============================================================
// HUD, SHOP & GLOBAL LEADERBOARD UI
// ============================================================
function renderProjectileDock() {
  dom.projectileDock.innerHTML = '';
  PROJECTILE_DEFS.forEach((def) => {
    const ps = state.projectiles[def.id];
    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    if (state.selectedProj === def.id) btn.classList.add('active');
    if (!ps.unlocked) btn.classList.add('locked');

    btn.innerHTML = `
      <span class="ico">${ICONS[def.icon]}</span>
      <span class="dock-meta">
        <span class="dock-name">${def.short}</span>
        <span class="dock-sub">${ps.unlocked ? `${ps.charges}/${def.maxCharges}` : `${def.unlockCost}G`}</span>
      </span>
      <span class="dock-key">${def.key}</span>
      <span class="dock-cooldown" style="width:0%"></span>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!ps.unlocked) { openShop('projectile'); return; }
      state.selectedProj = def.id;
      updateDockDisplays();
    });
    btn.dataset.projId = def.id;
    dom.projectileDock.appendChild(btn);
  });
}

function renderSkillDock() {
  dom.skillDock.innerHTML = '';
  SKILL_DEFS.forEach((def) => {
    const ss = state.skills[def.id];
    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    if (ss.count <= 0) btn.classList.add('empty');

    btn.innerHTML = `
      <span class="ico">${ICONS[def.icon]}</span>
      <span class="dock-meta">
        <span class="dock-name">${def.short}</span>
        <span class="dock-sub">${ss.count > 0 ? `×${ss.count}` : '未購買'}</span>
      </span>
      <span class="dock-cooldown" style="width:0%"></span>
    `;

    let sx = 0, sy = 0, mode = 'tap'; // 'tap' | 'scroll' | 'drag'
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sound.init();
      if (state.gameOver || state.collapsing || state.paused || state.shopOpen || state.lbOpen) return;

      sx = e.clientX; sy = e.clientY; mode = 'tap';
      const canDragSkill = ss.count > 0 && ss.cd <= 0;

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        dom.skillDragGhost.classList.add('hidden');
      };

      const onCancel = () => {
        cleanup();
        state.draggingSkill = null;
      };

      const onMove = (ev) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        const dist = Math.hypot(dx, dy);

        if (mode === 'tap' && dist > 9) {
          // Determine whether user is scrolling the dock or dragging a skill onto the battlefield
          const draggingIntoField = L.isPortrait
            ? (dy < -10 && Math.abs(dy) > Math.abs(dx))
            : (dx < -10 && Math.abs(dx) > Math.abs(dy));

          if (canDragSkill && draggingIntoField) {
            mode = 'drag';
            state.draggingSkill = def.id;
            state.activeTargetSkill = null;
            dom.skillDragGhost.innerHTML = `<span class="ico">${ICONS[def.icon]}</span>`;
            dom.skillDragGhost.classList.remove('hidden');
          } else {
            mode = 'scroll';
          }
        }

        if (mode === 'drag') {
          const wp = screenToWorld(ev.clientX, ev.clientY);
          state.pointerWorldX = wp.x;
          state.pointerWorldY = wp.y;
          dom.skillDragGhost.style.left = `${ev.clientX}px`;
          dom.skillDragGhost.style.top = `${ev.clientY}px`;
        }
      };

      const onUp = (ev) => {
        cleanup();
        if (mode === 'scroll') return; // User was scrolling the skill dock — do not open shop or cast!

        if (mode === 'drag') {
          const wp = screenToWorld(ev.clientX, ev.clientY);
          state.draggingSkill = null;
          const droppedOnField = L.isPortrait ? ev.clientY < window.innerHeight - 74 : ev.clientX < window.innerWidth - 70;
          if (droppedOnField || !def.targeted) castSkill(def.id, wp.x, wp.y);
          return;
        }

        // Clean tap/click
        if (ss.count <= 0) {
          openShop('skill');
          return;
        }
        if (ss.cd > 0) return;

        if (!def.targeted) {
          castSkill(def.id, L.towerX, L.towerTopY);
        } else if (state.activeTargetSkill === def.id) {
          cancelSkillTargeting();
        } else {
          state.activeTargetSkill = def.id;
          dom.targetHintText.textContent = `點擊戰場施放「${def.name}」`;
          dom.targetHint.classList.remove('hidden');
          updateDockDisplays();
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    });

    btn.dataset.skillId = def.id;
    dom.skillDock.appendChild(btn);
  });
}

function updateDockDisplays() {
  dom.projectileDock.querySelectorAll('.dock-btn').forEach((btn) => {
    const id = btn.dataset.projId;
    const def = PROJECTILE_DEFS.find((d) => d.id === id);
    const ps = state.projectiles[id];
    btn.classList.toggle('active', state.selectedProj === id);
    btn.classList.toggle('locked', !ps.unlocked);
    const sub = btn.querySelector('.dock-sub');
    const bar = btn.querySelector('.dock-cooldown');
    if (ps.unlocked) {
      sub.textContent = `${ps.charges}/${def.maxCharges}`;
      bar.style.width = `${ps.charges >= def.maxCharges ? 100 : Math.floor((ps.timer / getEffectiveReload(def)) * 100)}%`;
    } else {
      sub.textContent = `${def.unlockCost}G`;
      bar.style.width = '0%';
    }
  });

  dom.skillDock.querySelectorAll('.dock-btn').forEach((btn) => {
    const id = btn.dataset.skillId;
    const def = SKILL_DEFS.find((d) => d.id === id);
    const ss = state.skills[id];
    btn.classList.toggle('empty', ss.count <= 0);
    btn.classList.toggle('targeting', state.activeTargetSkill === id);
    const sub = btn.querySelector('.dock-sub');
    const bar = btn.querySelector('.dock-cooldown');
    if (ss.cd > 0) {
      sub.textContent = `${ss.cd.toFixed(1)}s`;
      bar.style.width = `${Math.floor((ss.cd / def.cooldown) * 100)}%`;
    } else {
      sub.textContent = ss.count > 0 ? `×${ss.count}` : '未購買';
      bar.style.width = '0%';
    }
  });
}

function updateHud() {
  const tier = TOWER_TIERS[state.towerTier];
  const dmgRatio = 1 - clamp(state.towerHp / state.towerMaxHp, 0, 1);
  dom.towerTierBadge.textContent = tier.name;
  dom.towerTierIcon.innerHTML = ICONS[`tower_${state.towerTier}`];
  dom.towerPill.classList.toggle('danger', dmgRatio > 0.65);

  dom.coinText.textContent = state.coins;
  dom.shopCoinText.textContent = state.coins;
  dom.intensityText.textContent = `Lv.${state.intensity}`;
  dom.timeText.textContent = formatTime(state.elapsed);
  dom.killText.textContent = state.kills;

  const w = WEATHER_STATES[state.weatherIdx];
  const windArrow = state.windX < -20 ? ' ←' : state.windX > 20 ? ' →' : '';
  dom.weatherIcon.innerHTML = ICONS[w.icon];
  dom.weatherText.textContent = `${w.name}${windArrow}`;

  if (state.combo >= 2 && state.comboTimer > 0) {
    dom.comboBanner.classList.remove('hidden');
    dom.comboText.textContent = `${state.combo} 連擊 · 金幣 ×${getComboMultiplier().toFixed(1)}`;
    dom.comboFill.style.width = `${(state.comboTimer / 5.5) * 100}%`;
  } else {
    dom.comboBanner.classList.add('hidden');
  }

  if (state.rushTimer > 0) {
    dom.rushBanner.classList.remove('hidden');
    dom.rushFill.style.width = `${(state.rushTimer / state.rushMax) * 100}%`;
  } else {
    dom.rushBanner.classList.add('hidden');
  }

  if (state.shieldTimer > 0) {
    dom.shieldBanner.classList.remove('hidden');
    dom.shieldTimerText.textContent = `護盾 ${state.shieldTimer.toFixed(1)}s`;
  } else {
    dom.shieldBanner.classList.add('hidden');
  }
  if (state.empTimer > 0) {
    dom.empBanner.classList.remove('hidden');
    dom.empTimerText.textContent = `EMP 癱瘓掛件 ${state.empTimer.toFixed(1)}s`;
  } else {
    dom.empBanner.classList.add('hidden');
  }
  dom.speedText.textContent = `${state.gameSpeed}×`;
  dom.speedBtn.classList.toggle('speed-on', state.gameSpeed === 3);

  updateDockDisplays();
}

// ============================================================
// SHOP (PAUSES TIME)
// ============================================================
function openShop(tab = shopTab) {
  if (state.gameOver || state.collapsing) return;
  shopTab = tab;
  state.shopOpen = true;
  cancelSkillTargeting();
  dom.shopModal.classList.remove('hidden');
  document.querySelectorAll('.shop-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === shopTab));
  renderShopBody();
  updateHud();
}

function closeShop() {
  state.shopOpen = false;
  dom.shopModal.classList.add('hidden');
  saveProgress();
}

function getProjectileDamage(def, level) {
  const forgePower = 1 + ((state && state.forge ? state.forge.power : 0) * 0.14);
  const lMult = getActiveLauncher().dmgMult;
  return Math.round(def.damage * (1 + (level - 1) * 0.28) * forgePower * lMult);
}
function getEffectiveReload(def) {
  const forgeReload = Math.max(0.55, 1 - ((state && state.forge ? state.forge.reload : 0) * 0.08));
  const overdrive = (state && state.overdriveTimer > 0) ? 0.5 : 1.0;
  return def.reload * forgeReload * overdrive;
}
function getActiveLauncher() {
  const id = (state && state.launcher) ? state.launcher : 'catapult';
  return LAUNCHER_DEFS.find((l) => l.id === id) || LAUNCHER_DEFS[0];
}
function getEffectiveGravity() {
  return GRAVITY * getActiveLauncher().gravMult;
}
function getEffectiveWind() {
  const stab = (state && state.addons ? state.addons.stabilizer : 0);
  const empDisabled = state && state.empTimer > 0;
  const stabMult = empDisabled ? 1 : Math.max(0, 1 - stab * 0.125);
  return state.windX * stabMult * getActiveLauncher().windMult;
}

function renderShopBody() {
  dom.shopBody.innerHTML = '';

  if (shopTab === 'tower') {
    TOWER_TIERS.forEach((tier) => {
      const isCurrent = state.towerTier === tier.id;
      const isOwned = state.towerTier > tier.id;
      const isNext = state.towerTier + 1 === tier.id;
      const lockedFuture = tier.id > state.towerTier + 1;

      const card = document.createElement('div');
      card.className = 'shop-card';
      if (isCurrent) card.classList.add('owned-current');
      if (lockedFuture) card.classList.add('dimmed');

      let btnHtml = '';
      if (isCurrent) {
        btnHtml = `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>目前塔樓</span></button>`;
      } else if (isOwned) {
        btnHtml = `<button class="buy-btn" disabled><span class="ico">${ICONS.check}</span><span>已超越</span></button>`;
      } else if (isNext) {
        btnHtml = `<button class="buy-btn" ${state.coins >= tier.cost ? '' : 'disabled'} data-buy-tower="${tier.id}">
          <span class="ico">${ICONS.upgrade}</span><span>升級加固 · ${tier.cost}G</span></button>`;
      } else {
        btnHtml = `<button class="buy-btn" disabled><span class="ico">${ICONS.lock}</span><span>需先升級前一階 · ${tier.cost}G</span></button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[`tower_${tier.id}`]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${tier.name} <span class="card-tag">T${tier.id + 1}</span></div></div>
        </div>
        <p class="card-desc">${tier.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">結構強度 ★${tier.id + 1}</span>
          <span class="card-stat-chip">護甲抗性 +${tier.armor}</span>
        </div>
        ${btnHtml}
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-buy-tower]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextId = Number(btn.dataset.buyTower);
        const tier = TOWER_TIERS[nextId];
        if (!tier || state.towerTier + 1 !== nextId || state.coins < tier.cost) return;
        state.coins -= tier.cost;
        const hpGain = tier.maxHp - state.towerMaxHp;
        state.towerTier = nextId;
        state.towerMaxHp = tier.maxHp;
        state.towerArmor = tier.armor;
        state.towerHp = Math.min(state.towerMaxHp, state.towerHp + hpGain + Math.round(tier.maxHp * 0.25));
        state.towerDents = [];
        state.towerCracks = [];
        sound.playBuy();
        spawnParticles(L.towerX, L.towerTopY + 60, 24, { color: '#ffffff', speed: 180, life: 0.75 });
        addPopup(L.towerX, L.towerTopY - 30, `加固完成：${tier.name}`, '#ffffff', 16);
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'projectile') {
    PROJECTILE_DEFS.forEach((def) => {
      const ps = state.projectiles[def.id];
      const upgCost = Math.round(def.upgradeBase * Math.pow(1.65, ps.level - 1));
      const maxLv = 999999;
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (state.selectedProj === def.id) card.classList.add('owned-current');

      let btnHtml = '';
      if (!ps.unlocked) {
        btnHtml = `<button class="buy-btn" ${state.coins >= def.unlockCost ? '' : 'disabled'} data-unlock-proj="${def.id}">
          <span class="ico">${ICONS.coin}</span><span>解鎖購買 · ${def.unlockCost}G</span></button>`;
      } else if (ps.level < maxLv) {
        btnHtml = `<button class="buy-btn" ${state.coins >= upgCost ? '' : 'disabled'} data-upg-proj="${def.id}">
          <span class="ico">${ICONS.upgrade}</span><span>強化動能 Lv.${ps.level + 1} · ${upgCost}G</span></button>`;
      } else {
        btnHtml = `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>已達滿級</span></button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">${ps.unlocked ? `Lv.${ps.level}` : '未解鎖'}</span></div></div>
        </div>
        <p class="card-desc">${def.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">充能 ${def.reload}s</span>
          <span class="card-stat-chip">上限 ${def.maxCharges}</span>
        </div>
        ${btnHtml}
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-unlock-proj]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.unlockProj;
        const def = PROJECTILE_DEFS.find((d) => d.id === id);
        const ps = state.projectiles[id];
        if (!def || ps.unlocked || state.coins < def.unlockCost) return;
        state.coins -= def.unlockCost;
        ps.unlocked = true;
        ps.charges = def.maxCharges;
        state.selectedProj = id;
        sound.playBuy();
        renderShopBody();
        updateHud();
      });
    });

    dom.shopBody.querySelectorAll('[data-upg-proj]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.upgProj;
        const def = PROJECTILE_DEFS.find((d) => d.id === id);
        const ps = state.projectiles[id];
        const upgCost = Math.round(def.upgradeBase * Math.pow(1.65, ps.level - 1));
        if (!def || !ps.unlocked || ps.level >= 999999 || state.coins < upgCost) return;
        state.coins -= upgCost;
        ps.level += 1;
        sound.playBuy();
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'skill') {
    SKILL_DEFS.forEach((def) => {
      const ss = state.skills[def.id];
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (ss.count > 0) card.classList.add('owned-current');

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">庫存 ×${ss.count}</span></div></div>
        </div>
        <p class="card-desc">${def.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">冷卻 ${def.cooldown}s</span>
          <span class="card-stat-chip">${def.targeted ? '拖拽 / 點擊施放' : '點擊即刻發動'}</span>
        </div>
        <button class="buy-btn" ${state.coins >= def.cost ? '' : 'disabled'} data-buy-skill="${def.id}">
          <span class="ico">${ICONS.coin}</span><span>購買 1 次 · ${def.cost}G</span>
        </button>
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-buy-skill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buySkill;
        const def = SKILL_DEFS.find((d) => d.id === id);
        if (!def || state.coins < def.cost) return;
        state.coins -= def.cost;
        state.skills[id].count += 1;
        sound.playBuy();
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'addon') {
    ADDON_DEFS.forEach((def) => {
      const lv = state.addons[def.id];
      const cost = Math.round(def.baseCost * Math.pow(1.75, lv));
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (lv > 0) card.classList.add('owned-current');

      const btnHtml = lv >= def.maxLv
        ? `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>已達滿級</span></button>`
        : `<button class="buy-btn" ${state.coins >= cost ? '' : 'disabled'} data-buy-addon="${def.id}">
            <span class="ico">${ICONS.upgrade}</span><span>${lv === 0 ? '安裝掛件' : `升級 Lv.${lv + 1}`} · ${cost}G</span></button>`;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">${lv > 0 ? `Lv.${lv}${def.maxLv > 999 ? ' ∞' : '/' + def.maxLv}` : '未安裝'}</span></div></div>
        </div>
        <p class="card-desc">${def.desc}</p>
        ${btnHtml}
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-buy-addon]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buyAddon;
        const def = ADDON_DEFS.find((d) => d.id === id);
        const lv = state.addons[id];
        const cost = Math.round(def.baseCost * Math.pow(1.75, lv));
        if (!def || lv >= def.maxLv || state.coins < cost) return;
        state.coins -= cost;
        state.addons[id] += 1;
        sound.playBuy();
        addPopup(L.towerX, L.towerTopY - 26, `已裝備：${def.name}`, '#ffffff', 15);
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'launcher') {
    LAUNCHER_DEFS.forEach((def) => {
      const unlocked = !!state.unlockedLaunchers[def.id];
      const equipped = state.launcher === def.id;
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (equipped) card.classList.add('owned-current');

      let btnHtml = '';
      if (equipped) {
        btnHtml = `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>目前裝備中</span></button>`;
      } else if (unlocked) {
        btnHtml = `<button class="buy-btn" data-equip-launcher="${def.id}"><span class="ico">${ICONS.play}</span><span>切換裝備</span></button>`;
      } else {
        btnHtml = `<button class="buy-btn" ${state.coins >= def.cost ? '' : 'disabled'} data-buy-launcher="${def.id}">
          <span class="ico">${ICONS.coin}</span><span>購買並裝備 · ${def.cost}G</span></button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">${equipped ? '使用中' : unlocked ? '已擁有' : '未解鎖'}</span></div></div>
        </div>
        <p class="card-desc">${def.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">威力 ×${def.dmgMult.toFixed(2)}</span>
          <span class="card-stat-chip">額外齊射 +${def.extraShots}</span>
        </div>
        ${btnHtml}
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-buy-launcher]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buyLauncher;
        const def = LAUNCHER_DEFS.find((l) => l.id === id);
        if (!def || state.unlockedLaunchers[id] || state.coins < def.cost) return;
        state.coins -= def.cost;
        state.unlockedLaunchers[id] = true;
        state.launcher = id;
        sound.playBuy();
        addPopup(L.towerX, L.towerTopY - 30, `更換投擲器：${def.name}`, '#ffffff', 16);
        saveProgress();
        renderShopBody();
        updateHud();
      });
    });
    dom.shopBody.querySelectorAll('[data-equip-launcher]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.equipLauncher;
        if (!state.unlockedLaunchers[id]) return;
        state.launcher = id;
        sound.playBuy();
        saveProgress();
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'forge') {
    FORGE_DEFS.forEach((def) => {
      const lv = state.forge[def.id];
      const cost = Math.round(def.baseCost * Math.pow(1.65, lv));
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (lv > 0) card.classList.add('owned-current');

      const btnHtml = lv >= def.maxLv
        ? `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>已達滿級</span></button>`
        : `<button class="buy-btn" ${state.coins >= cost ? '' : 'disabled'} data-buy-forge="${def.id}">
            <span class="ico">${ICONS.upgrade}</span><span>鍛造升級 Lv.${lv + 1} · ${cost}G</span></button>`;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">Lv.${lv}${def.maxLv > 999 ? ' ∞' : '/' + def.maxLv}</span></div></div>
        </div>
        <p class="card-desc">${def.desc}</p>
        ${btnHtml}
      `;
      dom.shopBody.appendChild(card);
    });

    dom.shopBody.querySelectorAll('[data-buy-forge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buyForge;
        const def = FORGE_DEFS.find((d) => d.id === id);
        const lv = state.forge[id];
        const cost = Math.round(def.baseCost * Math.pow(1.65, lv));
        if (!def || lv >= def.maxLv || state.coins < cost) return;
        state.coins -= cost;
        state.forge[id] += 1;
        sound.playBuy();
        addPopup(L.towerX, L.towerTopY - 26, `鍛造完成：${def.name}`, '#ffffff', 15);
        renderShopBody();
        updateHud();
      });
    });
  }
}

// ============================================================
// GLOBAL LEADERBOARD (CLOUDFLARE WORKER + KV)
// ============================================================
async function openLeaderboard() {
  state.lbOpen = true;
  dom.leaderboardModal.classList.remove('hidden');
  dom.lbBody.innerHTML = '<p class="lb-empty">正在同步全球榜單...</p>';
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    const data = await res.json();
    renderLeaderboardRows(data.scores || []);
  } catch {
    dom.lbBody.innerHTML = '<p class="lb-empty">暫時無法連線至排行榜伺服器</p>';
  }
}

function closeLeaderboard() {
  state.lbOpen = false;
  dom.leaderboardModal.classList.add('hidden');
}

function renderLeaderboardRows(scores) {
  if (!scores.length) {
    dom.lbBody.innerHTML = '<p class="lb-empty">尚無紀錄，成為第一位登榜的守衛者！</p>';
    return;
  }
  dom.lbBody.innerHTML = '';
  scores.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = `lb-row${i < 3 ? ' top3' : ''}`;
    const tierName = TOWER_TIERS[s.towerTier]?.name || '木塔';
    row.innerHTML = `
      <span class="lb-rank">#${i + 1}</span>
      <span class="lb-name">${s.name}</span>
      <span class="lb-meta">${tierName} · Lv.${s.intensity}</span>
      <span class="lb-meta">${s.kills} 擊敗</span>
      <span class="lb-time">${formatTime(s.timeSec)}</span>
    `;
    dom.lbBody.appendChild(row);
  });
}

async function submitLeaderboardScore() {
  if (state.scoreSubmitted) return;
  const name = dom.playerNameInput.value.trim() || '無名守衛';
  localStorage.setItem('throw_player_name', name);
  dom.submitScoreBtn.disabled = true;
  dom.submitStatus.textContent = '上傳中...';
  dom.submitStatus.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        timeSec: Math.floor(state.elapsed),
        intensity: state.intensity,
        kills: state.kills,
        maxCombo: state.maxCombo,
        towerTier: state.towerTier,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      state.scoreSubmitted = true;
      dom.submitStatus.textContent = `已登榜！目前全球第 #${data.rank} 名`;
    } else {
      dom.submitScoreBtn.disabled = false;
      dom.submitStatus.textContent = '上傳失敗，請稍後再試';
    }
  } catch {
    dom.submitScoreBtn.disabled = false;
    dom.submitStatus.textContent = '網路異常，無法上傳';
  }
}

// ============================================================
// SKILLS & LAUNCHING
// ============================================================
function cancelSkillTargeting() {
  state.activeTargetSkill = null;
  state.draggingSkill = null;
  dom.targetHint.classList.add('hidden');
  dom.skillDragGhost.classList.add('hidden');
  updateDockDisplays();
}

function castSkill(id, wx) {
  const def = SKILL_DEFS.find((d) => d.id === id);
  const ss = state.skills[id];
  if (!def || ss.count <= 0 || ss.cd > 0) return;

  ss.count -= 1;
  ss.cd = def.cooldown;
  cancelSkillTargeting();
  sound.playSkill();

  const tx = clamp(wx, L.towerX + 80, L.worldW - 30);

  if (id === 'repair') {
    const heal = Math.round(state.towerMaxHp * 0.35);
    state.towerHp = Math.min(state.towerMaxHp, state.towerHp + heal);
    // Visually repair dents and cracks
    state.towerDents.splice(0, Math.ceil(state.towerDents.length * 0.6));
    state.towerCracks.splice(0, Math.ceil(state.towerCracks.length * 0.6));
    spawnParticles(L.towerX, L.towerTopY + 80, 26, { color: '#ffffff', speed: 140, gravity: -80, size: 4, life: 0.9 });
    addPopup(L.towerX, L.towerTopY - 24, '高塔結構修復', '#ffffff', 16);
  } else if (id === 'shield') {
    state.shieldTimer = 5.0;
    spawnParticles(L.towerX, L.towerTopY + 80, 24, { color: '#ffffff', speed: 170, gravity: 0, size: 3.5, life: 0.65 });
    addPopup(L.towerX, L.towerTopY - 24, '5秒力場啟動', '#ffffff', 16);
  } else if (id === 'arrows') {
    const dmg = Math.round(18 + state.intensity * 4.5);
    const span = L.isPortrait ? 210 : 280;
    for (let i = 0; i < 28; i++) {
      state.rainArrows.push({
        x: clamp(tx + (Math.random() - 0.5) * span, L.towerX + 60, L.worldW - 15),
        y: -40 - Math.random() * 340,
        vx: -40 + state.windX * 0.3 + Math.random() * 20,
        vy: 760 + Math.random() * 220,
        damage: dmg,
        type: 'arrow',
      });
    }
    addPopup(tx, 150, '區域箭雨', '#ffffff', 16);
  } else if (id === 'meteor') {
    const dmg = Math.round(58 + state.intensity * 11);
    for (let i = 0; i < 7; i++) {
      state.rainArrows.push({
        x: clamp(tx + (i - 3) * 38, L.towerX + 75, L.worldW - 25) - 80,
        y: -70 - i * 85 - Math.random() * 45,
        vx: 120 + state.windX * 0.25,
        vy: 640 + Math.random() * 100,
        damage: dmg,
        type: 'meteor',
      });
    }
    addPopup(tx, 140, '區域火球轟炸', '#ffb142', 17);
  } else if (id === 'mine') {
    state.mines.push({
      x: tx,
      phase: Math.random() * Math.PI * 2,
      radius: 17,
      damage: Math.round(105 + state.intensity * 19),
      aoe: 132,
      armed: 0.35,
    });
    spawnWaterSplash(tx, 0.85);
    addPopup(tx, L.seaY - 34, '水雷已部署', '#ffffff', 14);
  } else if (id === 'wave') {
    state.waves.push({
      x: L.towerX + L.towerW * 0.5,
      vx: 460,
      width: 68,
      height: 110,
      damage: Math.round(52 + state.intensity * 10),
      hitIds: new Set(),
    });
    state.shake = Math.min(18, state.shake + 9);
    spawnWaterSplash(L.towerX + 60, 1.8);
    addPopup(L.towerX + 120, L.seaY - 90, '巨浪衝擊！', '#ffffff', 17);
  } else if (id === 'lightning') {
    const isStorm = WEATHER_STATES[state.weatherIdx].id === 'storm';
    const dmg = Math.round((135 + state.intensity * 26) * (isStorm ? 1.5 : 1.0));
    state.lightningBolts.push({ x: tx, life: 0.42, maxLife: 0.42 });
    state.lightningFlash = 0.35;
    state.shake = Math.min(18, state.shake + 12);
    sound.playExplosion();
    for (const e of [...state.enemies]) {
      if (!e || !state.enemies.includes(e)) continue;
      if (Math.abs(e.x - tx) <= 115 + e.cfg.width * 0.45) {
        damageEnemyHull(e, dmg, { ignoreArmor: true, breachForce: true, hitX: e.x, hitY: e.y - 16 });
      }
    }
    spawnWaterSplash(tx, 1.5);
    addPopup(tx, 160, isStorm ? '暴風雷霆 ×1.5！' : '雷霆審判！', '#a5f3fc', 17);
  } else if (id === 'slowmo') {
    state.slowmoTimer = 6.0;
    addPopup(L.worldW * 0.5, 175, '時間緩速 · 6 秒', '#a5f3fc', 17);
  }
  updateHud();
}

function fireProjectile(vx, vy) {
  const id = state.selectedProj;
  const def = PROJECTILE_DEFS.find((d) => d.id === id);
  const ps = state.projectiles[id];
  if (!def || !ps.unlocked || ps.charges < 1) return false;

  ps.charges -= 1;
  state.catapultRecoil = 1.0;
  sound.playThrow(id);

  if (!state.hintDismissed) {
    state.hintDismissed = true;
    dom.controlHint.classList.add('fade-out');
  }

  const dmg = getProjectileDamage(def, ps.level);
  const spawnOne = (ovx, ovy) => {
    state.playerProjs.push({
      type: id,
      x: L.catapultX + 12,
      y: L.catapultY - 12,
      vx: ovx,
      vy: ovy,
      r: def.radius,
      damage: dmg,
      aoe: def.aoe || 0,
      pierceLeft: def.pierce || 1,
      hitIds: new Set(),
      burnDps: def.burnDps || 0,
      burnDur: def.burnDur || 0,
      freezeDur: def.freezeDur || 0,
      splitDone: false,
      rot: 0,
      trail: [],
      hasHitAnything: false,
      isShard: false,
    });
  };

  const ln = getActiveLauncher();
  const baseVx = vx * ln.speedMult;
  const baseVy = vy * ln.speedMult;
  const totalVolley = (id === 'triple' ? 3 : 1) + ln.extraShots;
  if (totalVolley === 1) {
    spawnOne(baseVx, baseVy);
  } else {
    for (let k = 0; k < totalVolley; k++) {
      const frac = totalVolley === 1 ? 0 : (k / (totalVolley - 1) - 0.5);
      spawnOne(baseVx * (1 + frac * 0.13), baseVy * (1 + frac * 0.1) + frac * 76);
    }
  }
  updateDockDisplays();
  return true;
}

function solveQuickBallistic(tx, ty) {
  const sx = L.catapultX + 12;
  const sy = L.catapultY - 12;
  const dx = Math.max(60, tx - sx);
  const dy = ty - sy;
  const t = clamp(dx / (L.isPortrait ? 470 : 620), 0.5, 1.5);
  // Compensate slightly for wind so tap-to-throw feels responsive, while drag gives full manual mastery
  const vx = (dx - 0.5 * getEffectiveWind() * t * t) / t;
  const vy = (dy - 0.5 * getEffectiveGravity() * t * t) / t;
  return { vx: clamp(vx, 140, 1100), vy: clamp(vy, -960, -110) };
}

// ============================================================
// ENEMY SPAWNING & DYNAMIC SHIP / CREW PHYSICS
// ============================================================
function spawnEnemy(forceType = null) {
  const lv = state.intensity;
  let typeKey = forceType;

  if (!typeKey) {
    const pool = [];
    Object.entries(ENEMY_TYPES).forEach(([k, cfg]) => {
      if (cfg.boss) return;
      if (lv >= cfg.minLv) {
        const weight = k === 'skiff' ? 3 : k === 'archer' ? 2.5 : k === 'cannon' ? 2.2 : 1.7;
        pool.push({ k, weight });
      }
    });
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    typeKey = pool[0].k;
    for (const p of pool) {
      r -= p.weight;
      if (r <= 0) { typeKey = p.k; break; }
    }
  }

  const cfg = ENEMY_TYPES[typeKey];
  const scaleHp = Math.pow(1.22, lv - 1);
  const scaleDmg = 1 + (lv - 1) * 0.22;
  const scaleSpeed = (1 + (lv - 1) * 0.045) * (L.isPortrait ? 0.74 : 1.0);
  const bounty = Math.round(cfg.bounty * (1 + (lv - 1) * 0.28));
  let maxHp = Math.round(cfg.hp * scaleHp);

  const towerEdge = L.towerX + L.towerW * 0.5;
  const battleSpan = Math.max(180, L.worldW - towerEdge);
  const minStop = towerEdge + battleSpan * 0.15;
  const maxStop = L.worldW - battleSpan * 0.15;
  const stopX = cfg.kamikaze ? (towerEdge + 20) : (minStop + Math.random() * (maxStop - minStop));

  // Roll dynamic variants at Lv.2+
  let armorMod = null;
  let armorHp = 0;
  if (!cfg.air && !cfg.kamikaze && lv >= 2 && Math.random() < Math.min(0.55, 0.12 + lv * 0.05)) {
    armorMod = Math.random() < 0.5 ? 'ironFrame' : 'exoCage';
    armorHp = Math.round(maxHp * (armorMod === 'exoCage' ? 0.55 : 0.4));
    maxHp += Math.round(maxHp * 0.25);
  }
  const empAmmo = cfg.ranged && lv >= 3 && Math.random() < Math.min(0.32, 0.08 + lv * 0.03);
  const missileAmmo = (cfg.projType === 'missile') || (cfg.ranged && !empAmmo && lv >= 4 && Math.random() < Math.min(0.35, 0.08 + lv * 0.03));

  // Unmanned Autonomous Deck Turrets (up to 5 per ship!)
  const autoTurrets = [];
  if (!cfg.air && !cfg.kamikaze && lv >= 3 && Math.random() < Math.min(0.5, 0.1 + lv * 0.04)) {
    const count = clamp(1 + Math.floor(Math.random() * Math.min(5, Math.floor(lv / 2))), 1, 5);
    const spanW = cfg.width * 0.72;
    for (let u = 0; u < count; u++) {
      const frac = count === 1 ? 0 : (u / (count - 1) - 0.5);
      const uox = frac * spanW;
      autoTurrets.push({ ox: uox, oy: getShipDeckY(typeKey, cfg, uox), cd: 1.5 + Math.random() * 2.5 });
    }
  }

  state.enemies.push({
    id: Math.random().toString(36).slice(2),
    type: typeKey,
    cfg,
    x: L.worldW + cfg.width * 0.6 + Math.random() * 35,
    y: cfg.air ? L.seaY - (L.isPortrait ? 270 : 340) + (Math.random() - 0.5) * 60 : L.seaY,
    hp: maxHp,
    maxHp,
    armor: cfg.armor + Math.floor((lv - 1) * 0.4),
    speed: cfg.speed * scaleSpeed,
    damage: Math.round(cfg.damage * scaleDmg),
    stopX,
    stopped: false,
    attackTimer: 1.35,
    windup: 0,
    fireRecoil: 0,
    bounty,
    burnTimer: 0,
    burnDps: 0,
    freezeTimer: 0,
    hitFlash: 0,
    bobPhase: Math.random() * Math.PI * 2,
    listAngle: 0,
    cracks: [],
    crew: cfg.crewSlots.map((s) => ({ ox: s.ox, oy: s.oy, gunner: !!s.gunner, alive: true })),
    unmannedTimer: 0,
    armorMod,
    armorHp,
    empAmmo,
    missileAmmo,
    autoTurrets,
    deployed: false,
    subDepth: cfg.stealthSub ? 1.0 : 0,
  });

  state.hasSpawnedAny = true;
}

function killCrewMember(enemy, crewObj, kickVx, kickVy, reason = '擊倒海盜') {
  if (!crewObj.alive) return;
  crewObj.alive = false;
  registerComboHit();
  const cx = enemy.x + crewObj.ox;
  const cy = enemy.y + crewObj.oy - 10;
  spawnRagdoll(cx, cy, kickVx, kickVy);
  spawnParticles(cx, cy, 8, { color: '#ffffff', speed: 140, life: 0.45 });
  const crewCoin = Math.max(4, Math.round(enemy.bounty * 0.28));
  spawnCoinBurst(cx, cy, crewCoin);
  addPopup(cx, cy - 26, reason, '#ffeaa7', 13);
  sound.playHit(false);
}

function damageEnemyHull(enemy, rawDmg, opts = {}) {
  const { ignoreArmor = false, burnDps = 0, burnDur = 0, hitX = enemy.x, hitY = enemy.y - 12, breachForce = false } = opts;
  const effectiveArmor = ignoreArmor ? 0 : enemy.armor;
  const dmg = Math.max(4, Math.round(rawDmg - effectiveArmor * 0.55));
  enemy.hp -= dmg;
  enemy.hitFlash = 0.14;

  // Add physical hull crack & splinters!
  if (enemy.cracks.length < 7) {
    enemy.cracks.push({
      ox: clamp(hitX - enemy.x, -enemy.cfg.width * 0.38, enemy.cfg.width * 0.38),
      oy: clamp(hitY - enemy.y, -enemy.cfg.height + 4, -4),
      len: 10 + Math.random() * 14,
      ang: (Math.random() - 0.5) * 2.2,
    });
  }
  spawnDebris(hitX, hitY, 4, '#cbd5e1', 35);

  if (burnDps > 0) {
    enemy.burnDps = Math.max(enemy.burnDps, burnDps);
    enemy.burnTimer = Math.max(enemy.burnTimer, burnDur);
  }

  if (enemy.hp <= 0 || (breachForce && enemy.hp < enemy.maxHp * 0.32)) {
    sinkEnemyShip(enemy, breachForce || dmg > enemy.maxHp * 0.55);
    return true;
  }
  return false;
}

function sinkEnemyShip(enemy, splitSnap = false) {
  const idx = state.enemies.indexOf(enemy);
  if (idx === -1) return;
  state.enemies.splice(idx, 1);

  state.kills += 1;
  sound.playCoin();

  // Fling any remaining crew into the sea
  enemy.crew.forEach((c) => {
    if (c.alive) {
      c.alive = false;
      spawnRagdoll(enemy.x + c.ox, enemy.y - enemy.cfg.height - 8, (Math.random() - 0.5) * 180, -180 - Math.random() * 110);
    }
  });

  spawnCoinBurst(enemy.x, enemy.y - enemy.cfg.height - 16, enemy.bounty);

  if (enemy.cfg.explosive) {
    spawnExplosion(enemy.x, enemy.y - 12, 155, true);
    addPopup(enemy.x, enemy.y - 52, '火藥艙連鎖大爆炸！', '#ffb142', 16);
    for (const other of [...state.enemies]) {
      if (!other || !state.enemies.includes(other)) continue;
      if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < 155 + other.cfg.width * 0.4) {
        damageEnemyHull(other, 65 + state.intensity * 10, { ignoreArmor: true, burnDps: 14, burnDur: 3.5, breachForce: true });
      }
    }
  } else if (splitSnap && !enemy.cfg.air) {
    addPopup(enemy.x, enemy.y - enemy.cfg.height - 42, '船體砸穿沉沒！', '#ffffff', 15);
    spawnDebris(enemy.x, enemy.y - 12, 12, '#e2e8f0', 0);
  }

  state.sinking.push({
    x: enemy.x,
    y: enemy.y,
    cfg: enemy.cfg,
    type: enemy.type,
    split: splitSnap && !enemy.cfg.air,
    splitGap: 0,
    tilt: enemy.listAngle,
    tiltDir: Math.random() < 0.5 ? -1 : 1,
    vy: enemy.cfg.air ? 75 : 22,
    alpha: 1,
    life: 1.65,
  });

  if (!enemy.cfg.air) spawnWaterSplash(enemy.x, splitSnap ? 1.55 : 0.95);
  else spawnExplosion(enemy.x, enemy.y, 70, true);

  // Trigger Clear Rush x3 when battlefield is cleared
  if (state.hasSpawnedAny && state.enemies.length === 0) {
    state.rushTimer = state.rushMax;
    state.spawnTimer = Math.min(state.spawnTimer, 0.35);
    addPopup(L.worldW * 0.5, 180, '清場！敵軍來襲速度 ×3', '#ffffff', 18);
  }
}

function handleStoneShipImpact(p, enemy) {
  const speed = Math.hypot(p.vx, p.vy);
  const verticalRatio = Math.abs(p.vy) / Math.max(1, speed);

  // 1. Check direct hit on any living pirate crew first!
  for (const c of enemy.crew) {
    if (!c.alive) continue;
    const cx = enemy.x + c.ox;
    const cy = enemy.y + c.oy - 12;
    if (Math.hypot(p.x - cx, p.y - cy) < p.r + 18) {
      killCrewMember(enemy, c, p.vx * 0.38, -210, '精準砸飛！');
    }
  }

  // 2. Determine dynamic physics outcome: Breach-Sink vs Shatter vs Roll-on-Deck!
  const strongVerticalBreach = (p.type === 'spike') || (verticalRatio > 0.62 && speed > 490) || (p.damage >= enemy.hp);
  if (strongVerticalBreach) {
    sound.playHit(true);
    const sunk = damageEnemyHull(enemy, p.damage * 1.15, {
      ignoreArmor: p.type === 'spike',
      hitX: p.x,
      hitY: p.y,
      breachForce: true,
    });
    if (sunk) return 'remove';
  } else {
    sound.playHit(false);
    const sunk = damageEnemyHull(enemy, p.damage, { hitX: p.x, hitY: p.y });
    if (sunk) return 'remove';
  }

  // If stone or triple stone (not already a shard) and ship still floating:
  if ((p.type === 'stone' || p.type === 'triple') && !p.isShard && !enemy.cfg.air) {
    // High-speed impact on sturdy hull -> Shatter into 3-4 damaging rock shards!
    if (speed > 550 && Math.random() < 0.52) {
      addPopup(p.x, p.y - 16, '石塊碎裂！', '#ffffff', 12);
      spawnParticles(p.x, p.y, 10, { color: '#ffffff', speed: 180, life: 0.45 });
      const shardCount = 3 + (Math.random() < 0.4 ? 1 : 0);
      for (let s = 0; s < shardCount; s++) {
        state.playerProjs.push({
          type: 'stone',
          isShard: true,
          x: p.x,
          y: p.y - 6,
          vx: (Math.random() - 0.35) * 340,
          vy: -160 - Math.random() * 190,
          r: 5,
          damage: Math.round(p.damage * 0.45),
          aoe: 0,
          pierceLeft: 1,
          hitIds: new Set([enemy.id]), // Can still hit crew on this ship or other ships
          burnDps: 0,
          burnDur: 0,
          rot: Math.random() * 6,
          trail: [],
          hasHitAnything: true,
        });
      }
      // Shards can immediately clip another crew member on deck
      enemy.crew.forEach((c) => {
        if (c.alive && Math.abs((enemy.x + c.ox) - p.x) < 38) {
          killCrewMember(enemy, c, (Math.random() - 0.5) * 200, -180, '碎石波及！');
        }
      });
      return 'remove';
    }

    // Otherwise -> Roll across the ship deck crushing pirates!
    state.rollingStones.push({
      shipId: enemy.id,
      ox: clamp(p.x - enemy.x, -enemy.cfg.width * 0.44, enemy.cfg.width * 0.44),
      vx: clamp(p.vx * 0.36, -180, 210) || 110,
      r: p.r * 0.92,
      rot: p.rot,
      damage: Math.round(p.damage * 0.5),
      life: 2.2,
    });
    return 'remove';
  }

  return p.pierceLeft <= 1 ? 'remove' : 'pierce';
}

// ============================================================
// DESTRUCTIBLE TOWER DAMAGE & COLLAPSE
// ============================================================
function damageTower(rawDmg, hitY = L.towerTopY + 70) {
  if (state.collapsing || state.gameOver) return;
  if (state.shieldTimer > 0) {
    spawnParticles(L.towerX + L.towerW * 0.5 + 14, hitY, 10, { color: '#ffffff', speed: 140, gravity: 0, size: 3, life: 0.4 });
    addPopup(L.towerX + 36, hitY - 12, '力場彈開', '#ffffff', 13);
    return;
  }

  const platingMult = Math.max(0.45, 1 - (state.forge.plating || 0) * 0.09);
  const dmg = Math.max(2, Math.round((rawDmg - state.towerArmor * 0.45) * platingMult));
  state.towerHp = Math.max(0, state.towerHp - dmg);
  state.towerFlash = 0.2;
  state.shake = Math.min(16, state.shake + clamp(dmg * 0.35, 3, 11));
  sound.playTowerHit();

  const tier = TOWER_TIERS[state.towerTier];
  const towerH = L.seaY - L.towerTopY;
  const yRel = clamp((hitY - L.towerTopY) / towerH, 0.08, 0.92);

  // Carve physical dent/crater into tower wall proportional to dmg vs tier strength!
  const impactScale = clamp(dmg / (state.towerMaxHp * 0.14), 0.45, 1.5);
  if (state.towerDents.length < 18) {
    state.towerDents.push({
      yRel,
      depth: clamp(6 + impactScale * 11, 5, 22),
      radius: clamp(10 + impactScale * 12, 9, 26),
    });
  }
  if (state.towerCracks.length < 22) {
    state.towerCracks.push({
      xRel: 0.45 + Math.random() * 0.45,
      yRel,
      len: 16 + impactScale * 22,
      ang: Math.PI + (Math.random() - 0.5) * 1.4,
    });
  }

  // Blast physical chunks off the tower!
  spawnDebris(L.towerX + L.towerW * 0.46, hitY, Math.round(3 + impactScale * 4), tier.debrisColor, 95);
  spawnParticles(L.towerX + L.towerW * 0.46, hitY, 10, { color: '#ffffff', speed: 145, gravity: 360, size: 3, life: 0.5 });

  if (state.towerHp <= 0) {
    startTowerCollapse();
  }
}

function startTowerCollapse() {
  clearProgress();
  state.collapsing = true;
  state.collapseTimer = 1.65;
  state.shake = 18;
  cancelSkillTargeting();
  sound.playExplosion();

  const tier = TOWER_TIERS[state.towerTier];
  const towerH = L.seaY - L.towerTopY;
  const rows = 5;
  const segH = towerH / rows;
  state.collapseBlocks = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      state.collapseBlocks.push({
        x: L.towerX - L.towerW * 0.25 + c * (L.towerW * 0.5),
        y: L.towerTopY + r * segH + segH * 0.5,
        w: L.towerW * 0.48,
        h: segH * 0.92,
        vx: (c === 0 ? -1 : 1) * (40 + Math.random() * 90) + (rows - r) * 18,
        vy: -40 - Math.random() * 110,
        rot: 0,
        vrot: (Math.random() - 0.35) * 4.5,
        color: tier.color,
      });
    }
  }
  // Launch defender stickman into ragdoll
  spawnRagdoll(L.catapultX - 24, L.towerTopY - 24, -75, -240);
  spawnParticles(L.towerX, L.towerTopY + towerH * 0.5, 36, { color: '#ffffff', speed: 220, gravity: 280, size: 4.5, life: 1.0 });
}

function openGameOverModal() {
  state.gameOver = true;
  dom.finalTime.textContent = formatTime(state.elapsed);
  dom.finalIntensity.textContent = `Lv.${state.intensity}`;
  dom.finalKills.textContent = state.kills;
  dom.finalCombo.textContent = state.maxCombo;
  dom.playerNameInput.value = localStorage.getItem('throw_player_name') || '';
  dom.submitScoreBtn.disabled = false;
  dom.submitStatus.classList.add('hidden');
  dom.gameOverModal.classList.remove('hidden');
}

// ============================================================
// MAIN UPDATE LOOP
// ============================================================
function update(dt) {
  if (state.shopOpen || state.lbOpen || state.paused || state.gameOver) return;

  // Handle Tower Collapse Physics Sequence
  if (state.collapsing) {
    state.collapseTimer -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 14);
    state.collapseBlocks.forEach((b) => {
      b.vy += GRAVITY * 0.85 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vrot * dt;
    });
    updateVisualSubsystems(dt);
    if (state.collapseTimer <= 0) openGameOverModal();
    return;
  }

  state.elapsed += dt;
  const newIntensity = 1 + Math.floor(state.elapsed / 14);
  if (newIntensity > state.intensity) {
    state.intensity = newIntensity;
    addPopup(L.worldW * 0.5, 130, `強度提升 · Lv.${state.intensity}`, '#ffffff', 18);
  }

  // Weather & Wind Cycle
  state.weatherTimer -= dt;
  if (state.weatherTimer <= 0) {
    state.weatherIdx = (state.weatherIdx + 1) % WEATHER_STATES.length;
    const w = WEATHER_STATES[state.weatherIdx];
    const dir = w.id === 'wind' && Math.random() < 0.4 ? -1 : 1;
    state.targetWindX = w.wind * dir;
    state.weatherTimer = 32;
    addPopup(L.worldW * 0.5, 165, `天氣變化：${w.name}`, '#ffffff', 16);
  }
  state.windX += (state.targetWindX - state.windX) * Math.min(1, dt * 1.4);
  if (WEATHER_STATES[state.weatherIdx].id === 'storm' && Math.random() < dt * 0.14) {
    state.lightningFlash = 0.25;
  }
  if (state.lightningFlash > 0) state.lightningFlash = Math.max(0, state.lightningFlash - dt);

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) resetCombo();
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
  if (state.towerFlash > 0) state.towerFlash = Math.max(0, state.towerFlash - dt);
  if (state.catapultRecoil > 0) state.catapultRecoil = Math.max(0, state.catapultRecoil - dt * 4.5);
  if (state.shieldTimer > 0) state.shieldTimer = Math.max(0, state.shieldTimer - dt);
  if (state.slowmoTimer > 0) state.slowmoTimer = Math.max(0, state.slowmoTimer - dt);
  if (state.overdriveTimer > 0) state.overdriveTimer = Math.max(0, state.overdriveTimer - dt);
  if (state.empTimer > 0) state.empTimer = Math.max(0, state.empTimer - dt);

  // Floating Sea Supply Crates
  state.crateTimer -= dt;
  if (state.crateTimer <= 0 && state.crates.length < 2) {
    state.crateTimer = 22 + Math.random() * 14;
    const kinds = ['gold', 'repair', 'overdrive'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const towerEdge = L.towerX + L.towerW * 0.5;
    const span = Math.max(180, L.worldW - towerEdge);
    state.crates.push({
      x: towerEdge + span * (0.25 + Math.random() * 0.58),
      y: -30,
      kind,
      floating: false,
      phase: Math.random() * Math.PI * 2,
      life: 16,
    });
  }
  for (let i = state.crates.length - 1; i >= 0; i--) {
    const cr = state.crates[i];
    cr.phase += dt * 3;
    const wy = getWaveY(cr.x);
    if (!cr.floating) {
      cr.y += 95 * dt;
      cr.x += state.windX * 0.18 * dt;
      if (cr.y >= wy - 6) { cr.y = wy - 6; cr.floating = true; spawnWaterSplash(cr.x, 0.5); }
    } else {
      cr.y = wy - 6 + Math.sin(cr.phase) * 3;
      cr.life -= dt;
      if (cr.life <= 0) state.crates.splice(i, 1);
    }
  }
  const enemyDt = state.slowmoTimer > 0 ? dt * 0.3 : dt;

  const rushMult = state.rushTimer > 0 ? 3.0 : 1.0;
  if (state.rushTimer > 0) state.rushTimer = Math.max(0, state.rushTimer - dt);

  // Projectile recharge
  PROJECTILE_DEFS.forEach((def) => {
    const ps = state.projectiles[def.id];
    if (!ps.unlocked) return;
    if (ps.charges < def.maxCharges) {
      ps.timer += dt;
      if (ps.timer >= getEffectiveReload(def)) {
        ps.timer -= getEffectiveReload(def);
        ps.charges += 1;
        if (ps.charges >= def.maxCharges) ps.timer = 0;
      }
    }
  });

  // Skill cooldowns
  SKILL_DEFS.forEach((def) => {
    if (state.skills[def.id].cd > 0) state.skills[def.id].cd = Math.max(0, state.skills[def.id].cd - dt);
  });

  // Tower Attachments (Auto Ballista & AA Flak)
  updateTowerAddons(dt);

  // Spawning (faster scaling, multi-ship wave bursts, no upper cap!)
  const baseInterval = Math.max(0.55, 2.9 - state.intensity * 0.16);
  state.spawnTimer -= dt * rushMult;
  if (state.spawnTimer <= 0) {
    const burst = 1 + Math.floor(state.intensity / 4) + (Math.random() < Math.min(0.75, state.intensity * 0.06) ? 1 : 0);
    for (let b = 0; b < Math.min(5, burst); b++) spawnEnemy();
    state.spawnTimer = baseInterval * (0.7 + Math.random() * 0.45);
  }
  if (state.intensity >= 5) {
    state.bossTimer -= dt;
    if (state.bossTimer <= 0) {
      spawnEnemy('dreadnought');
      addPopup(L.worldW * 0.5, 180, '警告：無畏黑帆旗艦來襲！', '#ffeaa7', 18);
      state.bossTimer = Math.max(48, 82 - state.intensity * 3);
    }
  }

  // Update Player Projectiles (with Wind!)
  for (let i = state.playerProjs.length - 1; i >= 0; i--) {
    const p = state.playerProjs[i];
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 13) p.trail.shift();

    p.vx += getEffectiveWind() * dt;
    p.vy += getEffectiveGravity() * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 7.5;

    // Cluster Bomb splits into 5 mini bombs once descending!
    if (p.type === 'cluster' && !p.splitDone && p.vy > 45) {
      p.splitDone = true;
      sound.playThrow('triple');
      spawnParticles(p.x, p.y, 12, { color: '#ffffff', speed: 160, life: 0.4 });
      for (let k = -2; k <= 2; k++) {
        state.playerProjs.push({
          type: 'bomb',
          isShard: true,
          x: p.x, y: p.y,
          vx: p.vx * (0.85 + k * 0.14),
          vy: p.vy + Math.abs(k) * 28 - 40,
          r: 8,
          damage: Math.round(p.damage * 0.8),
          aoe: p.aoe,
          pierceLeft: 1,
          hitIds: new Set(),
          burnDps: 0, burnDur: 0, freezeDur: 0, splitDone: true,
          rot: 0, trail: [], hasHitAnything: true,
        });
      }
      state.playerProjs.splice(i, 1);
      continue;
    }

    // Mid-air interception
    let intercepted = false;
    for (let j = state.enemyProjs.length - 1; j >= 0; j--) {
      const ep = state.enemyProjs[j];
      if (Math.hypot(p.x - ep.x, p.y - ep.y) < p.r + ep.r + 9) {
        state.enemyProjs.splice(j, 1);
        p.hasHitAnything = true;
        registerComboHit();
        spawnParticles(ep.x, ep.y, 12, { color: '#ffffff', speed: 150, life: 0.45 });
        addPopup(ep.x, ep.y - 12, '空中攔截！', '#ffffff', 13);
        sound.playHit(false);
        if (p.type === 'bomb' || p.type === 'fire' || p.type === 'frost') {
          detonatePlayerProj(p);
          state.playerProjs.splice(i, 1);
          intercepted = true;
          break;
        }
      }
    }
    if (intercepted) continue;

    // Hit floating supply crates!
    for (let cIdx = state.crates.length - 1; cIdx >= 0; cIdx--) {
      const cr = state.crates[cIdx];
      if (Math.hypot(p.x - cr.x, p.y - cr.y) < p.r + 22) {
        state.crates.splice(cIdx, 1);
        p.hasHitAnything = true;
        registerComboHit();
        sound.playBuy();
        spawnParticles(cr.x, cr.y, 18, { color: '#ffeaa7', speed: 190, life: 0.65 });
        if (cr.kind === 'gold') {
          spawnCoinBurst(cr.x, cr.y - 10, 55 + state.intensity * 12);
          addPopup(cr.x, cr.y - 36, '海上寶箱！', '#ffeaa7', 16);
        } else if (cr.kind === 'repair') {
          state.towerHp = Math.min(state.towerMaxHp, state.towerHp + Math.round(state.towerMaxHp * 0.25));
          state.towerDents.splice(0, 4);
          state.towerCracks.splice(0, 4);
          addPopup(cr.x, cr.y - 36, '補給：高塔修復！', '#ffffff', 16);
        } else {
          state.overdriveTimer = 6.5;
          addPopup(cr.x, cr.y - 36, '補給：裝填速度 ×2！', '#a5f3fc', 16);
        }
        break;
      }
    }

    // Hit enemies (first check high-elevation individual crew hitboxes like crow's nest, then ship hull)
    let removed = false;
    for (const e of [...state.enemies]) {
      if (!e || !state.enemies.includes(e)) continue;
      if (p.hitIds.has(e.id)) continue;

      // Direct snipe check on any living crew member (including high crow's nest lookouts!)
      let snipedCrew = false;
      for (const c of e.crew) {
        if (!c.alive) continue;
        const cx = e.x + c.ox;
        const cy = e.y + c.oy - 14;
        if (Math.hypot(p.x - cx, p.y - cy) < p.r + 17) {
          p.hasHitAnything = true;
          if (p.type === 'bomb' || p.type === 'fire' || p.type === 'frost') {
            detonatePlayerProj(p);
            state.playerProjs.splice(i, 1);
            removed = true;
            snipedCrew = true;
            break;
          }
          killCrewMember(e, c, p.vx * 0.42, -220, '精準狙殺！');
          p.vx *= 0.72;
          p.vy *= 0.72;
          snipedCrew = true;
          break;
        }
      }
      if (removed) break;
      if (snipedCrew && !p.isShard && p.type !== 'spike') {
        p.hitIds.add(e.id);
        continue;
      }

      const halfW = e.cfg.width * 0.52;
      const topY = e.cfg.air ? e.y - e.cfg.height * 0.55 : e.y - e.cfg.height - 22;
      const botY = e.cfg.air ? e.y + e.cfg.height * 0.55 : e.y + 8;

      if (p.x + p.r >= e.x - halfW && p.x - p.r <= e.x + halfW && p.y + p.r >= topY && p.y - p.r <= botY) {
        p.hitIds.add(e.id);
        p.hasHitAnything = true;
        registerComboHit();

        if (p.type === 'bomb' || p.type === 'fire' || p.type === 'frost') {
          detonatePlayerProj(p);
          state.playerProjs.splice(i, 1);
          removed = true;
          break;
        } else {
          const outcome = handleStoneShipImpact(p, e);
          if (outcome === 'remove') {
            state.playerProjs.splice(i, 1);
            removed = true;
            break;
          } else {
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              state.playerProjs.splice(i, 1);
              removed = true;
              break;
            }
          }
        }
      }
    }
    if (removed) continue;

    const waterY = getWaveY(p.x);
    if (p.y >= waterY) {
      if (p.type === 'bomb' || p.type === 'fire' || p.type === 'frost') {
        p.y = waterY;
        detonatePlayerProj(p);
      } else {
        spawnWaterSplash(p.x, p.isShard ? 0.45 : 0.75);
        if (!p.hasHitAnything && !p.isShard) resetCombo();
      }
      state.playerProjs.splice(i, 1);
    } else if (p.x > L.worldW + 140 || p.x < -140 || p.y > L.worldH + 140) {
      state.playerProjs.splice(i, 1);
    }
  }

  // Update Rolling Stones on Ship Decks!
  for (let i = state.rollingStones.length - 1; i >= 0; i--) {
    const rs = state.rollingStones[i];
    rs.life -= dt;
    const ship = state.enemies.find((e) => e.id === rs.shipId);
    if (!ship || rs.life <= 0) {
      state.rollingStones.splice(i, 1);
      continue;
    }

    // Roll along ship's contoured deck (curved / stepped / domed)!
    const yPrev = getShipDeckY(ship.type, ship.cfg, rs.ox);
    const nextOx = rs.ox + rs.vx * dt;
    const yNext = getShipDeckY(ship.type, ship.cfg, nextOx);
    const stepUp = yPrev - yNext; // positive means climbing up a step/wall

    if (stepUp > 7) {
      // Hit a vertical bulkhead / raised castle wall -> bounce back & lose speed!
      rs.vx = -rs.vx * 0.45;
      rs.life -= 0.45;
      spawnParticles(ship.x + rs.ox, ship.y + yPrev, 4, { color: '#ffffff', speed: 80, life: 0.28 });
    } else {
      const slope = (yNext - yPrev) / Math.max(1, Math.abs(nextOx - rs.ox));
      rs.vx += (Math.sin(ship.listAngle) * 340 + slope * 260) * dt;
      rs.vx *= Math.pow(0.88, dt); // deck friction
      rs.ox = nextOx;
    }
    rs.rot += (rs.vx / Math.max(6, rs.r)) * dt;

    const stoneDeckY = getShipDeckY(ship.type, ship.cfg, rs.ox);
    // Crush ONLY pirate stickmen standing near the stone's deck level (crow's nest & high castles are safe!)
    ship.crew.forEach((c) => {
      if (c.alive && Math.abs(rs.ox - c.ox) < rs.r + 13 && Math.abs(stoneDeckY - c.oy) < 16) {
        killCrewMember(ship, c, rs.vx * 0.9, -195, '滾石壓扁！');
        damageEnemyHull(ship, rs.damage * 0.4, { hitX: ship.x + rs.ox, hitY: ship.y + stoneDeckY });
      }
    });

    // Roll off bow or stern into the sea, or stop if momentum exhausted
    if (Math.abs(rs.vx) < 14 && rs.life < 1.5) {
      state.rollingStones.splice(i, 1);
      continue;
    }
    if (Math.abs(rs.ox) > ship.cfg.width * 0.52) {
      state.playerProjs.push({
        type: 'stone',
        isShard: true,
        x: ship.x + rs.ox,
        y: ship.y - ship.cfg.height,
        vx: rs.vx * 1.1,
        vy: -40,
        r: rs.r,
        damage: rs.damage,
        aoe: 0,
        pierceLeft: 1,
        hitIds: new Set([ship.id]),
        burnDps: 0,
        burnDur: 0,
        rot: rs.rot,
        trail: [],
        hasHitAnything: true,
      });
      state.rollingStones.splice(i, 1);
    }
  }

  // Update Rain Arrows & Meteors
  for (let i = state.rainArrows.length - 1; i >= 0; i--) {
    const r = state.rainArrows[i];
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    const wy = getWaveY(r.x);

    if (r.type === 'arrow') {
      let hit = false;
      for (const e of [...state.enemies]) {
        if (!e || !state.enemies.includes(e)) continue;
        if (Math.abs(r.x - e.x) < e.cfg.width * 0.55 && Math.abs(r.y - (e.y - e.cfg.height * 0.5)) < e.cfg.height + 18) {
          e.crew.forEach((c) => {
            if (c.alive && Math.abs((e.x + c.ox) - r.x) < 22) killCrewMember(e, c, -60, -150, '箭雨貫穿');
          });
          damageEnemyHull(e, r.damage, { hitX: r.x, hitY: r.y });
          hit = true;
          break;
        }
      }
      if (hit || r.y >= wy) {
        if (!hit) spawnWaterSplash(r.x, 0.35);
        state.rainArrows.splice(i, 1);
      }
    } else {
      spawnParticles(r.x, r.y, 1, { color: '#ffb142', speed: 40, gravity: -20, size: 3.5, life: 0.26 });
      let hitEnemy = false;
      for (const e of [...state.enemies]) {
        if (!e || !state.enemies.includes(e)) continue;
        if (Math.hypot(r.x - e.x, r.y - (e.y - 12)) < e.cfg.width * 0.55) { hitEnemy = true; break; }
      }
      if (hitEnemy || r.y >= wy) {
        const ey = Math.min(r.y, wy);
        spawnExplosion(r.x, ey, 110, true);
        for (const e of [...state.enemies]) {
          if (!e || !state.enemies.includes(e)) continue;
          if (Math.hypot(e.x - r.x, e.y - ey) <= 110 + e.cfg.width * 0.4) {
            damageEnemyHull(e, r.damage, { burnDps: 16, burnDur: 4.2, breachForce: true });
          }
        }
        state.rainArrows.splice(i, 1);
      }
    }
  }

  // Update Sea Mines
  for (let i = state.mines.length - 1; i >= 0; i--) {
    const m = state.mines[i];
    m.phase += dt * 3;
    if (m.armed > 0) { m.armed -= dt; continue; }
    for (const e of [...state.enemies]) {
      if (!e || !state.enemies.includes(e)) continue;
      if (e.cfg.air) continue;
      if (Math.abs(e.x - m.x) < e.cfg.width * 0.5 + m.radius) {
        const wy = getWaveY(m.x);
        spawnExplosion(m.x, wy, m.aoe, false);
        spawnWaterSplash(m.x, 1.7);
        for (const t of [...state.enemies]) {
          if (!t || !state.enemies.includes(t)) continue;
          if (t.cfg.air) continue;
          if (Math.abs(t.x - m.x) <= m.aoe + t.cfg.width * 0.4) {
            t.x += 44;
            damageEnemyHull(t, m.damage, { ignoreArmor: true, breachForce: true });
          }
        }
        state.mines.splice(i, 1);
        break;
      }
    }
  }

  // Update Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (!e) continue;
    e.bobPhase += dt * 3.2;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    // Progressive water intake & list angle based on structural damage (replaces HP bars!)
    const dmgRatio = 1 - clamp(e.hp / e.maxHp, 0, 1);
    const waveTilt = Math.cos(e.bobPhase) * (0.04 + WEATHER_STATES[state.weatherIdx].waveAmp * 0.005);
    e.listAngle = waveTilt + (e.cfg.air ? 0 : dmgRatio * 0.28 * (i % 2 === 0 ? 1 : -1));
    if (e.cfg.stealthSub) {
      const targetDepth = e.stopped ? 0 : 1.0;
      e.subDepth += (targetDepth - (e.subDepth || 0)) * Math.min(1, dt * 2.5);
    }
    if (!e.cfg.air) e.y = getWaveY(e.x) + dmgRatio * 12 + (e.subDepth || 0) * 18;

    // Smoke when heavily damaged
    if (dmgRatio > 0.45 && Math.random() < dt * 7) {
      spawnParticles(e.x + (Math.random() - 0.5) * e.cfg.width * 0.4, e.y - e.cfg.height, 1, {
        color: 'rgba(180,190,205,0.45)', speed: 35, gravity: -55, size: 4.5, life: 0.7,
      });
    }

    // Burn DoT
    if (e.burnTimer > 0) {
      e.burnTimer -= dt;
      if (Math.random() < 0.38) {
        spawnParticles(e.x + (Math.random() - 0.5) * e.cfg.width * 0.5, e.y - 16, 1, {
          color: '#ffb142', speed: 45, gravity: -90, size: 3.2, life: 0.35,
        });
      }
      e.hp -= e.burnDps * dt;
      if (e.hp <= 0) { sinkEnemyShip(e, false); continue; }
    }

    // Autonomous Unmanned Deck Turrets keep firing even if human crew are gone!
    if (e.stopped && e.autoTurrets && e.autoTurrets.length > 0 && e.freezeTimer <= 0) {
      e.autoTurrets.forEach((ut) => {
        ut.cd -= enemyDt;
        if (ut.cd <= 0) {
          ut.cd = 4.2 + Math.random() * 1.4;
          const sx = e.x + ut.ox - 10;
          const sy = e.y + ut.oy - 8;
          const tx = L.towerX + (Math.random() - 0.5) * 28;
          const ty = L.towerTopY + 40 + Math.random() * (L.seaY - L.towerTopY - 70);
          const g = 520;
          const t = clamp(Math.abs(sx - tx) / 340, 0.85, 1.8);
          state.enemyProjs.push({
            type: 'cannonball', x: sx, y: sy,
            vx: (tx - sx) / t, vy: (ty - sy - 0.5 * g * t * t) / t,
            gravity: g, r: 6.5, damage: Math.round(e.damage * 0.55),
          });
          spawnParticles(sx, sy, 4, { color: '#ff7675', speed: 90, life: 0.28 });
        }
      });
    }

    // Unmanned ship slowly takes on water and sinks (unless protected by unmanned turrets!)
    const aliveCrew = e.crew.filter((c) => c.alive).length;
    if (aliveCrew === 0 && (!e.autoTurrets || e.autoTurrets.length === 0)) {
      e.unmannedTimer += dt;
      e.hp -= e.maxHp * 0.25 * dt;
      if (e.unmannedTimer > 2.4 || e.hp <= 0) {
        sinkEnemyShip(e, false);
        continue;
      }
      continue;
    }

    if (e.fireRecoil > 0) e.fireRecoil = Math.max(0, e.fireRecoil - dt * 3.5);
    if (e.freezeTimer > 0) {
      e.freezeTimer = Math.max(0, e.freezeTimer - dt);
      e.windup = 0;
      continue;
    }

    // Move to random 70% middle zone; once stopped, fire every 5.0s with pre-fire gunner animation!
    const moveSpeed = e.speed * (state.rushTimer > 0 ? 1.85 : 1.0);
    if (!e.stopped && e.x > e.stopX) {
      e.x = Math.max(e.stopX, e.x - moveSpeed * enemyDt);
      if (!e.cfg.air && Math.random() < dt * 8) {
        spawnParticles(e.x - e.cfg.width * 0.44, getWaveY(e.x) + 2, 1, {
          color: 'rgba(255,255,255,0.55)', speed: 55, gravity: 200, size: 2.2, life: 0.35, spread: 1.0, angle: -0.9,
        });
      }
      e.windup = 0;
      if (e.x <= e.stopX) {
        if (e.cfg.kamikaze) {
          // Suicide yacht slams straight into the tower!
          damageTower(e.damage * 1.6, L.seaY - 40);
          sinkEnemyShip(e, true);
          continue;
        }
        e.stopped = true;
        e.attackTimer = 1.4;
        // Carrier deploys 2-6 miniTurretBoats upon anchoring!
        if (e.cfg.carrier && !e.deployed) {
          e.deployed = true;
          const deployN = 2 + Math.floor(Math.random() * 5); // 2 to 6 boats
          addPopup(e.x, e.y - 68, `運兵母艦釋放 ${deployN} 艘砲艇！`, '#ffeaa7', 15);
          for (let d = 0; d < deployN; d++) {
            const mCfg = ENEMY_TYPES.miniTurretBoat;
            const towerEdge = L.towerX + L.towerW * 0.5;
            const span = Math.max(160, L.worldW - towerEdge);
            const mStop = towerEdge + span * (0.15 + Math.random() * 0.65);
            state.enemies.push({
              id: Math.random().toString(36).slice(2),
              type: 'miniTurretBoat',
              cfg: mCfg,
              x: e.x + (d - deployN * 0.5) * 28,
              y: L.seaY,
              hp: Math.round(mCfg.hp * Math.pow(1.18, state.intensity - 1)),
              maxHp: Math.round(mCfg.hp * Math.pow(1.18, state.intensity - 1)),
              armor: 0,
              speed: mCfg.speed * (L.isPortrait ? 0.74 : 1.0),
              damage: Math.round(mCfg.damage * (1 + (state.intensity - 1) * 0.18)),
              stopX: mStop,
              stopped: false,
              attackTimer: 1.8 + d * 0.4,
              windup: 0, fireRecoil: 0,
              bounty: Math.round(mCfg.bounty * (1 + (state.intensity - 1) * 0.2)),
              burnTimer: 0, burnDps: 0, freezeTimer: 0, hitFlash: 0,
              bobPhase: Math.random() * 6, listAngle: 0, cracks: [],
              crew: mCfg.crewSlots.map((s) => ({ ox: s.ox, oy: s.oy, gunner: !!s.gunner, alive: true })),
              unmannedTimer: 0, armorMod: null, armorHp: 0, empAmmo: false, missileAmmo: false,
              autoTurrets: [], deployed: true, subDepth: 0,
            });
          }
        }
      }
    } else {
      e.stopped = true;
      e.attackTimer -= enemyDt;
      e.windup = e.attackTimer <= 1.2 ? clamp(1 - e.attackTimer / 1.2, 0, 1) : 0;
      if (e.attackTimer <= 0) {
        e.attackTimer = 5.0; // Fire every 5 seconds
        e.windup = 0;
        e.fireRecoil = 1.0;
        fireEnemyProjectile(e);
      }
    }
  }

  // Update Enemy Projectiles
  for (let i = state.enemyProjs.length - 1; i >= 0; i--) {
    const ep = state.enemyProjs[i];
    if (ep.type === 'missile') {
      if (ep.phase === 'rise') {
        ep.riseTimer -= enemyDt;
        ep.y += ep.vy * enemyDt;
        if (Math.random() < 0.6) spawnParticles(ep.x, ep.y + 8, 1, { color: 'rgba(255,255,255,0.7)', speed: 30, gravity: 20, size: 2.5, life: 0.35 });
        if (ep.riseTimer <= 0) {
          ep.phase = 'dive';
          const dx = ep.tx - ep.x, dy = ep.ty - ep.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const spd = 760;
          ep.vx = (dx / d) * spd;
          ep.vy = (dy / d) * spd;
        }
      } else {
        ep.x += ep.vx * enemyDt;
        ep.y += ep.vy * enemyDt;
        if (Math.random() < 0.7) spawnParticles(ep.x, ep.y, 1, { color: '#ffb142', speed: 40, gravity: 0, size: 2.4, life: 0.25 });
      }
    } else {
      ep.vx += state.windX * 0.45 * enemyDt;
      ep.vy += ep.gravity * enemyDt;
      ep.x += ep.vx * enemyDt;
      ep.y += ep.vy * enemyDt;
    }

    if (
      ep.x - ep.r <= L.towerX + L.towerW * 0.52 &&
      ep.x + ep.r >= L.towerX - L.towerW * 0.52 &&
      ep.y + ep.r >= L.towerTopY - 10 &&
      ep.y - ep.r <= L.seaY
    ) {
      if (ep.type === 'emp' && state.shieldTimer <= 0) {
        state.empTimer = 12.0;
        addPopup(L.towerX, L.towerTopY - 36, 'EMP 命中！掛件癱瘓 12 秒', '#a5f3fc', 16);
        spawnParticles(L.towerX, ep.y, 20, { color: '#a5f3fc', speed: 200, gravity: 40, size: 3.5, life: 0.65 });
      }
      damageTower(ep.damage, ep.y);
      state.enemyProjs.splice(i, 1);
      continue;
    }

    if (ep.y >= getWaveY(ep.x) || ep.x < -60) {
      if (ep.y >= L.seaY - 15) spawnWaterSplash(ep.x, 0.45);
      state.enemyProjs.splice(i, 1);
    }
  }

  updateVisualSubsystems(dt);
  updateHud();

  autoSaveAccum += dt;
  if (autoSaveAccum >= 2.0) {
    autoSaveAccum = 0;
    saveProgress();
  }
}

function updateTowerAddons(dt) {
  if (state.empTimer > 0) return; // Disabled by EMP!
  // 1. Auto Ballista
  if (state.addons.ballista > 0 && state.enemies.length > 0) {
    state.ballistaTimer -= dt;
    if (state.ballistaTimer <= 0) {
      const lv = state.addons.ballista;
      state.ballistaTimer = Math.max(0.45, 1.85 - lv * 0.28);
      const nearest = state.enemies.reduce((best, e) => (!best || e.x < best.x ? e : best), null);
      if (nearest) {
        const bx = L.towerX + L.towerW * 0.48;
        const by = L.towerTopY + 56;
        const dmg = 14 + lv * 7;
        state.tracers.push({ x1: bx, y1: by, x2: nearest.x, y2: nearest.y - nearest.cfg.height * 0.5, life: 0.14, color: '#ffffff' });
        const aliveC = nearest.crew.find((c) => c.alive);
        if (aliveC && Math.random() < 0.45) killCrewMember(nearest, aliveC, 90, -140, '連弩點殺');
        damageEnemyHull(nearest, dmg, { hitX: nearest.x, hitY: nearest.y - 12 });
        sound.playThrow('triple');
      }
    }
  }

  // 2. AA Intercept Net (Shoots down enemy projectiles & pirate zeppelins)
  if (state.addons.aa > 0) {
    state.aaTimer -= dt;
    if (state.aaTimer <= 0) {
      const lv = state.addons.aa;
      const ax = L.towerX + L.towerW * 0.35;
      const ay = L.towerTopY + 14;
      // Priority 1: Incoming enemy projectile
      const threat = state.enemyProjs.find((ep) => !ep.uninterceptable && ep.x < L.worldW * 0.65);
      if (threat) {
        state.aaTimer = Math.max(0.4, 1.7 - lv * 0.26);
        state.tracers.push({ x1: ax, y1: ay, x2: threat.x, y2: threat.y, life: 0.16, color: '#a5f3fc' });
        spawnParticles(threat.x, threat.y, 10, { color: '#ffffff', speed: 120, life: 0.35 });
        const tidx = state.enemyProjs.indexOf(threat); if (tidx !== -1) state.enemyProjs.splice(tidx, 1);
      } else {
        // Priority 2: Airships
        const airTarget = state.enemies.find((e) => e.cfg.air);
        if (airTarget) {
          state.aaTimer = Math.max(0.45, 1.5 - lv * 0.2);
          state.tracers.push({ x1: ax, y1: ay, x2: airTarget.x, y2: airTarget.y, life: 0.16, color: '#a5f3fc' });
          damageEnemyHull(airTarget, 18 + lv * 9, { hitX: airTarget.x, hitY: airTarget.y });
        }
      }
    }
  }

  // 3. Auto Repairbot
  if (state.addons.repairbot > 0 && state.towerHp < state.towerMaxHp) {
    const lv = state.addons.repairbot;
    state.towerHp = Math.min(state.towerMaxHp, state.towerHp + (2.5 + lv * 2.2) * dt);
    state.repairTick += dt;
    if (state.repairTick >= 3.5) {
      state.repairTick = 0;
      if (state.towerDents.length > 0) state.towerDents.pop();
      if (state.towerCracks.length > 0) state.towerCracks.pop();
      spawnParticles(L.towerX, L.towerTopY + 70, 5, { color: '#ffffff', speed: 60, gravity: -50, size: 2.5, life: 0.5 });
    }
  }

  // 4. Coastal Auto Mortar
  if (state.addons.mortar > 0 && state.enemies.length > 0) {
    state.mortarTimer -= dt;
    if (state.mortarTimer <= 0) {
      const lv = state.addons.mortar;
      state.mortarTimer = Math.max(1.8, 4.4 - lv * 0.52);
      const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
      if (target) {
        const mx = L.towerX + L.towerW * 0.42;
        const my = L.towerTopY + 95;
        const q = solveQuickBallistic(target.x, target.y - 10);
        state.playerProjs.push({
          type: 'bomb',
          isShard: true,
          x: mx, y: my,
          vx: q.vx, vy: q.vy - 40,
          r: 10,
          damage: 30 + lv * 14,
          aoe: 85 + lv * 8,
          pierceLeft: 1,
          hitIds: new Set(),
          burnDps: 0, burnDur: 0, freezeDur: 0, splitDone: true,
          rot: 0, trail: [], hasHitAnything: true,
        });
        sound.playThrow('bomb');
      }
    }
  }
}

function updateVisualSubsystems(dt) {
  // Physical Coin Drops (pulled toward tower by Coin Magnet!)
  const magnetLv = state.addons.magnet;
  for (let i = state.coinDrops.length - 1; i >= 0; i--) {
    const c = state.coinDrops[i];
    c.life += dt;
    c.spin += dt * 10;
    const pullDelay = magnetLv > 0 ? 0.22 : 0.55;
    if (c.life < pullDelay) {
      c.vy += GRAVITY * 0.65 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    } else {
      const tx = L.towerX;
      const ty = L.towerTopY + 30;
      const pullSpeed = 480 + magnetLv * 240;
      const dx = tx - c.x;
      const dy = ty - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 28 || c.life > 2.4) {
        state.coins += c.val;
        state.coinDrops.splice(i, 1);
        continue;
      }
      c.x += (dx / dist) * pullSpeed * dt;
      c.y += (dy / dist) * pullSpeed * dt;
    }
  }

  // Ragdoll Stickmen
  for (let i = state.ragdolls.length - 1; i >= 0; i--) {
    const rg = state.ragdolls[i];
    rg.life -= dt;
    rg.vy += GRAVITY * 0.85 * dt;
    rg.x += rg.vx * dt;
    rg.y += rg.vy * dt;
    rg.rot += rg.vrot * dt;
    if (rg.y >= getWaveY(rg.x)) {
      spawnWaterSplash(rg.x, 0.5);
      state.ragdolls.splice(i, 1);
    } else if (rg.life <= 0) {
      state.ragdolls.splice(i, 1);
    }
  }

  // Debris Chunks
  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];
    d.life -= dt;
    d.vy += GRAVITY * 0.9 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.rot += d.vrot * dt;
    if (d.y >= getWaveY(d.x) || d.life <= 0) {
      state.debris.splice(i, 1);
    }
  }

  // Sinking Ships (including split-half sinking!)
  for (let i = state.sinking.length - 1; i >= 0; i--) {
    const s = state.sinking[i];
    s.life -= dt;
    s.y += s.vy * dt;
    s.tilt += s.tiltDir * dt * 0.95;
    if (s.split) s.splitGap += dt * 36;
    s.alpha = clamp(s.life / 1.65, 0, 1);
    if (s.life <= 0) state.sinking.splice(i, 1);
  }

  // Tidal Waves
  for (let i = state.waves.length - 1; i >= 0; i--) {
    const wv = state.waves[i];
    wv.x += wv.vx * dt;
    // Clear enemy projectiles in wave path
    for (let j = state.enemyProjs.length - 1; j >= 0; j--) {
      if (Math.abs(state.enemyProjs[j].x - wv.x) < wv.width) {
        state.enemyProjs.splice(j, 1);
      }
    }
    // Knockback & damage surface ships
    for (const e of [...state.enemies]) {
      if (!e || !state.enemies.includes(e)) continue;
      if (e.cfg.air || wv.hitIds.has(e.id)) continue;
      if (Math.abs(e.x - wv.x) < wv.width * 0.65 + e.cfg.width * 0.4) {
        wv.hitIds.add(e.id);
        e.x = Math.min(L.worldW - 40, e.x + 165);
        e.stopped = false;
        e.windup = 0;
        damageEnemyHull(e, wv.damage, { hitX: e.x, hitY: e.y - 16 });
      }
    }
    if (wv.x > L.worldW + 120) state.waves.splice(i, 1);
  }

  // Lightning Bolts
  for (let i = state.lightningBolts.length - 1; i >= 0; i--) {
    state.lightningBolts[i].life -= dt;
    if (state.lightningBolts[i].life <= 0) state.lightningBolts.splice(i, 1);
  }

  // Tracers
  for (let i = state.tracers.length - 1; i >= 0; i--) {
    state.tracers[i].life -= dt;
    if (state.tracers[i].life <= 0) state.tracers.splice(i, 1);
  }

  // Particles & Popups
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) { state.particles.splice(i, 1); continue; }
    if (pt.type === 'ring') pt.r = pt.maxR * (1 - pt.life / pt.maxLife);
    else { pt.vy += pt.gravity * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; }
  }
  for (let i = state.popups.length - 1; i >= 0; i--) {
    const pp = state.popups[i];
    pp.life -= dt;
    pp.y += pp.vy * dt;
    if (pp.life <= 0) state.popups.splice(i, 1);
  }

  // Water Plumes
  for (let i = state.plumes.length - 1; i >= 0; i--) {
    const pl = state.plumes[i];
    pl.life -= dt;
    pl.h = pl.maxH * Math.sin((1 - pl.life / pl.maxLife) * Math.PI);
    if (pl.life <= 0) state.plumes.splice(i, 1);
  }
  // Water Ripples
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const rp = state.ripples[i];
    rp.life -= dt;
    rp.r = rp.maxR * (1 - rp.life / rp.maxLife);
    if (rp.life <= 0) state.ripples.splice(i, 1);
  }

  // Shooting Stars
  state.shootingStarTimer -= dt;
  if (state.shootingStarTimer <= 0) {
    state.shootingStarTimer = 7 + Math.random() * 10;
    state.shootingStars.push({
      x: L.worldW * (0.35 + Math.random() * 0.6),
      y: 25 + Math.random() * 90,
      vx: -420 - Math.random() * 180,
      vy: 140 + Math.random() * 90,
      life: 0.55,
      maxLife: 0.55,
    });
  }
  for (let i = state.shootingStars.length - 1; i >= 0; i--) {
    const ss = state.shootingStars[i];
    ss.life -= dt;
    ss.x += ss.vx * dt;
    ss.y += ss.vy * dt;
    if (ss.life <= 0) state.shootingStars.splice(i, 1);
  }

  // Coastal Seabirds
  state.birds.forEach((b) => {
    b.phase += dt * 5;
    b.x += (b.vx + state.windX * 0.15) * dt;
    if (b.x < -80) { b.x = L.worldW + 80; b.y = 70 + Math.random() * 140; }
  });

  // Weather Rain Drops
  const rainRate = WEATHER_STATES[state.weatherIdx].rain;
  if (rainRate > 0) {
    state.rainDrops.forEach((rd) => {
      rd.x += state.windX * 1.6 * dt;
      rd.y += 720 * dt;
      if (rd.y > L.worldH) { rd.y = -20; rd.x = Math.random() * (L.worldW + 240); }
      if (rd.x < -120) rd.x = L.worldW + 100;
    });
  }
}

function detonatePlayerProj(p) {
  const isFire = p.type === 'fire';
  const isFrost = p.type === 'frost';
  spawnExplosion(p.x, p.y, p.aoe, isFire);
  if (isFrost) {
    spawnParticles(p.x, p.y, 20, { color: '#a5f3fc', speed: 200, gravity: 90, size: 4, life: 0.75 });
  }
  for (const e of [...state.enemies]) {
    if (!e || !state.enemies.includes(e)) continue;
    const dist = Math.hypot(e.x - p.x, (e.y - e.cfg.height * 0.4) - p.y);
    if (dist <= p.aoe + e.cfg.width * 0.44) {
      const falloff = 1 - (dist / (p.aoe + e.cfg.width * 0.5)) * 0.35;
      if (isFrost && p.freezeDur) {
        e.freezeTimer = Math.max(e.freezeTimer || 0, p.freezeDur);
        e.windup = 0;
        addPopup(e.x, e.y - e.cfg.height - 32, '凍結！', '#a5f3fc', 14);
      }
      damageEnemyHull(e, p.damage * falloff, {
        ignoreArmor: p.type === 'bomb',
        burnDps: p.burnDps,
        burnDur: p.burnDur,
        breachForce: p.type === 'bomb',
      });
    }
  }
}

function fireEnemyProjectile(e) {
  const turrets = e.cfg.turrets || [{ ox: -e.cfg.width * 0.25, oy: -e.cfg.height - 6, scale: 1 }];
  // Fire from primary turret (or up to 2 turrets on multi-turret ships / boss)
  const activeTurrets = e.cfg.boss ? turrets : [turrets[Math.floor(Math.random() * turrets.length)]];

  activeTurrets.forEach((tr, idx) => {
    const sx = e.x + tr.ox - 16 * (tr.scale || 1);
    const sy = e.y + tr.oy - 6;
    const tx = L.towerX + (Math.random() - 0.5) * 32;
    const ty = L.towerTopY + 32 + Math.random() * (L.seaY - L.towerTopY - 56);

    spawnParticles(sx, sy, 8, {
      color: '#ffffff', speed: 120, gravity: -30, size: 3.4, life: 0.42, spread: 0.9, angle: Math.PI,
    });

    const dmgEach = e.cfg.boss ? Math.round(e.damage * 0.55) : e.damage;
    if (e.empAmmo) {
      const g = 500;
      const t = clamp(Math.abs(sx - tx) / 340, 0.85, 1.7);
      state.enemyProjs.push({
        type: 'emp', uninterceptable: true, x: sx, y: sy,
        vx: (tx - sx) / t, vy: (ty - sy - 0.5 * g * t * t) / t,
        gravity: g, r: 9.5, damage: Math.round(dmgEach * 0.7),
      });
    } else if (e.missileAmmo) {
      // Vertical Launch Missile: shoots straight UP then dives fast at tower!
      state.enemyProjs.push({
        type: 'missile', phase: 'rise', riseTimer: 0.55,
        x: sx, y: sy - 6, vx: 0, vy: -520, tx, ty,
        gravity: 0, r: 7.5, damage: Math.round(dmgEach * 1.15),
      });
    } else if (e.cfg.projType === 'airbomb') {
      const t = 1.2 + idx * 0.15;
      state.enemyProjs.push({ type: 'airbomb', x: sx, y: sy, vx: (tx - sx) / t, vy: 40, gravity: 460, r: 9, damage: dmgEach });
    } else {
      const g = 520;
      const t = clamp(Math.abs(sx - tx) / (L.isPortrait ? 280 : 360), 0.85, 1.85) + idx * 0.12;
      state.enemyProjs.push({
        type: e.cfg.projType, x: sx, y: sy,
        vx: (tx - sx) / t,
        vy: (ty - sy - 0.5 * g * t * t) / t,
        gravity: g,
        r: e.cfg.projType === 'arrow' ? 5 : 8,
        damage: dmgEach,
      });
    }
  });
}

// ============================================================
// CANVAS RENDERING
// ============================================================
function render() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  ctx.fillStyle = cachedSkyGrad || '#0b0d10';
  ctx.fillRect(0, 0, vw, vh);

  if (state.lightningFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.lightningFlash * 0.45})`;
    ctx.fillRect(0, 0, vw, vh);
  }

  ctx.save();
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  ctx.translate(L.offsetX + shakeX, L.offsetY + shakeY);
  ctx.scale(L.scale, L.scale);

  drawBackgroundDecor();
  drawCliffAndTower();
  if (!state.collapsing) drawCatapultAndStickman();
  drawShieldDome();
  drawSeaBack();
  drawMines();
  drawSupplyCrates();
  drawSinkingShips();
  drawEnemies();
  drawRollingStones();
  drawRagdolls();
  drawProjectiles();
  drawTracers();
  drawTidalWavesAndLightning();
  drawRain();
  drawDebris();
  drawCoinDrops();
  drawSeaFront();
  drawWeatherOverlay();
  drawParticles();
  drawAimTrajectory();
  drawSkillTargetingOverlay();
  drawPopups();

  ctx.restore();
}

function drawBackgroundDecor() {
  const t = state.elapsed;
  ctx.save();

  // Twinkling Starfield
  state.stars.forEach((st) => {
    const a = 0.18 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + st.phase));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(st.x * L.worldW, st.y * L.seaY, st.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const moonX = L.worldW * 0.77;
  const moonY = L.isPortrait ? 180 : 142;
  const glow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 165);
  glow.addColorStop(0, 'rgba(255,255,255,0.24)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(moonX, moonY, 165, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(moonX, moonY, 24, 0, Math.PI * 2); ctx.fill();

  // Shooting Stars
  state.shootingStars.forEach((ss) => {
    const a = clamp(ss.life / ss.maxLife, 0, 1);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * a})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(ss.x - ss.vx * 0.09, ss.y - ss.vy * 0.09);
    ctx.stroke();
  });

  // Sweeping Tower Searchlight Cone across the dark sea
  if (!state.collapsing) {
    const sx = L.towerX + L.towerW * 0.35;
    const sy = L.towerTopY + 18;
    const sweepAng = 0.22 + Math.sin(t * 0.45) * 0.16;
    const beamLen = L.worldW * 0.72;
    const bx1 = sx + Math.cos(sweepAng - 0.08) * beamLen;
    const by1 = sy + Math.sin(sweepAng - 0.08) * beamLen;
    const bx2 = sx + Math.cos(sweepAng + 0.08) * beamLen;
    const by2 = sy + Math.sin(sweepAng + 0.08) * beamLen;
    const beamGrad = ctx.createLinearGradient(sx, sy, (bx1 + bx2) * 0.5, (by1 + by2) * 0.5);
    beamGrad.addColorStop(0, 'rgba(255,255,255,0.09)');
    beamGrad.addColorStop(0.55, 'rgba(255,255,255,0.03)');
    beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.closePath();
    ctx.fill();
  }

  // Gliding Coastal Seabirds
  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.lineWidth = 1.4;
  state.birds.forEach((b) => {
    const flap = Math.sin(b.phase) * 4;
    ctx.beginPath();
    ctx.moveTo(b.x - 8, b.y - flap);
    ctx.quadraticCurveTo(b.x - 3, b.y - 4, b.x, b.y);
    ctx.quadraticCurveTo(b.x + 3, b.y - 4, b.x + 8, b.y - flap);
    ctx.stroke();
  });

  // Distant sleek mountains
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.beginPath();
  ctx.moveTo(-120, L.seaY);
  ctx.lineTo(L.worldW * 0.15, L.seaY - 130);
  ctx.lineTo(L.worldW * 0.35, L.seaY - 60);
  ctx.lineTo(L.worldW * 0.56, L.seaY - 155);
  ctx.lineTo(L.worldW * 0.8, L.seaY - 75);
  ctx.lineTo(L.worldW + 120, L.seaY);
  ctx.closePath();
  ctx.fill();

  // Wind streaks when windy
  if (Math.abs(state.windX) > 30) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const wx = ((t * state.windX * 2.5 + i * 210) % (L.worldW + 240) + L.worldW + 240) % (L.worldW + 240) - 120;
      const wy = 90 + i * 55;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 65, wy); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCliffAndTower() {
  const x = L.towerX - L.towerW * 0.5;
  const w = L.towerW;
  const topY = L.towerTopY;
  const h = L.seaY - topY;
  const tier = TOWER_TIERS[state.towerTier];

  // Coastal cliff foundation
  ctx.save();
  ctx.fillStyle = '#0d1015';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-180, L.worldH + 120);
  ctx.lineTo(-180, L.seaY - 10);
  ctx.lineTo(x + w + 22, L.seaY - 8);
  ctx.lineTo(x + w + 42, L.seaY + 28);
  ctx.lineTo(x + w + 55, L.worldH + 120);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // If collapsing, draw tumbling structural blocks instead of intact tower!
  if (state.collapsing) {
    state.collapseBlocks.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1.8;
      ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);
      ctx.strokeRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);
      ctx.restore();
    });
    ctx.restore();
    return;
  }

  // Slight structural lean when heavily damaged!
  const dmgRatio = 1 - clamp(state.towerHp / state.towerMaxHp, 0, 1);
  const lean = dmgRatio > 0.55 ? (dmgRatio - 0.55) * 0.14 : 0;

  ctx.translate(L.towerX, L.seaY);
  ctx.rotate(lean);
  ctx.translate(-L.towerX, -L.seaY);

  // Build tower outline with REAL PHYSICAL DENTS carved into the right wall!
  ctx.fillStyle = state.towerFlash > 0 ? 'rgba(255,107,107,0.45)' : tier.color;
  ctx.strokeStyle = 'rgba(255,255,255,0.68)';
  ctx.lineWidth = 2;

  const sortedDents = [...state.towerDents].sort((a, b) => a.yRel - b.yRel);
  ctx.beginPath();
  ctx.moveTo(x, L.seaY);
  ctx.lineTo(x, topY);
  ctx.lineTo(x + w, topY);

  // Trace right wall carving inward craters at each dent
  let cursorY = topY;
  for (const d of sortedDents) {
    const cy = topY + d.yRel * h;
    const yStart = Math.max(cursorY + 2, cy - d.radius);
    const yEnd = Math.min(L.seaY - 2, cy + d.radius);
    if (yStart < yEnd) {
      ctx.lineTo(x + w, yStart);
      ctx.lineTo(x + w - d.depth, cy);
      ctx.lineTo(x + w, yEnd);
      cursorY = yEnd;
    }
  }
  ctx.lineTo(x + w, L.seaY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Architectural texture lines by tier
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 1.2;
  const tid = state.towerTier;
  if (tid === 0) {
    for (let y = topY + 22; y < L.seaY; y += 22) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - 4, y); ctx.stroke(); }
  } else if (tid === 1 || tid === 2) {
    for (let y = topY + 24; y < L.seaY; y += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - 4, y); ctx.stroke(); }
    if (tid === 2) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 6, topY + 14, w - 12, h - 22); }
  } else if (tid === 3 || tid === 4) {
    for (let y = topY + 34; y < L.seaY; y += 34) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - 4, y); ctx.stroke();
      if (tid === 4) { ctx.beginPath(); ctx.moveTo(x + 4, y - 34); ctx.lineTo(x + w - 6, y); ctx.stroke(); }
    }
  } else if (tid === 6) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, topY + 8, w + 10, h - 10);
  } else if (tid === 7 || tid === 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x + 14, topY); ctx.lineTo(x + 14, L.seaY); ctx.moveTo(x + w - 14, topY); ctx.lineTo(x + w - 14, L.seaY); ctx.stroke();
  } else if (tid >= 9) {
    // T10-T15 high-tech / fortress architectural accents
    ctx.strokeStyle = tid >= 12 ? 'rgba(165,243,252,0.58)' : 'rgba(255,255,255,0.52)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 11, topY); ctx.lineTo(x + 11, L.seaY);
    ctx.moveTo(x + w - 11, topY); ctx.lineTo(x + w - 11, L.seaY);
    ctx.stroke();
    // Diagonal truss / armor chevrons
    for (let y = topY + 26; y < L.seaY - 12; y += 30) {
      ctx.beginPath();
      ctx.moveTo(x + 11, y); ctx.lineTo(x + w * 0.5, y - 10); ctx.lineTo(x + w - 11, y);
      ctx.stroke();
    }
    if (tid >= 12) {
      // Glowing energy core spine (EM / Obsidian / Prism Citadel)
      const pulse = 0.55 + Math.sin(state.elapsed * 5) * 0.25;
      ctx.strokeStyle = tid === 14 ? `rgba(255,255,255,${pulse})` : `rgba(165,243,252,${pulse})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, topY + 12);
      ctx.lineTo(x + w * 0.5, L.seaY - 12);
      ctx.stroke();
    }
    if (tid === 14) {
      // Prism crown halo
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6;
      ctx.strokeRect(x - 10, topY - 10, w + 20, 6);
    }
  }

  // Dynamic Structural Cracks
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.4;
  state.towerCracks.forEach((cr) => {
    const cx = x + cr.xRel * w;
    const cy = topY + cr.yRel * h;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const mx = cx + Math.cos(cr.ang) * cr.len * 0.5;
    const my = cy + Math.sin(cr.ang) * cr.len * 0.5;
    ctx.lineTo(mx, my);
    ctx.lineTo(mx + Math.cos(cr.ang + 0.45) * cr.len * 0.5, my + Math.sin(cr.ang + 0.45) * cr.len * 0.5);
    ctx.stroke();
  });

  // Top deck platform
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 8, topY - 4, w + 16, 5);

  // Draw Installed Tower Attachments!
  if (state.addons.ballista > 0) {
    const bx = x + w - 2;
    const by = topY + 56;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx + 18, by - 4); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + 6, by - 2, 9, -1.1, 1.1); ctx.stroke();
  }
  if (state.addons.aa > 0) {
    const ax = x + w - 8;
    const ay = topY + 14;
    ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(ax, ay, 10, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 11, ay - 12); ctx.stroke();
  }
  if (state.addons.magnet > 0) {
    ctx.strokeStyle = `rgba(255,234,167,${0.25 + Math.sin(state.elapsed * 5) * 0.12})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(L.towerX, topY + 26, 22 + Math.sin(state.elapsed * 4) * 3, 0, Math.PI * 2); ctx.stroke();
  }
  if (state.addons.mortar > 0) {
    const mx = x + w - 4, my = topY + 95;
    ctx.save(); ctx.translate(mx, my); ctx.rotate(-0.65);
    ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.fillRect(0, -5, 22, 10); ctx.strokeRect(0, -5, 22, 10);
    ctx.restore();
  }
  if (state.addons.stabilizer > 0) {
    const vx = x + 6, vy = topY - 4;
    ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - 24); ctx.stroke();
    ctx.beginPath(); ctx.arc(vx, vy - 24, 5, 0, Math.PI * 2); ctx.stroke();
  }

  // Diegetic Wind Banner Flag fluttering on tower left edge!
  const fx = x - 4, fy = topY - 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 34); ctx.stroke();
  const fDir = state.windX < -15 ? -1 : state.windX > 15 ? 1 : 1;
  const fLen = 14 + Math.min(18, Math.abs(state.windX) * 0.14);
  const fWave = Math.sin(state.elapsed * (6 + Math.abs(state.windX) * 0.06)) * 3.5;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath();
  ctx.moveTo(fx, fy - 34);
  ctx.quadraticCurveTo(fx + fDir * fLen * 0.5, fy - 34 + fWave, fx + fDir * fLen, fy - 28 + fWave * 0.6);
  ctx.lineTo(fx, fy - 22);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCatapultAndStickman() {
  ctx.save();
  const baseX = L.catapultX;
  const baseY = L.towerTopY - 4;

  // Stickman defender
  const sx = baseX - 26;
  const sy = baseY;
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 13); ctx.lineTo(sx - 5, sy);
  ctx.moveTo(sx, sy - 13); ctx.lineTo(sx + 5, sy);
  ctx.moveTo(sx, sy - 13); ctx.lineTo(sx + (state.aiming ? -3 : 0), sy - 28);
  ctx.moveTo(sx - 1, sy - 24); ctx.lineTo(sx + 13, sy - 18);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(sx + (state.aiming ? -3 : 0), sy - 33, 5, 0, Math.PI * 2); ctx.fill();

  const lid = state.launcher || 'catapult';
  const aimAng = state.aiming ? Math.atan2(state.aimVy, Math.max(40, state.aimVx)) : -0.55;
  const recoilShift = state.catapultRecoil * 7;
  const ps = state.projectiles[state.selectedProj];
  const hasAmmo = ps && ps.charges >= 1;

  if (lid === 'cannon' || lid === 'railgun' || lid === 'tricannon') {
    // Turret pedestal + rotating barrel(s)
    const pivX = baseX + 8, pivY = baseY - 14;
    ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(pivX, baseY - 2, 13, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(pivX, pivY);
    ctx.rotate(clamp(aimAng, -1.25, 0.2));
    if (lid === 'cannon') {
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-8 - recoilShift, -7); ctx.lineTo(28 - recoilShift, -4.5);
      ctx.lineTo(28 - recoilShift, 4.5); ctx.lineTo(-8 - recoilShift, 7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(26 - recoilShift, -6, 4, 12);
    } else if (lid === 'railgun') {
      ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-6 - recoilShift, -6); ctx.lineTo(36 - recoilShift, -4.5);
      ctx.moveTo(-6 - recoilShift, 6); ctx.lineTo(36 - recoilShift, 4.5);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      for (let rx = 2; rx <= 28; rx += 8) {
        ctx.beginPath(); ctx.moveTo(rx - recoilShift, -5.5); ctx.lineTo(rx - recoilShift, 5.5); ctx.stroke();
      }
      if (hasAmmo) {
        ctx.fillStyle = '#a5f3fc';
        ctx.beginPath(); ctx.arc(28 - recoilShift, 0, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // tricannon: heavy triple naval turret
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
      ctx.fillRect(-10, -10, 22, 20); ctx.strokeRect(-10, -10, 22, 20);
      [-5.5, 0, 5.5].forEach((by) => {
        ctx.beginPath();
        ctx.moveTo(10 - recoilShift, by);
        ctx.lineTo(36 - recoilShift, by);
        ctx.stroke();
      });
    }
    ctx.restore();
  } else {
    // Catapult / Trebuchet / Twin-arm frame
    ctx.beginPath();
    ctx.moveTo(baseX - 9, baseY - 5); ctx.lineTo(baseX + 24, baseY - 5);
    const frameH = lid === 'trebuchet' ? 38 : 31;
    ctx.moveTo(baseX + 3, baseY - 5); ctx.lineTo(baseX + 13, baseY - frameH); ctx.lineTo(baseX + 20, baseY - 5);
    ctx.stroke();

    ctx.fillStyle = '#0b0d10';
    [baseX - 3, baseX + 20].forEach((wx) => {
      ctx.beginPath(); ctx.arc(wx, baseY - 4, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    let armAngle = -0.85;
    if (state.aiming) armAngle = -0.85 - clamp(Math.hypot(state.aimVx, state.aimVy) / 1150, 0, 1) * 1.35;
    else if (state.catapultRecoil > 0) armAngle = -0.85 + state.catapultRecoil * 0.95;

    const px = baseX + 9, py = baseY - (lid === 'trebuchet' ? 20 : 11);
    const armLen = lid === 'trebuchet' ? 40 : 34;
    const tx = px + Math.cos(armAngle) * armLen;
    const ty = py + Math.sin(armAngle) * armLen;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();

    if (lid === 'trebuchet') {
      // Counterweight box on opposite end of lever
      const cx = px - Math.cos(armAngle) * 13;
      const cy = py - Math.sin(armAngle) * 13;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5, cy - 4, 10, 10);
    } else if (lid === 'twin') {
      // Secondary parallel throwing arm
      const tx2 = px + 6 + Math.cos(armAngle + 0.14) * 30;
      const ty2 = py + Math.sin(armAngle + 0.14) * 30;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(px + 6, py); ctx.lineTo(tx2, ty2); ctx.stroke();
      if (hasAmmo) {
        ctx.fillStyle = state.selectedProj === 'fire' ? '#ffb142' : '#ffffff';
        ctx.beginPath(); ctx.arc(tx2, ty2 - 2, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (hasAmmo) {
      ctx.fillStyle = state.selectedProj === 'fire' ? '#ffb142' : '#ffffff';
      ctx.beginPath(); ctx.arc(tx, ty - 2, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawShieldDome() {
  if (state.empTimer > 0 && !state.collapsing) {
    ctx.save();
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.8)';
    ctx.lineWidth = 1.6;
    for (let a = 0; a < 3; a++) {
      const sy = L.towerTopY + 20 + Math.random() * (L.seaY - L.towerTopY - 40);
      ctx.beginPath();
      ctx.moveTo(L.towerX - L.towerW * 0.45, sy);
      ctx.lineTo(L.towerX + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 18);
      ctx.lineTo(L.towerX + L.towerW * 0.45, sy + (Math.random() - 0.5) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (state.shieldTimer <= 0) return;
  ctx.save();
  const pulse = 0.85 + Math.sin(state.elapsed * 10) * 0.15;
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * pulse})`;
  ctx.fillStyle = `rgba(255,255,255,${0.09 * pulse})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(L.towerX, L.towerTopY + 90, L.isPortrait ? 122 : 148, -Math.PI * 0.65, Math.PI * 0.5);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function drawSeaBack() {
  const amp = WEATHER_STATES[state.weatherIdx].waveAmp;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  ctx.beginPath();
  ctx.moveTo(-160, L.worldH + 100);
  for (let x = -160; x <= L.worldW + 160; x += 32) {
    ctx.lineTo(x, L.seaY - 5 + Math.sin(x * 0.014 + state.elapsed * 1.8) * amp * 0.9);
  }
  ctx.lineTo(L.worldW + 160, L.worldH + 100);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSeaFront() {
  ctx.save();
  const seaGrad = ctx.createLinearGradient(0, L.seaY, 0, L.worldH);
  seaGrad.addColorStop(0, 'rgba(16, 22, 30, 0.88)');
  seaGrad.addColorStop(1, '#06080b');
  ctx.fillStyle = seaGrad;
  ctx.beginPath();
  ctx.moveTo(-160, L.worldH + 120);
  for (let x = -160; x <= L.worldW + 160; x += 26) ctx.lineTo(x, getWaveY(x) + 3);
  ctx.lineTo(L.worldW + 160, L.worldH + 120);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = -160; x <= L.worldW + 160; x += 26) {
    const y = getWaveY(x) + 3;
    if (x === -160) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Vertical Water Plume Columns
  state.plumes.forEach((pl) => {
    const a = clamp(pl.life / pl.maxLife, 0, 1);
    ctx.fillStyle = `rgba(255,255,255,${0.55 * a})`;
    ctx.beginPath();
    ctx.moveTo(pl.x - pl.w * 0.5, pl.y);
    ctx.quadraticCurveTo(pl.x, pl.y - pl.h * 1.4, pl.x + pl.w * 0.5, pl.y);
    ctx.closePath();
    ctx.fill();
  });

  // Expanding Elliptical Water Ripple Rings
  state.ripples.forEach((rp) => {
    const a = clamp(rp.life / rp.maxLife, 0, 1);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * a})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Shimmering Moonlight Reflection Path on Water
  const moonX = L.worldW * 0.77;
  for (let i = 0; i < 6; i++) {
    const ry = L.seaY + 18 + i * 16;
    const rw = Math.max(12, 58 - i * 7) + Math.sin(state.elapsed * 3.2 + i * 1.3) * 8;
    const rx = moonX + Math.sin(state.elapsed * 2 + i) * 6;
    ctx.fillStyle = `rgba(255,255,255,${0.18 - i * 0.025})`;
    ctx.fillRect(rx - rw * 0.5, ry, rw, 2.2);
  }
  ctx.restore();
}

function drawSupplyCrates() {
  state.crates.forEach((cr) => {
    ctx.save();
    ctx.translate(cr.x, cr.y);
    // Parachute canopy while descending
    if (!cr.floating) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -24, 16, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(-6, -8); ctx.moveTo(14, -24); ctx.lineTo(6, -8); ctx.stroke();
    }
    const accent = cr.kind === 'gold' ? '#ffeaa7' : cr.kind === 'overdrive' ? '#a5f3fc' : '#ffffff';
    ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.fillRect(-11, -11, 22, 22); ctx.strokeRect(-11, -11, 22, 22);
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.moveTo(0, -11); ctx.lineTo(0, 11); ctx.stroke();
    ctx.restore();
  });
}

function drawMines() {
  state.mines.forEach((m) => {
    const y = getWaveY(m.x) + Math.sin(m.phase) * 3;
    ctx.save();
    ctx.translate(m.x, y);
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#0b0d10'; ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = Math.sin(state.elapsed * 9) > 0 ? '#ff6b6b' : '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}

function drawPirateStickman(x, y, windup = 0, isGunner = false) {
  ctx.save();
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
  const lean = isGunner && windup > 0 ? Math.sin(windup * Math.PI) * 5 : 0;
  const armLift = isGunner && windup > 0 ? windup * 11 : 0;

  ctx.beginPath();
  // Torso leans forward/back during firing prep
  ctx.moveTo(x, y); ctx.lineTo(x + lean, y - 15);
  // Left arm reaches toward turret / pulls lanyard
  ctx.moveTo(x + lean, y - 11); ctx.lineTo(x - 9 + lean * 0.5, y - 8 - armLift * 0.6);
  // Right arm raises torch / ramrod when winding up!
  ctx.moveTo(x + lean, y - 11); ctx.lineTo(x + 7 + lean, y - 7 - armLift);
  ctx.stroke();

  // Glowing match/torch in gunner's raised hand right before firing
  if (isGunner && windup > 0.25) {
    ctx.fillStyle = windup > 0.75 ? '#ff7675' : '#ffeaa7';
    ctx.beginPath(); ctx.arc(x + 7 + lean, y - 7 - armLift, 2.5 + windup * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
  }

  ctx.beginPath(); ctx.arc(x + lean, y - 20, 4.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(x - 8 + lean, y - 23); ctx.lineTo(x + lean, y - 31); ctx.lineTo(x + 8 + lean, y - 23); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawDeckTurret(ox, oy, scale = 1, windup = 0, recoil = 0) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  // Recoil & elevation during pre-fire windup
  const kick = recoil * 5;
  const elev = -0.26 - windup * 0.14;

  // Heavy Naval Gun Carriage
  ctx.fillStyle = '#0b0d10';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(7, -8); ctx.lineTo(-7, -8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Carriage wheels
  ctx.beginPath(); ctx.arc(-6, -1, 3, 0, Math.PI * 2); ctx.arc(6, -1, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Cannon Barrel (points left toward player tower)
  ctx.save();
  ctx.translate(kick, -7);
  ctx.rotate(elev);
  ctx.fillStyle = '#1f2633';
  ctx.fillRect(-19, -4, 23, 8);
  ctx.strokeRect(-19, -4, 23, 8);
  // Muzzle ring
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-21, -5, 3, 10);

  // Pre-fire fuse spark on breech + muzzle charge ring right before firing!
  if (windup > 0.15) {
    const pulse = 0.7 + Math.sin(state.elapsed * 28) * 0.3;
    ctx.fillStyle = windup > 0.75 ? '#ff7675' : '#ffeaa7';
    ctx.beginPath();
    ctx.arc(3, -5, (2.2 + windup * 2.4) * pulse, 0, Math.PI * 2);
    ctx.fill();
    if (windup > 0.65) {
      ctx.strokeStyle = 'rgba(255, 118, 117, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-21, 0, 5 + (1 - windup) * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.restore();
}

function drawShipVisual(x, y, cfg, type, flash, tilt, alpha, crew = [], cracks = [], windup = 0, recoil = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(tilt);

  const w = cfg.width;
  const h = cfg.height;
  const hullFill = flash ? '#ffffff' : (cfg.boss ? '#10141c' : '#181e28');

  if (cfg.air && cfg.heli) {
    // Attack Gunship Helicopter with spinning rotor & nose gun
    ctx.fillStyle = hullFill; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    // Tail boom & tail rotor
    ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(w * 0.5, -10); ctx.lineTo(w * 0.52, -2); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Fuselage & cockpit canopy
    ctx.beginPath(); ctx.ellipse(-8, 0, 28, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(165,243,252,0.75)';
    ctx.beginPath(); ctx.arc(-20, -2, 9, Math.PI * 0.7, Math.PI * 1.55); ctx.stroke();
    // Spinning main rotor blur
    const rotorW = 36 + Math.sin(state.elapsed * 55) * 14;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-8, -13); ctx.lineTo(-8, -22); ctx.moveTo(-8 - rotorW, -22); ctx.lineTo(-8 + rotorW, -22); ctx.stroke();
    // Skids & nose turret
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-24, 15); ctx.lineTo(10, 15); ctx.moveTo(-16, 11); ctx.lineTo(-16, 15); ctx.moveTo(2, 11); ctx.lineTo(2, 15); ctx.stroke();
    (cfg.turrets || []).forEach((tr) => drawDeckTurret(tr.ox, tr.oy, tr.scale, windup, recoil));
    ctx.restore();
    return;
  }

  if (cfg.air) {
    // Rigid Zeppelin Airship with dorsal tail fins & propeller
    ctx.fillStyle = hullFill;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    // Tail fins
    ctx.beginPath();
    ctx.moveTo(w * 0.36, -24); ctx.lineTo(w * 0.54, -40); ctx.lineTo(w * 0.5, -18);
    ctx.moveTo(w * 0.36, -4); ctx.lineTo(w * 0.54, 8); ctx.lineTo(w * 0.5, -10);
    ctx.stroke();
    // Balloon envelope
    ctx.beginPath(); ctx.ellipse(0, -14, w * 0.5, h * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(-w * 0.46, -14); ctx.lineTo(w * 0.46, -14); ctx.stroke();
    // Gondola + Pilot + Belly Turrets
    crew.forEach((c) => { if (c.alive) drawPirateStickman(c.ox, c.oy, windup, c.gunner); });
    (cfg.turrets || []).forEach((tr) => drawDeckTurret(tr.ox, tr.oy, tr.scale, windup, recoil));
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#0b0d10';
    ctx.fillRect(-20, 10, 40, 13); ctx.strokeRect(-20, 10, 40, 13);
    ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-14, 10); ctx.moveTo(14, 4); ctx.lineTo(14, 10); ctx.stroke();
    ctx.restore();
    return;
  }



  const billow = -18 + state.windX * 0.12;
  ctx.fillStyle = hullFill;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = cfg.boss ? 2.5 : 2;

  if (type === 'skiff') {
    // Crescent upturned Viking/Pirate Skiff
    ctx.beginPath();
    ctx.moveTo(-w * 0.54, -h - 8);
    ctx.quadraticCurveTo(0, -h + 10, w * 0.54, -h - 8);
    ctx.lineTo(w * 0.34, 4);
    ctx.quadraticCurveTo(0, 8, -w * 0.34, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Small lateen jib sail
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(14, -h); ctx.lineTo(14, -h - 36); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(14, -h - 34); ctx.quadraticCurveTo(billow + 12, -h - 18, 14, -h - 6); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (type === 'archer') {
    // Stepped Caravel with Raised Stern Castle & Mast Crow's Nest
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 4);
    ctx.lineTo(-w * 0.36, -h + 2);
    ctx.lineTo(10, -h + 2);
    ctx.lineTo(12, -h - 12);
    ctx.lineTo(w * 0.5, -h - 14);
    ctx.lineTo(w * 0.36, 4);
    ctx.lineTo(-w * 0.36, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Tall mast + Crow's Nest platform
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -h + 2); ctx.lineTo(-4, -h - 64); ctx.stroke();
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(-14, -h - 48, 20, 7); ctx.strokeRect(-14, -h - 48, 20, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(-4, -h - 62); ctx.quadraticCurveTo(billow - 4, -h - 42, -4, -h - 14); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (type === 'cannon') {
    // Gunboat with raised bow & quarterdeck + cannon ports
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 8);
    ctx.lineTo(-28, -h - 6);
    ctx.lineTo(-24, -h + 2);
    ctx.lineTo(18, -h + 2);
    ctx.lineTo(22, -h - 12);
    ctx.lineTo(w * 0.5, -h - 14);
    ctx.lineTo(w * 0.38, 5);
    ctx.lineTo(-w * 0.38, 5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Mast & Sail
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.moveTo(2, -h + 2); ctx.lineTo(2, -h - 52); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(2, -h - 50); ctx.quadraticCurveTo(billow, -h - 28, 2, -h - 10); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Bow & side cannons
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.52 - 9, -h - 4, 13, 5);
    ctx.beginPath(); ctx.arc(-6, -h * 0.42, 3, 0, Math.PI * 2); ctx.arc(10, -h * 0.42, 3, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'rammer') {
    // Domed Turtleback Ironclad with Smokestack & Heavy Ramming Prow
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h + 6);
    ctx.quadraticCurveTo(0, -h - 24, w * 0.48, -h + 6);
    ctx.lineTo(w * 0.36, 5);
    ctx.lineTo(-w * 0.4, 5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Armored dorsal ribs & smokestack
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-16, -h - 4); ctx.lineTo(-16, 4); ctx.moveTo(16, -h - 4); ctx.lineTo(16, 4); ctx.stroke();
    ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff';
    ctx.fillRect(-4, -h - 24, 9, 14); ctx.strokeRect(-4, -h - 24, 9, 14);

    // Sharp Iron Prow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-w * 0.5, -h + 10); ctx.lineTo(-w * 0.68, -h * 0.4); ctx.lineTo(-w * 0.44, 0); ctx.closePath(); ctx.fill();
  } else if (type === 'catapult') {
    // Stepped Siege Barge with Onboard Catapult Frame
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 6);
    ctx.lineTo(-18, -h - 6);
    ctx.lineTo(-14, -h + 2);
    ctx.lineTo(18, -h + 2);
    ctx.lineTo(22, -h - 10);
    ctx.lineTo(w * 0.5, -h - 10);
    ctx.lineTo(w * 0.4, 5);
    ctx.lineTo(-w * 0.4, 5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Onboard Siege Frame in center
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, -h + 2); ctx.lineTo(0, -h - 22); ctx.lineTo(10, -h + 2);
    ctx.moveTo(0, -h + 2); ctx.lineTo(-16, -h - 14);
    ctx.stroke();
  } else if (type === 'fireship') {
    // Low-slung Burning Powder Skiff packed with explosive barrels
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 6);
    ctx.quadraticCurveTo(0, -h + 8, w * 0.52, -h - 6);
    ctx.lineTo(w * 0.34, 4); ctx.lineTo(-w * 0.36, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Powder kegs & flames on bow
    ctx.fillStyle = '#ffb142';
    ctx.beginPath(); ctx.arc(-10, -h - 2, 5, 0, Math.PI * 2); ctx.arc(2, -h - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,177,66,0.55)';
    ctx.beginPath(); ctx.arc(-26, -h - 6, 7 + Math.sin(state.elapsed * 16) * 2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'suicideYacht') {
    // Sleek High-Speed Kamikaze Speedboat with glowing explosive bow
    ctx.beginPath();
    ctx.moveTo(-w * 0.56, -h + 4); ctx.lineTo(w * 0.46, -h - 2); ctx.lineTo(w * 0.5, 4); ctx.lineTo(-w * 0.36, 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7675';
    ctx.beginPath(); ctx.arc(-w * 0.35, -h + 2, 5.5 + Math.sin(state.elapsed * 22) * 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'miniTurretBoat') {
    // Compact single-gunner motorized turret raft
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h); ctx.lineTo(w * 0.5, -h); ctx.lineTo(w * 0.38, 4); ctx.lineTo(-w * 0.38, 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === 'carrier') {
    // Heavy Pirate Transport Carrier with stern bay ramp & gantry
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 4); ctx.lineTo(-30, -h - 4); ctx.lineTo(-26, -h + 6); ctx.lineTo(26, -h + 6);
    ctx.lineTo(30, -h - 10); ctx.lineTo(w * 0.5, -h - 10); ctx.lineTo(w * 0.42, 6); ctx.lineTo(-w * 0.42, 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.strokeRect(-22, -h - 6, 44, 12);
  } else if (type === 'missileDestroyer') {
    // Modern Monochrome Stealth Missile Destroyer with VLS Launch Cells
    ctx.beginPath();
    ctx.moveTo(-w * 0.56, -h - 4); ctx.lineTo(-20, -h - 4); ctx.lineTo(-10, -h - 18); ctx.lineTo(24, -h - 18);
    ctx.lineTo(32, -h - 6); ctx.lineTo(w * 0.5, -h - 6); ctx.lineTo(w * 0.4, 5); ctx.lineTo(-w * 0.42, 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // VLS Silos + Radar Mast
    ctx.beginPath(); ctx.moveTo(8, -h - 18); ctx.lineTo(8, -h - 42); ctx.moveTo(-2, -h - 34); ctx.lineTo(18, -h - 34); ctx.stroke();
  } else if (type === 'sub') {
    // Sleek Monochrome Submarine with Conning Tower & Periscope
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.45, w * 0.5, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Conning tower
    ctx.fillRect(-16, -h - 14, 32, 16); ctx.strokeRect(-16, -h - 14, 32, 16);
    // Periscope
    ctx.beginPath(); ctx.moveTo(-4, -h - 14); ctx.lineTo(-4, -h - 26); ctx.lineTo(-12, -h - 26); ctx.stroke();
  } else if (type === 'catamaran') {
    // Twin-Hull Catamaran Siege Platform with Elevated Central Bridge
    ctx.beginPath();
    ctx.rect(-w * 0.5, -h, 36, h + 4);
    ctx.rect(w * 0.5 - 36, -h, 36, h + 4);
    ctx.fill(); ctx.stroke();
    // Overhead Bridge Span
    ctx.fillRect(-w * 0.36, -h - 12, w * 0.72, 14);
    ctx.strokeRect(-w * 0.36, -h - 12, w * 0.72, 14);
  } else if (type === 'dreadnought') {
    // Massive 3-Tier Pirate Galleon with Bowsprit, Forecastle, Waist, Towering Stern Castle & Twin Masts
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, -h - 12);
    ctx.lineTo(-36, -h - 12);
    ctx.lineTo(-30, -h + 4);
    ctx.lineTo(30, -h + 4);
    ctx.lineTo(36, -h - 20);
    ctx.lineTo(w * 0.52, -h - 22);
    ctx.lineTo(w * 0.38, 6);
    ctx.lineTo(-w * 0.38, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Bowsprit spike
    ctx.beginPath(); ctx.moveTo(-w * 0.52, -h - 10); ctx.lineTo(-w * 0.66, -h - 26); ctx.stroke();

    // Twin Masts & Main Crow's Nest
    ctx.strokeStyle = 'rgba(255,255,255,0.72)'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-18, -h + 4); ctx.lineTo(-18, -h - 62);
    ctx.moveTo(12, -h + 4); ctx.lineTo(12, -h - 86);
    ctx.stroke();
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(2, -h - 68, 20, 7); ctx.strokeRect(2, -h - 68, 20, 7);

    // Dual Black Sails
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.moveTo(12, -h - 84); ctx.quadraticCurveTo(billow + 8, -h - 52, 12, -h - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -h - 60); ctx.quadraticCurveTo(billow - 20, -h - 38, -18, -h - 12); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Broadside cannon ports
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.52 - 10, -h - 6, 13, 5);
    [-20, -4, 12, 28].forEach((px) => {
      ctx.beginPath(); ctx.arc(px, -h * 0.4, 3.2, 0, Math.PI * 2); ctx.fill();
    });
  }

  // Dynamic Hull Cracks
  if (cracks.length) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.3;
    cracks.forEach((cr) => {
      ctx.beginPath();
      ctx.moveTo(cr.ox, cr.oy);
      ctx.lineTo(cr.ox + Math.cos(cr.ang) * cr.len, cr.oy + Math.sin(cr.ang) * cr.len);
      ctx.stroke();
    });
  }

  // Draw surviving pirate crew & deck turrets ON TOP of hull/sails for crisp readability
  crew.forEach((c) => { if (c.alive) drawPirateStickman(c.ox, c.oy, windup, c.gunner); });
  (cfg.turrets || []).forEach((tr) => drawDeckTurret(tr.ox, tr.oy, tr.scale, windup, recoil));
  ctx.restore();
}

function drawEnemies() {
  // ZERO HP bars or HP numbers — purely physical visual state!
  state.enemies.forEach((e) => {
    const bobY = e.cfg.air ? Math.sin(e.bobPhase) * 6 : 0;
    drawShipVisual(e.x, e.y + bobY, e.cfg, e.type, e.hitFlash > 0, e.listAngle, 1, e.crew, e.cracks, e.windup, e.fireRecoil);
    // Draw Armor Variants (鐵架船 / 骨架罩船) & Unmanned Auto-Turrets (1-5 pods)!
    if (e.armorMod || (e.autoTurrets && e.autoTurrets.length)) {
      ctx.save();
      ctx.translate(e.x, e.y + bobY);
      ctx.rotate(e.listAngle);
      const hw = e.cfg.width * 0.52, hh = e.cfg.height;
      if (e.armorMod === 'ironFrame') {
        ctx.strokeStyle = 'rgba(255,255,255,0.72)'; ctx.lineWidth = 1.8;
        ctx.strokeRect(-hw, -hh, hw * 2, hh + 2);
        ctx.beginPath();
        ctx.moveTo(-hw, -hh); ctx.lineTo(0, 2); ctx.moveTo(0, -hh); ctx.lineTo(hw, 2);
        ctx.moveTo(hw, -hh); ctx.lineTo(0, 2); ctx.moveTo(0, -hh); ctx.lineTo(-hw, 2);
        ctx.stroke();
      } else if (e.armorMod === 'exoCage') {
        ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(0, -hh * 0.65, hw * 1.06, hh * 1.15, 0, Math.PI, 0); ctx.stroke();
        for (let rib = -2; rib <= 2; rib++) {
          ctx.beginPath(); ctx.moveTo(rib * hw * 0.38, 2); ctx.lineTo(rib * hw * 0.28, -hh * 1.65); ctx.stroke();
        }
      }
      if (e.autoTurrets && e.autoTurrets.length) {
        e.autoTurrets.forEach((ut) => {
          ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(ut.ox, ut.oy - 5, 5.5, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ut.ox - 5, ut.oy - 7); ctx.lineTo(ut.ox - 13, ut.oy - 9); ctx.stroke();
          ctx.fillStyle = '#ff7675'; ctx.beginPath(); ctx.arc(ut.ox - 1, ut.oy - 7, 1.8, 0, Math.PI * 2); ctx.fill();
        });
      }
      ctx.restore();
    }
    if (e.freezeTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.85)';
      ctx.fillStyle = 'rgba(165, 243, 252, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y - e.cfg.height * 0.4, e.cfg.width * 0.56, e.cfg.height * 0.72, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  });
}

function drawSinkingShips() {
  state.sinking.forEach((s) => {
    if (s.split) {
      // Snapped in half sinking!
      const w = s.cfg.width * 0.48;
      const h = s.cfg.height;
      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x + dir * (w * 0.5 + s.splitGap), s.y);
        ctx.rotate(dir * (0.35 + (1 - s.alpha) * 0.9));
        ctx.fillStyle = '#181e28'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.fillRect(-w * 0.5, -h + 4, w, h);
        ctx.strokeRect(-w * 0.5, -h + 4, w, h);
        ctx.restore();
      });
    } else {
      drawShipVisual(s.x, s.y, s.cfg, s.type, false, s.tilt, s.alpha);
    }
  });
}

function drawRollingStones() {
  state.rollingStones.forEach((rs) => {
    const ship = state.enemies.find((e) => e.id === rs.shipId);
    if (!ship) return;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.listAngle);
    ctx.translate(rs.ox, getShipDeckY(ship.type, ship.cfg, rs.ox) - rs.r * 0.65);
    ctx.rotate(rs.rot);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-rs.r, -2); ctx.lineTo(-2, -rs.r); ctx.lineTo(rs.r, -3); ctx.lineTo(3, rs.r); ctx.lineTo(-rs.r * 0.7, rs.r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawRagdolls() {
  state.ragdolls.forEach((rg) => {
    ctx.save();
    ctx.translate(rg.x, rg.y);
    ctx.rotate(rg.rot);
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.moveTo(-8, -3); ctx.lineTo(8, -3);
    ctx.moveTo(0, 8); ctx.lineTo(-6, 15);
    ctx.moveTo(0, 8); ctx.lineTo(6, 15);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}

function drawProjectiles() {
  state.playerProjs.forEach((p) => {
    if (p.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = p.type === 'fire' ? 'rgba(255,177,66,0.55)' : 'rgba(255,255,255,0.34)';
      ctx.lineWidth = p.type === 'fire' ? 4 : 2;
      ctx.beginPath();
      p.trail.forEach((pt, idx) => { if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.type === 'stone' || p.type === 'triple') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-p.r, -2); ctx.lineTo(-3, -p.r); ctx.lineTo(p.r, -3); ctx.lineTo(4, p.r); ctx.lineTo(-p.r * 0.7, p.r * 0.7);
      ctx.closePath(); ctx.fill();
    } else if (p.type === 'bomb') {
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffeaa7'; ctx.beginPath(); ctx.arc(p.r * 0.75, -p.r * 0.75, 4, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'spike') {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (p.r + 5), Math.sin(a) * (p.r + 5)); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.72, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'fire') {
      ctx.fillStyle = '#ffb142'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'chain') {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.stroke();
      ctx.fillStyle = '#0b0d10';
      ctx.beginPath(); ctx.arc(-16, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (p.type === 'cluster') {
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let a = 0; a < Math.PI * 2; a += Math.PI * 0.4) {
        ctx.beginPath(); ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (p.type === 'frost') {
      ctx.fillStyle = '#a5f3fc'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        const rx = Math.cos(ang) * p.r;
        const ry = Math.sin(ang) * p.r;
        if (a === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  });

  state.enemyProjs.forEach((ep) => {
    ctx.save();
    ctx.translate(ep.x, ep.y);
    if (ep.type === 'arrow') {
      ctx.rotate(Math.atan2(ep.vy, ep.vx));
      ctx.strokeStyle = '#ff7675'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(10, 0); ctx.stroke();
    } else if (ep.type === 'emp') {
      ctx.fillStyle = '#0a1929'; ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, ep.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, ep.r + 3 + Math.sin(state.elapsed * 30) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165,243,252,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    } else if (ep.type === 'missile') {
      ctx.rotate(Math.atan2(ep.vy, ep.vx));
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff7675'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-9, -4); ctx.lineTo(-6, 0); ctx.lineTo(-9, 4); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ff7675'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, ep.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  });
}

function drawTidalWavesAndLightning() {
  // Tidal Wave Walls
  state.waves.forEach((wv) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(wv.x - wv.width, L.seaY + 20);
    ctx.quadraticCurveTo(wv.x - 10, L.seaY - wv.height, wv.x + 22, L.seaY - wv.height * 0.85);
    ctx.quadraticCurveTo(wv.x - 4, L.seaY - wv.height * 0.45, wv.x + 24, L.seaY + 20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  });

  // Jagged Lightning Bolts
  state.lightningBolts.forEach((lb) => {
    const a = clamp(lb.life / lb.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 4.5 * a;
    ctx.beginPath();
    let cx = lb.x;
    ctx.moveTo(cx, 0);
    for (let y = 50; y <= L.seaY; y += 55) {
      cx = lb.x + (Math.random() - 0.5) * 34;
      ctx.lineTo(cx, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * a;
    ctx.stroke();
    ctx.restore();
  });

  // Subtle slowmo vignette
  if (state.slowmoTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.38)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, L.worldW - 8, L.worldH - 8);
    ctx.restore();
  }
}

function drawTracers() {
  state.tracers.forEach((tr) => {
    ctx.save();
    ctx.globalAlpha = clamp(tr.life / 0.16, 0, 1);
    ctx.strokeStyle = tr.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
    ctx.restore();
  });
}

function drawRain() {
  state.rainArrows.forEach((r) => {
    ctx.save();
    if (r.type === 'arrow') {
      ctx.translate(r.x, r.y); ctx.rotate(Math.atan2(r.vy, r.vx));
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(8, 0); ctx.stroke();
    } else {
      ctx.fillStyle = '#ffb142'; ctx.beginPath(); ctx.arc(r.x, r.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r.x, r.y, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });
}

function drawDebris() {
  state.debris.forEach((d) => {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle = d.color;
    ctx.fillRect(-d.w * 0.5, -d.h * 0.5, d.w, d.h);
    ctx.restore();
  });
}

function drawCoinDrops() {
  state.coinDrops.forEach((c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(Math.max(0.25, Math.abs(Math.cos(c.spin))), 1);
    ctx.fillStyle = '#ffeaa7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  });
}

function drawWeatherOverlay() {
  const w = WEATHER_STATES[state.weatherIdx];
  if (w.mist > 0) {
    ctx.save();
    const mistGrad = ctx.createLinearGradient(0, L.seaY - 120, 0, L.seaY + 40);
    mistGrad.addColorStop(0, 'rgba(255,255,255,0)');
    mistGrad.addColorStop(0.5, `rgba(220,230,240,${w.mist * 0.25})`);
    mistGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(-100, L.seaY - 120, L.worldW + 200, 160);
    ctx.restore();
  }
  if (w.rain > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.2;
    state.rainDrops.forEach((rd) => {
      ctx.beginPath();
      ctx.moveTo(rd.x, rd.y);
      ctx.lineTo(rd.x + state.windX * 0.06, rd.y + rd.len);
      ctx.stroke();
    });
    ctx.restore();
  }
}

function drawParticles() {
  state.particles.forEach((pt) => {
    const a = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (pt.type === 'ring') {
      ctx.strokeStyle = pt.color; ctx.lineWidth = 2.5 * a;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });
}

function drawAimTrajectory() {
  if (!state.aiming) return;
  const sx = L.catapultX + 12;
  const sy = L.catapultY - 12;

  ctx.save();
  const pullDist = Math.hypot(state.aimStartX - state.aimCurrX, state.aimStartY - state.aimCurrY);
  if (pullDist >= 14) {
    const powerPct = clamp(Math.hypot(state.aimVx, state.aimVy) / 1150, 0.1, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(state.aimStartX, state.aimStartY, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(state.aimStartX, state.aimStartY, 26, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * powerPct); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(state.aimStartX, state.aimStartY); ctx.lineTo(state.aimCurrX, state.aimCurrY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(state.aimCurrX, state.aimCurrY, 4.5, 0, Math.PI * 2); ctx.fill();
  }

  // Wind-accurate parabolic trajectory preview!
  for (let step = 1; step <= 26; step++) {
    const t = step * 0.055;
    const px = sx + state.aimVx * t + 0.5 * getEffectiveWind() * t * t;
    const py = sy + state.aimVy * t + 0.5 * getEffectiveGravity() * t * t;
    if (py > L.seaY + 8 || px > L.worldW + 20) break;
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0.12, 1 - step / 28)})`;
    ctx.beginPath(); ctx.arc(px, py, Math.max(1.8, 4.2 - step * 0.09), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawSkillTargetingOverlay() {
  const sid = state.activeTargetSkill || state.draggingSkill;
  if (!sid) return;
  const def = SKILL_DEFS.find((d) => d.id === sid);
  if (!def || !def.targeted) return;

  const tx = clamp(state.pointerWorldX, L.towerX + 80, L.worldW - 30);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'; ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.8; ctx.setLineDash([7, 6]);
  if (def.targetType === 'sea') {
    ctx.beginPath(); ctx.arc(tx, L.seaY, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    const span = L.isPortrait ? 200 : 270;
    ctx.fillRect(tx - span * 0.5, 40, span, L.seaY - 40);
    ctx.strokeRect(tx - span * 0.5, 40, span, L.seaY - 40);
  }
  ctx.restore();
}

function drawPopups() {
  ctx.save();
  ctx.textAlign = 'center';
  state.popups.forEach((pp) => {
    ctx.globalAlpha = clamp(pp.life / pp.maxLife, 0, 1);
    ctx.font = `700 ${pp.size}px Inter, "Noto Sans TC", sans-serif`;
    ctx.fillStyle = pp.color;
    ctx.fillText(pp.text, pp.x, pp.y);
  });
  ctx.restore();
}

// ============================================================
// INPUTS & EVENT BINDINGS
// ============================================================
canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 2) { cancelSkillTargeting(); return; }
  sound.init();
  if (state.shopOpen || state.lbOpen || state.paused || state.gameOver || state.collapsing) return;

  const wp = screenToWorld(e.clientX, e.clientY);
  state.pointerWorldX = wp.x;
  state.pointerWorldY = wp.y;

  if (state.activeTargetSkill) {
    castSkill(state.activeTargetSkill, wp.x);
    return;
  }

  state.aiming = true;
  state.aimStartX = wp.x;
  state.aimStartY = wp.y;
  state.aimCurrX = wp.x;
  state.aimCurrY = wp.y;
  const q = solveQuickBallistic(wp.x, wp.y);
  state.aimVx = q.vx;
  state.aimVy = q.vy;
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});

canvas.addEventListener('pointermove', (e) => {
  const wp = screenToWorld(e.clientX, e.clientY);
  state.pointerWorldX = wp.x;
  state.pointerWorldY = wp.y;
  if (!state.aiming) return;

  state.aimCurrX = wp.x;
  state.aimCurrY = wp.y;
  const dx = state.aimStartX - state.aimCurrX;
  const dy = state.aimStartY - state.aimCurrY;
  const dist = Math.hypot(dx, dy);

  if (dist < 14) {
    const q = solveQuickBallistic(wp.x, wp.y);
    state.aimVx = q.vx;
    state.aimVy = q.vy;
  } else {
    const powerScale = L.isPortrait ? 4.6 : 4.2;
    const power = clamp(dist * powerScale, 200, 1180);
    const ang = Math.atan2(dy, dx);
    state.aimVx = clamp(Math.cos(ang) * power, 110, 1120);
    state.aimVy = clamp(Math.sin(ang) * power, -980, -60);
  }
});

canvas.addEventListener('pointerup', () => {
  if (!state.aiming) return;
  state.aiming = false;
  fireProjectile(state.aimVx, state.aimVy);
});

canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); cancelSkillTargeting(); });

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.shopOpen) closeShop();
    else if (state.lbOpen) closeLeaderboard();
    else if (state.activeTargetSkill) cancelSkillTargeting();
    else if (state.paused) togglePause();
    return;
  }
  if (state.gameOver) return;
  const k = e.key.toLowerCase();
  if (k === 's') state.shopOpen ? closeShop() : openShop();
  else if (k === 'l') state.lbOpen ? closeLeaderboard() : openLeaderboard();
  else if (k === 'p') { if (!state.shopOpen && !state.lbOpen) togglePause(); }
  else if (k === 'm') toggleSound();
  else if (k === 'f') toggleSpeed();
  else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(k)) {
    const def = PROJECTILE_DEFS[Number(k) - 1];
    if (def && state.projectiles[def.id].unlocked) { state.selectedProj = def.id; updateDockDisplays(); }
  }
});

function togglePause() {
  if (state.shopOpen || state.lbOpen || state.gameOver) return;
  state.paused = !state.paused;
  if (state.paused) {
    saveProgress();
    dom.pauseModal.querySelector('h2').textContent = '戰場已暫停';
    dom.pauseModal.querySelector('.modal-sub').textContent = '進度已自動保存，隨時可繼續守衛';
  }
  dom.pauseModal.classList.toggle('hidden', !state.paused);
  dom.pauseBtn.querySelector('.ico').innerHTML = state.paused ? ICONS.play : ICONS.pause;
}

function toggleSpeed() {
  state.gameSpeed = state.gameSpeed === 1 ? 3 : 1;
  saveProgress();
  updateHud();
}

function toggleSound() {
  const muted = sound.toggleMute();
  dom.soundBtn.querySelector('.ico').innerHTML = muted ? ICONS.soundOff : ICONS.soundOn;
}

function restartGame() {
  clearProgress();
  state = createInitialState();
  dom.pauseModal.querySelector('h2').textContent = '戰場已暫停';
  dom.pauseModal.querySelector('.modal-sub').textContent = '海浪靜止，隨時準備再次開火';
  dom.shopModal.classList.add('hidden');
  dom.leaderboardModal.classList.add('hidden');
  dom.pauseModal.classList.add('hidden');
  dom.gameOverModal.classList.add('hidden');
  dom.controlHint.classList.remove('fade-out');
  dom.pauseBtn.querySelector('.ico').innerHTML = ICONS.pause;
  renderProjectileDock();
  renderSkillDock();
  updateHud();
}

dom.shopBtn.addEventListener('click', () => openShop());
dom.closeShopBtn.addEventListener('click', () => closeShop());
dom.shopModal.addEventListener('click', (e) => { if (e.target === dom.shopModal) closeShop(); });
document.querySelectorAll('.shop-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    shopTab = tabBtn.dataset.tab;
    document.querySelectorAll('.shop-tab').forEach((t) => t.classList.toggle('active', t === tabBtn));
    renderShopBody();
  });
});

dom.leaderboardBtn.addEventListener('click', openLeaderboard);
dom.goLbBtn.addEventListener('click', openLeaderboard);
dom.closeLbBtn.addEventListener('click', closeLeaderboard);
dom.leaderboardModal.addEventListener('click', (e) => { if (e.target === dom.leaderboardModal) closeLeaderboard(); });
dom.submitScoreBtn.addEventListener('click', submitLeaderboardScore);
dom.pauseBtn.addEventListener('click', togglePause);
dom.resumeBtn.addEventListener('click', togglePause);
dom.pauseRestartBtn.addEventListener('click', restartGame);
dom.restartBtn.addEventListener('click', restartGame);
dom.soundBtn.addEventListener('click', toggleSound);
dom.speedBtn.addEventListener('click', toggleSpeed);
dom.cancelTargetBtn.addEventListener('click', cancelSkillTargeting);

// ============================================================
// BOOTSTRAP
// ============================================================
hydrateStaticIcons();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

if (!loadSavedProgress()) {
  state = createInitialState();
}
renderProjectileDock();
renderSkillDock();
updateHud();

let lastTs = performance.now();
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min(0.05, (ts - lastTs) / 1000));
  lastTs = ts;
  try {
    const steps = (state && state.gameSpeed === 3) ? 3 : 1;
    for (let s = 0; s < steps; s++) update(dt);
    render();
  } catch (err) {
    console.error('[THROW] recovered frame error:', err);
  }
}
requestAnimationFrame(loop);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state && !state.gameOver && !state.collapsing) {
    saveProgress();
    if (!state.paused && !state.shopOpen && !state.lbOpen) togglePause();
  }
});
window.addEventListener('pagehide', saveProgress);
window.addEventListener('beforeunload', saveProgress);
