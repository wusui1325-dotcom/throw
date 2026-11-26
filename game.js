import { ICONS } from './icons.js';
import { sound } from './audio.js';

// ============================================================
// CONFIG & DATA DEFINITIONS
// ============================================================
const GRAVITY = 820;
const API_BASE = location.hostname === 'throw.wusper.com' ? '' : 'https://throw.wusper.com';

const TOWER_TIERS = [
  { id: 0, name: '木塔', maxHp: 110, armor: 0, cost: 0, color: '#332b24', debrisColor: '#a88c6c', desc: '基礎原木結構高塔，中彈易碎裂掉木塊。' },
  { id: 1, name: '石塔', maxHp: 195, armor: 2, cost: 90, color: '#2b3038', debrisColor: '#9aa4b2', desc: '厚實切石砌築，抗凹陷能力大幅提升。' },
  { id: 2, name: '木板混合石塔', maxHp: 300, armor: 4, cost: 170, color: '#312f2a', debrisColor: '#b5a895', desc: '石材核心外覆強化木板支撐，緩衝砲火衝擊。' },
  { id: 3, name: '鐵塔', maxHp: 440, armor: 7, cost: 280, color: '#232933', debrisColor: '#7b8798', desc: '鉚接熟鐵裝甲覆蓋，有效抵禦弓箭與輕砲。' },
  { id: 4, name: '框架鐵塔', maxHp: 620, armor: 10, cost: 430, color: '#1c222b', debrisColor: '#8d99ab', desc: '桁架式鋼鐵骨架分散衝擊力，結構穩固。' },
  { id: 5, name: '水泥塔', maxHp: 870, armor: 14, cost: 640, color: '#343a42', debrisColor: '#b8c0cc', desc: '一體澆築厚重混凝土堡壘，極難撼動。' },
  { id: 6, name: '鐵架水泥塔', maxHp: 1190, armor: 19, cost: 920, color: '#2c333d', debrisColor: '#c4cbd6', desc: '混凝土主體搭配外部鐵架補強，防線升級。' },
  { id: 7, name: '鋼塔', maxHp: 1590, armor: 25, cost: 1300, color: '#1e252f', debrisColor: '#d0d7e2', desc: '流線型精鋼裝甲塔身，大幅減免敵艦衝擊。' },
  { id: 8, name: '鋼筋水泥塔', maxHp: 2180, armor: 34, cost: 1850, color: '#242c36', debrisColor: '#e2e8f0', desc: '終極複合鋼筋混凝土要塞，屹立於無盡狂潮。' },
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
];

const ADDON_DEFS = [
  {
    id: 'ballista',
    name: '自動連弩',
    icon: 'addon_ballista',
    baseCost: 140,
    maxLv: 5,
    desc: '架設於塔身中層的自動弩砲，持續點射逼近的海盜船員與輕舟。',
  },
  {
    id: 'aa',
    name: '防空攔截網',
    icon: 'addon_aa',
    baseCost: 180,
    maxLv: 5,
    desc: '自動擊落來襲的敵方砲彈、弓箭與空投炸彈，並對海盜飛艇開火。',
  },
  {
    id: 'magnet',
    name: '金幣磁石',
    icon: 'addon_magnet',
    baseCost: 120,
    maxLv: 3,
    desc: '自動吸附戰場掉落的實體金幣，並額外提升金幣收益倍率。',
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
    name: '海盜輕舟', minLv: 1, hp: 34, armor: 0, speed: 68, damage: 9, attackCd: 1.5,
    stopFrac: 0.21, width: 74, height: 26, bounty: 14, ranged: false, air: false, crewOffsets: [0],
  },
  archer: {
    name: '弓手帆船', minLv: 1, hp: 48, armor: 0, speed: 52, damage: 7, attackCd: 2.3,
    stopFrac: 0.46, width: 86, height: 30, bounty: 22, ranged: true, projType: 'arrow', air: false, crewOffsets: [-12, 10],
  },
  cannon: {
    name: '加農砲艦', minLv: 2, hp: 86, armor: 3, speed: 42, damage: 17, attackCd: 3.0,
    stopFrac: 0.56, width: 106, height: 36, bounty: 36, ranged: true, projType: 'cannonball', air: false, crewOffsets: [-16, 14],
  },
  rammer: {
    name: '裝甲衝撞艦', minLv: 3, hp: 140, armor: 8, speed: 58, damage: 25, attackCd: 1.9,
    stopFrac: 0.22, width: 112, height: 38, bounty: 48, ranged: false, air: false, crewOffsets: [-10, 14],
  },
  catapult: {
    name: '海盜投石艦', minLv: 3, hp: 110, armor: 4, speed: 36, damage: 22, attackCd: 3.5,
    stopFrac: 0.66, width: 114, height: 38, bounty: 54, ranged: true, projType: 'boulder', air: false, crewOffsets: [-18, 18],
  },
  zeppelin: {
    name: '海盜飛艇', minLv: 4, hp: 96, armor: 2, speed: 48, damage: 19, attackCd: 2.8,
    stopFrac: 0.36, width: 116, height: 48, bounty: 60, ranged: true, projType: 'airbomb', air: true, flyFrac: 0.26, crewOffsets: [0],
  },
  dreadnought: {
    name: '無畏黑帆旗艦', minLv: 5, hp: 320, armor: 12, speed: 26, damage: 34, attackCd: 2.8,
    stopFrac: 0.52, width: 162, height: 52, bounty: 150, ranged: true, projType: 'cannonball', air: false, crewOffsets: [-38, 0, 38], boss: true,
  },
};

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

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;

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

  const addons = { ballista: 0, aa: 0, magnet: 0 };

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
    ballistaTimer: 0,
    aaTimer: 0,
    // Weather
    weatherIdx: 0,
    weatherTimer: 28,
    windX: 0,
    targetWindX: 0,
    lightningFlash: 0,
    rainDrops: Array.from({ length: 70 }, () => ({ x: Math.random() * 1400, y: Math.random() * 1000, len: 14 + Math.random() * 14 })),
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
  const finalAmount = Math.max(1, Math.round(totalCoins * getComboMultiplier() * magnetMult));
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

    let sx = 0, sy = 0, dragged = false;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sound.init();
      if (state.gameOver || state.collapsing || state.paused || state.shopOpen || state.lbOpen) return;
      if (ss.count <= 0) { openShop('skill'); return; }
      if (ss.cd > 0) return;

      sx = e.clientX; sy = e.clientY; dragged = false;
      const onMove = (ev) => {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) {
          dragged = true;
          state.draggingSkill = def.id;
          state.activeTargetSkill = null;
          const wp = screenToWorld(ev.clientX, ev.clientY);
          state.pointerWorldX = wp.x;
          state.pointerWorldY = wp.y;
          dom.skillDragGhost.innerHTML = `<span class="ico">${ICONS[def.icon]}</span>`;
          dom.skillDragGhost.style.left = `${ev.clientX}px`;
          dom.skillDragGhost.style.top = `${ev.clientY}px`;
          dom.skillDragGhost.classList.remove('hidden');
        }
      };
      const onUp = (ev) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        dom.skillDragGhost.classList.add('hidden');
        if (dragged) {
          const wp = screenToWorld(ev.clientX, ev.clientY);
          state.draggingSkill = null;
          const droppedOnField = L.isPortrait ? ev.clientY < window.innerHeight - 74 : ev.clientX < window.innerWidth - 70;
          if (droppedOnField || !def.targeted) castSkill(def.id, wp.x, wp.y);
        } else {
          if (!def.targeted) castSkill(def.id, L.towerX, L.towerTopY);
          else if (state.activeTargetSkill === def.id) cancelSkillTargeting();
          else {
            state.activeTargetSkill = def.id;
            dom.targetHintText.textContent = `點擊戰場施放「${def.name}」`;
            dom.targetHint.classList.remove('hidden');
            updateDockDisplays();
          }
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
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
      bar.style.width = `${ps.charges >= def.maxCharges ? 100 : Math.floor((ps.timer / def.reload) * 100)}%`;
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
}

function getProjectileDamage(def, level) {
  return Math.round(def.damage * (1 + (level - 1) * 0.28));
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
      const maxLv = 6;
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
        if (!def || !ps.unlocked || ps.level >= 6 || state.coins < upgCost) return;
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
          <div class="card-title-wrap"><div class="card-title">${def.name} <span class="card-tag">${lv > 0 ? `Lv.${lv}/${def.maxLv}` : '未安裝'}</span></div></div>
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
      rot: 0,
      trail: [],
      hasHitAnything: false,
      isShard: false,
    });
  };

  if (id === 'triple') {
    spawnOne(vx * 0.94, vy * 0.94 - 45);
    spawnOne(vx, vy);
    spawnOne(vx * 1.06, vy * 1.05 + 42);
  } else {
    spawnOne(vx, vy);
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
  const vx = (dx - 0.5 * state.windX * t * t) / t;
  const vy = (dy - 0.5 * GRAVITY * t * t) / t;
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
  const scaleHp = 1 + (lv - 1) * 0.27;
  const scaleDmg = 1 + (lv - 1) * 0.16;
  const scaleSpeed = (1 + Math.min(0.65, (lv - 1) * 0.05)) * (L.isPortrait ? 0.72 : 1.0);
  const bounty = Math.round(cfg.bounty * (1 + (lv - 1) * 0.22));
  const maxHp = Math.round(cfg.hp * scaleHp);

  const stopBase = L.towerX + L.towerW * 0.5 + (L.worldW - L.towerX - 80) * cfg.stopFrac;
  const stopX = clamp(stopBase + (cfg.ranged ? (Math.random() - 0.5) * 90 : 0), L.towerX + L.towerW * 0.5 + 32, L.worldW - 95);

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
    attackTimer: cfg.attackCd * (0.4 + Math.random() * 0.5),
    bounty,
    burnTimer: 0,
    burnDps: 0,
    hitFlash: 0,
    bobPhase: Math.random() * Math.PI * 2,
    listAngle: 0,
    cracks: [],
    crew: cfg.crewOffsets.map((ox) => ({ ox, alive: true })),
    unmannedTimer: 0,
  });

  state.hasSpawnedAny = true;
}

function killCrewMember(enemy, crewObj, kickVx, kickVy, reason = '擊倒海盜') {
  if (!crewObj.alive) return;
  crewObj.alive = false;
  registerComboHit();
  const cx = enemy.x + crewObj.ox;
  const cy = enemy.y - enemy.cfg.height - 10;
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

  if (splitSnap && !enemy.cfg.air) {
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
    const cy = enemy.y - enemy.cfg.height - 14;
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

  const dmg = Math.max(3, Math.round(rawDmg - state.towerArmor * 0.45));
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
  const newIntensity = 1 + Math.floor(state.elapsed / 24);
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

  const rushMult = state.rushTimer > 0 ? 3.0 : 1.0;
  if (state.rushTimer > 0) state.rushTimer = Math.max(0, state.rushTimer - dt);

  // Projectile recharge
  PROJECTILE_DEFS.forEach((def) => {
    const ps = state.projectiles[def.id];
    if (!ps.unlocked) return;
    if (ps.charges < def.maxCharges) {
      ps.timer += dt;
      if (ps.timer >= def.reload) {
        ps.timer -= def.reload;
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

  // Spawning
  const baseInterval = Math.max(1.15, 3.6 - state.intensity * 0.24);
  state.spawnTimer -= dt * rushMult;
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = baseInterval * (0.75 + Math.random() * 0.5);
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

    p.vx += state.windX * dt;
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 7.5;

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
        if (p.type === 'bomb' || p.type === 'fire') {
          detonatePlayerProj(p);
          state.playerProjs.splice(i, 1);
          intercepted = true;
          break;
        }
      }
    }
    if (intercepted) continue;

    // Hit enemies
    let removed = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (p.hitIds.has(e.id)) continue;

      const halfW = e.cfg.width * 0.52;
      const topY = e.cfg.air ? e.y - e.cfg.height * 0.55 : e.y - e.cfg.height - 28;
      const botY = e.cfg.air ? e.y + e.cfg.height * 0.55 : e.y + 8;

      if (p.x + p.r >= e.x - halfW && p.x - p.r <= e.x + halfW && p.y + p.r >= topY && p.y - p.r <= botY) {
        p.hitIds.add(e.id);
        p.hasHitAnything = true;
        registerComboHit();

        if (p.type === 'bomb' || p.type === 'fire') {
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
      if (p.type === 'bomb' || p.type === 'fire') {
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

    // Roll along ship's tilted deck!
    rs.vx += Math.sin(ship.listAngle) * 340 * dt;
    rs.ox += rs.vx * dt;
    rs.rot += (rs.vx / Math.max(6, rs.r)) * dt;

    // Crush any pirate stickman in its path!
    ship.crew.forEach((c) => {
      if (c.alive && Math.abs(rs.ox - c.ox) < rs.r + 13) {
        killCrewMember(ship, c, rs.vx * 0.9, -195, '滾石壓扁！');
        damageEnemyHull(ship, rs.damage * 0.4, { hitX: ship.x + rs.ox, hitY: ship.y - ship.cfg.height });
      }
    });

    // Roll off bow or stern into the sea!
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
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
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
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (Math.hypot(r.x - e.x, r.y - (e.y - 12)) < e.cfg.width * 0.55) { hitEnemy = true; break; }
      }
      if (hitEnemy || r.y >= wy) {
        const ey = Math.min(r.y, wy);
        spawnExplosion(r.x, ey, 110, true);
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
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
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (e.cfg.air) continue;
      if (Math.abs(e.x - m.x) < e.cfg.width * 0.5 + m.radius) {
        const wy = getWaveY(m.x);
        spawnExplosion(m.x, wy, m.aoe, false);
        spawnWaterSplash(m.x, 1.7);
        for (let k = state.enemies.length - 1; k >= 0; k--) {
          const t = state.enemies[k];
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
    e.bobPhase += dt * 3.2;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    // Progressive water intake & list angle based on structural damage (replaces HP bars!)
    const dmgRatio = 1 - clamp(e.hp / e.maxHp, 0, 1);
    const waveTilt = Math.cos(e.bobPhase) * (0.04 + WEATHER_STATES[state.weatherIdx].waveAmp * 0.005);
    e.listAngle = waveTilt + (e.cfg.air ? 0 : dmgRatio * 0.28 * (i % 2 === 0 ? 1 : -1));
    if (!e.cfg.air) e.y = getWaveY(e.x) + dmgRatio * 12;

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

    // Unmanned ship slowly takes on water and sinks!
    const aliveCrew = e.crew.filter((c) => c.alive).length;
    if (aliveCrew === 0) {
      e.unmannedTimer += dt;
      e.hp -= e.maxHp * 0.25 * dt;
      if (e.unmannedTimer > 2.4 || e.hp <= 0) {
        sinkEnemyShip(e, false);
        continue;
      }
      continue;
    }

    // Move or Attack
    const moveSpeed = e.speed * (state.rushTimer > 0 ? 1.85 : 1.0);
    if (e.x > e.stopX) {
      e.x = Math.max(e.stopX, e.x - moveSpeed * dt);
    } else {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        e.attackTimer = e.cfg.attackCd;
        if (e.cfg.ranged) fireEnemyProjectile(e);
        else {
          damageTower(e.damage, L.seaY - 46);
          e.x += 14;
        }
      }
    }
  }

  // Update Enemy Projectiles
  for (let i = state.enemyProjs.length - 1; i >= 0; i--) {
    const ep = state.enemyProjs[i];
    ep.vx += state.windX * 0.45 * dt;
    ep.vy += ep.gravity * dt;
    ep.x += ep.vx * dt;
    ep.y += ep.vy * dt;

    if (
      ep.x - ep.r <= L.towerX + L.towerW * 0.52 &&
      ep.x + ep.r >= L.towerX - L.towerW * 0.52 &&
      ep.y + ep.r >= L.towerTopY - 10 &&
      ep.y - ep.r <= L.seaY
    ) {
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
}

function updateTowerAddons(dt) {
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
      const threat = state.enemyProjs.find((ep) => ep.x < L.worldW * 0.62);
      if (threat) {
        state.aaTimer = Math.max(0.4, 1.7 - lv * 0.26);
        state.tracers.push({ x1: ax, y1: ay, x2: threat.x, y2: threat.y, life: 0.16, color: '#a5f3fc' });
        spawnParticles(threat.x, threat.y, 10, { color: '#ffffff', speed: 120, life: 0.35 });
        state.enemyProjs.splice(state.enemyProjs.indexOf(threat), 1);
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
  spawnExplosion(p.x, p.y, p.aoe, isFire);
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j];
    const dist = Math.hypot(e.x - p.x, (e.y - e.cfg.height * 0.4) - p.y);
    if (dist <= p.aoe + e.cfg.width * 0.44) {
      const falloff = 1 - (dist / (p.aoe + e.cfg.width * 0.5)) * 0.35;
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
  const sx = e.x - e.cfg.width * 0.25;
  const sy = e.cfg.air ? e.y + 18 : e.y - e.cfg.height - 10;
  const tx = L.towerX + (Math.random() - 0.5) * 30;
  const ty = L.towerTopY + 35 + Math.random() * (L.seaY - L.towerTopY - 60);

  if (e.cfg.projType === 'airbomb') {
    const t = 1.25;
    state.enemyProjs.push({ type: 'airbomb', x: sx, y: sy, vx: (tx - sx) / t, vy: 40, gravity: 460, r: 9, damage: e.damage });
  } else {
    const g = 520;
    const t = clamp(Math.abs(sx - tx) / (L.isPortrait ? 280 : 360), 0.85, 1.85);
    state.enemyProjs.push({
      type: e.cfg.projType, x: sx, y: sy,
      vx: (tx - sx) / t,
      vy: (ty - sy - 0.5 * g * t * t) / t,
      gravity: g,
      r: e.cfg.projType === 'arrow' ? 5 : 8,
      damage: e.damage,
    });
  }
}

// ============================================================
// CANVAS RENDERING
// ============================================================
function render() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, '#090b0f');
  sky.addColorStop(0.55, '#141922');
  sky.addColorStop(0.78, '#1e2530');
  sky.addColorStop(1, '#0c1016');
  ctx.fillStyle = sky;
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
  drawSinkingShips();
  drawEnemies();
  drawRollingStones();
  drawRagdolls();
  drawProjectiles();
  drawTracers();
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
  const moonX = L.worldW * 0.77;
  const moonY = L.isPortrait ? 180 : 142;
  const glow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 140);
  glow.addColorStop(0, 'rgba(255,255,255,0.2)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(moonX, moonY, 140, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(moonX, moonY, 24, 0, Math.PI * 2); ctx.fill();

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
  } else if (tid >= 7) {
    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x + 14, topY); ctx.lineTo(x + 14, L.seaY); ctx.moveTo(x + w - 14, topY); ctx.lineTo(x + w - 14, L.seaY); ctx.stroke();
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

  // Catapult frame
  ctx.beginPath();
  ctx.moveTo(baseX - 9, baseY - 5); ctx.lineTo(baseX + 24, baseY - 5);
  ctx.moveTo(baseX + 3, baseY - 5); ctx.lineTo(baseX + 13, baseY - 31); ctx.lineTo(baseX + 20, baseY - 5);
  ctx.stroke();

  ctx.fillStyle = '#0b0d10';
  [baseX - 3, baseX + 20].forEach((wx) => {
    ctx.beginPath(); ctx.arc(wx, baseY - 4, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });

  // Dynamic throwing arm
  let armAngle = -0.85;
  if (state.aiming) armAngle = -0.85 - clamp(Math.hypot(state.aimVx, state.aimVy) / 1150, 0, 1) * 1.35;
  else if (state.catapultRecoil > 0) armAngle = -0.85 + state.catapultRecoil * 0.95;

  const px = baseX + 9, py = baseY - 11;
  const tx = px + Math.cos(armAngle) * 34;
  const ty = py + Math.sin(armAngle) * 34;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();

  const ps = state.projectiles[state.selectedProj];
  if (ps && ps.charges >= 1) {
    ctx.fillStyle = state.selectedProj === 'fire' ? '#ffb142' : '#ffffff';
    ctx.beginPath(); ctx.arc(tx, ty - 2, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawShieldDome() {
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
  ctx.restore();
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

function drawPirateStickman(x, y) {
  ctx.save();
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y - 15);
  ctx.moveTo(x, y - 11); ctx.lineTo(x - 7, y - 7);
  ctx.moveTo(x, y - 11); ctx.lineTo(x + 7, y - 7);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - 20, 4.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(x - 8, y - 23); ctx.lineTo(x, y - 31); ctx.lineTo(x + 8, y - 23); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawShipVisual(x, y, cfg, type, flash, tilt, alpha, crew = [], cracks = []) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(tilt);

  const w = cfg.width;
  const h = cfg.height;

  if (cfg.air) {
    ctx.fillStyle = flash ? '#ffffff' : '#161b24';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -14, w * 0.5, h * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#0b0d10';
    ctx.fillRect(-18, 12, 36, 12); ctx.strokeRect(-18, 12, 36, 12);
  } else {
    // Draw surviving pirate crew
    crew.forEach((c) => { if (c.alive) drawPirateStickman(c.ox, -h + 4); });

    // Mast & Wind-billowing Sail
    if (type !== 'rammer') {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2;
      const mastH = cfg.boss ? 74 : 46;
      ctx.beginPath(); ctx.moveTo(12, -h + 2); ctx.lineTo(12, -h - mastH); ctx.stroke();
      const billow = -16 + state.windX * 0.12;
      ctx.fillStyle = cfg.boss ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)';
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(12, -h - mastH + 4);
      ctx.quadraticCurveTo(billow, -h - mastH * 0.55, 12, -h - 10);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // Hull
    ctx.fillStyle = flash ? '#ffffff' : (cfg.boss ? '#10141c' : '#181e28');
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = cfg.boss ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h + 4); ctx.lineTo(w * 0.5, -h + 4);
    ctx.lineTo(w * 0.36, 4); ctx.lineTo(-w * 0.38, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Dynamic Hull Cracks (visual damage instead of HP bars!)
    if (cracks.length) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.3;
      cracks.forEach((cr) => {
        ctx.beginPath();
        ctx.moveTo(cr.ox, cr.oy);
        ctx.lineTo(cr.ox + Math.cos(cr.ang) * cr.len, cr.oy + Math.sin(cr.ang) * cr.len);
        ctx.stroke();
      });
    }

    if (type === 'rammer') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-w * 0.5, -h + 10); ctx.lineTo(-w * 0.66, -h * 0.45); ctx.lineTo(-w * 0.44, -2); ctx.closePath(); ctx.fill();
    } else if (type === 'cannon' || cfg.boss) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-w * 0.5 - 8, -h + 10, 12, 5);
    }
  }
  ctx.restore();
}

function drawEnemies() {
  // ZERO HP bars or HP numbers — purely physical visual state!
  state.enemies.forEach((e) => {
    const bobY = e.cfg.air ? Math.sin(e.bobPhase) * 6 : 0;
    drawShipVisual(e.x, e.y + bobY, e.cfg, e.type, e.hitFlash > 0, e.listAngle, 1, e.crew, e.cracks);
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
    ctx.translate(rs.ox, -ship.cfg.height - rs.r * 0.4);
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
    } else {
      ctx.fillStyle = '#0b0d10'; ctx.strokeStyle = '#ff7675'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, ep.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  });
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
  ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(state.aimStartX, state.aimStartY); ctx.lineTo(state.aimCurrX, state.aimCurrY); ctx.stroke();
  ctx.setLineDash([]);

  // Wind-accurate parabolic trajectory preview!
  for (let step = 1; step <= 26; step++) {
    const t = step * 0.055;
    const px = sx + state.aimVx * t + 0.5 * state.windX * t * t;
    const py = sy + state.aimVy * t + 0.5 * GRAVITY * t * t;
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
  canvas.setPointerCapture(e.pointerId);
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
  else if (['1', '2', '3', '4', '5'].includes(k)) {
    const def = PROJECTILE_DEFS[Number(k) - 1];
    if (def && state.projectiles[def.id].unlocked) { state.selectedProj = def.id; updateDockDisplays(); }
  }
});

function togglePause() {
  if (state.shopOpen || state.lbOpen || state.gameOver) return;
  state.paused = !state.paused;
  dom.pauseModal.classList.toggle('hidden', !state.paused);
  dom.pauseBtn.querySelector('.ico').innerHTML = state.paused ? ICONS.play : ICONS.pause;
}

function toggleSound() {
  const muted = sound.toggleMute();
  dom.soundBtn.querySelector('.ico').innerHTML = muted ? ICONS.soundOff : ICONS.soundOn;
}

function restartGame() {
  state = createInitialState();
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
dom.cancelTargetBtn.addEventListener('click', cancelSkillTargeting);

// ============================================================
// BOOTSTRAP
// ============================================================
hydrateStaticIcons();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

state = createInitialState();
renderProjectileDock();
renderSkillDock();
updateHud();

let lastTs = performance.now();
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
