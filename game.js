import { ICONS } from './icons.js';
import { sound } from './audio.js';

// ============================================================
// CONFIG & DATA DEFINITIONS
// ============================================================
const WORLD_W = 1280;
const WORLD_H = 720;
const SEA_Y = 560;
const TOWER_X = 138;
const TOWER_W = 92;
const TOWER_TOP_Y = 334;
const CATAPULT_X = TOWER_X + 6;
const CATAPULT_Y = TOWER_TOP_Y - 12;
const GRAVITY = 820;

const TOWER_TIERS = [
  { id: 0, name: '木塔', maxHp: 100, armor: 0, cost: 0, desc: '基礎原木結構高塔，提供基本防禦。' },
  { id: 1, name: '石塔', maxHp: 185, armor: 2, cost: 90, desc: '厚實切石砌築，顯著提升耐久與抗打擊能力。' },
  { id: 2, name: '木板混合石塔', maxHp: 290, armor: 4, cost: 170, desc: '石材核心外覆強化木板支撐，緩衝砲火衝擊。' },
  { id: 3, name: '鐵塔', maxHp: 430, armor: 7, cost: 280, desc: '鉚接熟鐵裝甲覆蓋，有效抵禦弓箭與輕砲。' },
  { id: 4, name: '框架鐵塔', maxHp: 610, armor: 10, cost: 430, desc: '桁架式鋼鐵骨架分散衝擊力，結構穩固。' },
  { id: 5, name: '水泥塔', maxHp: 860, armor: 14, cost: 640, desc: '一體澆築厚重混凝土堡壘，極難撼動。' },
  { id: 6, name: '鐵架水泥塔', maxHp: 1180, armor: 19, cost: 920, desc: '混凝土主體搭配外部鐵架補強，防線升級。' },
  { id: 7, name: '鋼塔', maxHp: 1580, armor: 25, cost: 1300, desc: '流線型精鋼裝甲塔身，大幅減免敵艦傷害。' },
  { id: 8, name: '鋼筋水泥塔', maxHp: 2150, armor: 34, cost: 1850, desc: '終極複合鋼筋混凝土要塞，屹立於無盡狂潮。' },
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
    damage: 24,
    radius: 10,
    desc: '初始無限石塊。每 0.5 秒充能 1 顆，上限 1 顆。',
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
    damage: 17,
    radius: 8,
    desc: '單次發射 3 塊散射石頭，覆蓋更廣、壓制海盜船隊。',
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
    damage: 54,
    aoe: 112,
    radius: 13,
    desc: '命中或落水引爆，造成大範圍高爆發傷害與震盪波。',
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
    damage: 42,
    pierce: 3,
    radius: 12,
    desc: '重型破甲刺球，無視護甲並可貫穿最多 3 個目標。',
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
    aoe: 92,
    burnDps: 14,
    burnDur: 4.2,
    radius: 12,
    desc: '烈焰投擲物，濺射並點燃敵船造成持續灼燒傷害。',
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
    desc: '立即修復高塔 35% 最大耐久度。點擊或拖曳至塔上即可使用。',
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
    desc: '拖曳或點擊指定區域，降下 28 支高速流線箭矢覆蓋打擊。',
  },
  {
    id: 'shield',
    name: '5秒盾',
    short: '5秒盾',
    icon: 'skill_shield',
    cost: 110,
    cooldown: 8,
    targeted: false,
    desc: '展開 5 秒無敵幾何力場護盾，抵擋所有敵方攻擊與砲火。',
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
    desc: '拖曳或點擊投放至海面，敵船觸碰立即引爆造成巨額傷害。',
  },
];

const ENEMY_TYPES = {
  skiff: {
    name: '海盜輕舟',
    minLv: 1,
    hp: 34,
    armor: 0,
    speed: 68,
    damage: 9,
    attackCd: 1.5,
    stopX: TOWER_X + TOWER_W * 0.5 + 34,
    width: 72,
    height: 26,
    bounty: 14,
    ranged: false,
    air: false,
    crew: 1,
  },
  archer: {
    name: '弓手帆船',
    minLv: 1,
    hp: 46,
    armor: 0,
    speed: 52,
    damage: 7,
    attackCd: 2.3,
    stopX: 540,
    width: 84,
    height: 30,
    bounty: 20,
    ranged: true,
    projType: 'arrow',
    air: false,
    crew: 1,
  },
  cannon: {
    name: '加農砲艦',
    minLv: 2,
    hp: 82,
    armor: 3,
    speed: 42,
    damage: 16,
    attackCd: 3.1,
    stopX: 650,
    width: 102,
    height: 36,
    bounty: 34,
    ranged: true,
    projType: 'cannonball',
    air: false,
    crew: 1,
  },
  rammer: {
    name: '裝甲衝撞艦',
    minLv: 3,
    hp: 135,
    armor: 8,
    speed: 58,
    damage: 24,
    attackCd: 1.9,
    stopX: TOWER_X + TOWER_W * 0.5 + 46,
    width: 108,
    height: 38,
    bounty: 46,
    ranged: false,
    air: false,
    crew: 1,
  },
  catapult: {
    name: '海盜投石艦',
    minLv: 3,
    hp: 105,
    armor: 4,
    speed: 36,
    damage: 20,
    attackCd: 3.6,
    stopX: 780,
    width: 112,
    height: 38,
    bounty: 52,
    ranged: true,
    projType: 'boulder',
    air: false,
    crew: 1,
  },
  zeppelin: {
    name: '海盜飛艇',
    minLv: 4,
    hp: 95,
    armor: 2,
    speed: 48,
    damage: 18,
    attackCd: 2.8,
    stopX: 390,
    width: 116,
    height: 48,
    bounty: 58,
    ranged: true,
    projType: 'airbomb',
    air: true,
    flyY: 175,
    crew: 1,
  },
  dreadnought: {
    name: '無畏黑帆旗艦',
    minLv: 5,
    hp: 310,
    armor: 12,
    speed: 26,
    damage: 32,
    attackCd: 2.9,
    stopX: 590,
    width: 158,
    height: 52,
    bounty: 140,
    ranged: true,
    projType: 'cannonball',
    air: false,
    crew: 2,
    boss: true,
  },
};

// ============================================================
// DOM ELEMENTS & INITIAL ICON INJECTION
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const dom = {
  projectileDock: document.getElementById('projectileDock'),
  skillDock: document.getElementById('skillDock'),
  hpBarFill: document.getElementById('hpBarFill'),
  hpText: document.getElementById('hpText'),
  towerTierBadge: document.getElementById('towerTierBadge'),
  coinText: document.getElementById('coinText'),
  intensityText: document.getElementById('intensityText'),
  timeText: document.getElementById('timeText'),
  killText: document.getElementById('killText'),
  shopBtn: document.getElementById('shopBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  soundBtn: document.getElementById('soundBtn'),
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
  pauseModal: document.getElementById('pauseModal'),
  resumeBtn: document.getElementById('resumeBtn'),
  pauseRestartBtn: document.getElementById('pauseRestartBtn'),
  gameOverModal: document.getElementById('gameOverModal'),
  finalTime: document.getElementById('finalTime'),
  finalIntensity: document.getElementById('finalIntensity'),
  finalKills: document.getElementById('finalKills'),
  bestRecord: document.getElementById('bestRecord'),
  restartBtn: document.getElementById('restartBtn'),
};

function hydrateStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const key = el.getAttribute('data-icon');
    if (ICONS[key]) el.innerHTML = ICONS[key];
  });
}

// ============================================================
// GAME STATE
// ============================================================
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;

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
    skills[def.id] = {
      count: 0,
      cd: 0,
    };
  });

  return {
    elapsed: 0,
    intensity: 1,
    coins: 0,
    kills: 0,
    towerTier: 0,
    towerHp: TOWER_TIERS[0].maxHp,
    towerMaxHp: TOWER_TIERS[0].maxHp,
    towerArmor: TOWER_TIERS[0].armor,
    shieldTimer: 0,
    selectedProj: 'stone',
    projectiles,
    skills,
    enemies: [],
    sinking: [],
    playerProjs: [],
    enemyProjs: [],
    mines: [],
    particles: [],
    popups: [],
    rainArrows: [],
    spawnTimer: 1.0,
    hasSpawnedAny: false,
    rushTimer: 0,
    rushMax: 3.5,
    bossTimer: 75,
    shopOpen: false,
    paused: false,
    gameOver: false,
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
    // Skill targeting / dragging
    activeTargetSkill: null,
    draggingSkill: null,
    pointerWorldX: WORLD_W * 0.55,
    pointerWorldY: SEA_Y - 20,
    bestTime: Number(localStorage.getItem('throw_best_time') || 0),
  };
}

// ============================================================
// COORDINATE TRANSFORMS
// ============================================================
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  // Fit world cleanly while filling full screen seamlessly
  const scaleX = w / WORLD_W;
  const scaleY = h / WORLD_H;
  viewScale = Math.min(scaleX, scaleY);
  viewOffsetX = (w - WORLD_W * viewScale) * 0.5;
  viewOffsetY = (h - WORLD_H * viewScale) * 0.5;
}

function screenToWorld(clientX, clientY) {
  return {
    x: (clientX - viewOffsetX) / viewScale,
    y: (clientY - viewOffsetY) / viewScale,
  };
}

// ============================================================
// HELPERS
// ============================================================
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function addPopup(x, y, text, color = '#ffffff', size = 15) {
  state.popups.push({ x, y, text, color, size, life: 1.0, maxLife: 1.0, vy: -46 });
}

function spawnParticles(x, y, count, opts = {}) {
  const {
    color = '#ffffff',
    speed = 160,
    gravity = 380,
    size = 3,
    life = 0.65,
    spread = Math.PI * 2,
    angle = -Math.PI / 2,
  } = opts;
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const sp = speed * (0.35 + Math.random() * 0.85);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      gravity,
      size: size * (0.6 + Math.random() * 0.8),
      color,
      life: life * (0.65 + Math.random() * 0.55),
      maxLife: life,
    });
  }
}

function spawnWaterSplash(x, power = 1) {
  spawnParticles(x, SEA_Y, Math.round(10 * power), {
    color: 'rgba(255,255,255,0.85)',
    speed: 150 * power,
    gravity: 480,
    size: 3.2,
    life: 0.6,
    spread: Math.PI * 0.65,
    angle: -Math.PI / 2,
  });
  sound.playSplash();
}

function spawnExplosion(x, y, radius, isFire = false) {
  state.shake = Math.min(18, state.shake + (isFire ? 7 : 10));
  sound.playExplosion();
  state.particles.push({
    type: 'ring',
    x,
    y,
    r: 10,
    maxR: radius,
    color: isFire ? '#ff9f43' : '#ffffff',
    life: 0.34,
    maxLife: 0.34,
  });
  spawnParticles(x, y, isFire ? 26 : 22, {
    color: isFire ? '#ffb142' : '#ffffff',
    speed: 240,
    gravity: 220,
    size: 4,
    life: 0.65,
  });
  spawnParticles(x, y, 12, {
    color: 'rgba(180,190,205,0.7)',
    speed: 120,
    gravity: -40,
    size: 6,
    life: 0.8,
  });
}

// ============================================================
// HUD & SHOP UI RENDERING
// ============================================================
function renderProjectileDock() {
  dom.projectileDock.innerHTML = '';
  PROJECTILE_DEFS.forEach((def) => {
    const ps = state.projectiles[def.id];
    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    if (state.selectedProj === def.id) btn.classList.add('active');
    if (!ps.unlocked) btn.classList.add('locked');

    const subText = ps.unlocked
      ? `${ps.charges}/${def.maxCharges}`
      : `${def.unlockCost}G`;

    const pct = ps.unlocked
      ? (ps.charges >= def.maxCharges ? 100 : Math.floor((ps.timer / def.reload) * 100))
      : 0;

    btn.innerHTML = `
      <span class="ico">${ICONS[def.icon]}</span>
      <span class="dock-meta">
        <span class="dock-name">${def.short}</span>
        <span class="dock-sub">${subText}</span>
      </span>
      <span class="dock-key">${def.key}</span>
      <span class="dock-cooldown" style="width:${pct}%"></span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!ps.unlocked) {
        openShop('projectile');
        return;
      }
      state.selectedProj = def.id;
      updateDockDisplays();
    });

    dom.projectileDock.appendChild(btn);
    btn.dataset.projId = def.id;
  });
}

function renderSkillDock() {
  dom.skillDock.innerHTML = '';
  SKILL_DEFS.forEach((def) => {
    const ss = state.skills[def.id];
    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    if (ss.count <= 0) btn.classList.add('empty');
    if (state.activeTargetSkill === def.id) btn.classList.add('targeting');

    btn.innerHTML = `
      <span class="ico">${ICONS[def.icon]}</span>
      <span class="dock-meta">
        <span class="dock-name">${def.short}</span>
        <span class="dock-sub">${ss.count > 0 ? `×${ss.count}` : '未購買'}</span>
      </span>
      <span class="dock-cooldown" style="width:0%"></span>
    `;

    // Support both Drag-to-Cast and Click-to-Cast
    let startX = 0;
    let startY = 0;
    let dragged = false;

    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sound.init();
      if (state.gameOver || state.paused || state.shopOpen) return;
      if (ss.count <= 0) {
        openShop('skill');
        return;
      }
      if (ss.cd > 0) return;

      startX = e.clientX;
      startY = e.clientY;
      dragged = false;

      const onMove = (ev) => {
        const d = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (d > 10) {
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
          // Drop onto battlefield if dragged away from right edge dock
          if (ev.clientX < window.innerWidth - 70 || !def.targeted) {
            castSkill(def.id, wp.x, wp.y);
          }
        } else {
          // Click behavior
          if (!def.targeted) {
            castSkill(def.id, TOWER_X, TOWER_TOP_Y);
          } else {
            if (state.activeTargetSkill === def.id) {
              cancelSkillTargeting();
            } else {
              state.activeTargetSkill = def.id;
              dom.targetHintText.textContent = `點擊戰場施放「${def.name}」（右鍵或 ESC 取消）`;
              dom.targetHint.classList.remove('hidden');
              updateDockDisplays();
            }
          }
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    dom.skillDock.appendChild(btn);
    btn.dataset.skillId = def.id;
  });
}

function updateDockDisplays() {
  // Update projectile buttons smoothly without rebuilding DOM
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
      const pct = ps.charges >= def.maxCharges ? 100 : Math.floor((ps.timer / def.reload) * 100);
      bar.style.width = `${pct}%`;
    } else {
      sub.textContent = `${def.unlockCost}G`;
      bar.style.width = '0%';
    }
  });

  // Update skill buttons
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
  const hpPct = clamp((state.towerHp / state.towerMaxHp) * 100, 0, 100);
  dom.hpBarFill.style.width = `${hpPct}%`;
  dom.hpBarFill.style.background = hpPct < 28 ? '#ff6b6b' : '#ffffff';
  dom.hpText.textContent = `${Math.ceil(state.towerHp)} / ${state.towerMaxHp}`;
  dom.towerTierBadge.textContent = TOWER_TIERS[state.towerTier].name;
  dom.coinText.textContent = state.coins;
  dom.shopCoinText.textContent = state.coins;
  dom.intensityText.textContent = `Lv.${state.intensity}`;
  dom.timeText.textContent = formatTime(state.elapsed);
  dom.killText.textContent = state.kills;

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
// SHOP SYSTEM (PAUSES TIME)
// ============================================================
function openShop(tab = shopTab) {
  if (state.gameOver) return;
  shopTab = tab;
  state.shopOpen = true;
  cancelSkillTargeting();
  dom.shopModal.classList.remove('hidden');
  document.querySelectorAll('.shop-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === shopTab);
  });
  renderShopBody();
  updateHud();
}

function closeShop() {
  state.shopOpen = false;
  dom.shopModal.classList.add('hidden');
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
        btnHtml = `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>目前等級</span></button>`;
      } else if (isOwned) {
        btnHtml = `<button class="buy-btn" disabled><span class="ico">${ICONS.check}</span><span>已超越</span></button>`;
      } else if (isNext) {
        const canAfford = state.coins >= tier.cost;
        btnHtml = `<button class="buy-btn" ${canAfford ? '' : 'disabled'} data-buy-tower="${tier.id}">
          <span class="ico">${ICONS.upgrade}</span>
          <span>升級加固 · ${tier.cost}G</span>
        </button>`;
      } else {
        btnHtml = `<button class="buy-btn" disabled><span class="ico">${ICONS.lock}</span><span>需先升級前一階 · ${tier.cost}G</span></button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[`tower_${tier.id}`]}</span></div>
          <div class="card-title-wrap">
            <div class="card-title">${tier.name} <span class="card-tag">T${tier.id + 1}</span></div>
          </div>
        </div>
        <p class="card-desc">${tier.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">耐久 ${tier.maxHp}</span>
          <span class="card-stat-chip">護甲 ${tier.armor}</span>
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
        state.towerHp = Math.min(state.towerMaxHp, state.towerHp + hpGain + Math.round(tier.maxHp * 0.2));
        sound.playBuy();
        spawnParticles(TOWER_X, TOWER_TOP_Y + 60, 24, { color: '#ffffff', speed: 180, life: 0.75 });
        addPopup(TOWER_X, TOWER_TOP_Y - 30, `加固完成：${tier.name}`, '#ffffff', 16);
        renderShopBody();
        updateHud();
      });
    });
  } else if (shopTab === 'projectile') {
    PROJECTILE_DEFS.forEach((def) => {
      const ps = state.projectiles[def.id];
      const dmg = getProjectileDamage(def, ps.level);
      const upgCost = Math.round(def.upgradeBase * Math.pow(1.65, ps.level - 1));
      const maxLv = 6;

      const card = document.createElement('div');
      card.className = 'shop-card';
      if (state.selectedProj === def.id) card.classList.add('owned-current');

      let btnHtml = '';
      if (!ps.unlocked) {
        const canAfford = state.coins >= def.unlockCost;
        btnHtml = `<button class="buy-btn" ${canAfford ? '' : 'disabled'} data-unlock-proj="${def.id}">
          <span class="ico">${ICONS.coin}</span>
          <span>解鎖購買 · ${def.unlockCost}G</span>
        </button>`;
      } else if (ps.level < maxLv) {
        const canAfford = state.coins >= upgCost;
        btnHtml = `<button class="buy-btn" ${canAfford ? '' : 'disabled'} data-upg-proj="${def.id}">
          <span class="ico">${ICONS.upgrade}</span>
          <span>強化至 Lv.${ps.level + 1} · ${upgCost}G</span>
        </button>`;
      } else {
        btnHtml = `<button class="buy-btn equipped" disabled><span class="ico">${ICONS.check}</span><span>已達滿級</span></button>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap">
            <div class="card-title">${def.name} <span class="card-tag">${ps.unlocked ? `Lv.${ps.level}` : '未解鎖'}</span></div>
          </div>
        </div>
        <p class="card-desc">${def.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">傷害 ${dmg}${def.id === 'triple' ? '×3' : ''}</span>
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
      const canAfford = state.coins >= def.cost;
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (ss.count > 0) card.classList.add('owned-current');

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon"><span class="ico">${ICONS[def.icon]}</span></div>
          <div class="card-title-wrap">
            <div class="card-title">${def.name} <span class="card-tag">庫存 ×${ss.count}</span></div>
          </div>
        </div>
        <p class="card-desc">${def.desc}</p>
        <div class="card-stats">
          <span class="card-stat-chip">冷卻 ${def.cooldown}s</span>
          <span class="card-stat-chip">${def.targeted ? '拖拽 / 點擊施放' : '點擊即刻發動'}</span>
        </div>
        <button class="buy-btn" ${canAfford ? '' : 'disabled'} data-buy-skill="${def.id}">
          <span class="ico">${ICONS.coin}</span>
          <span>購買 1 次 · ${def.cost}G</span>
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
  }
}

function getProjectileDamage(def, level) {
  return Math.round(def.damage * (1 + (level - 1) * 0.28));
}

// ============================================================
// SKILLS EXECUTION
// ============================================================
function cancelSkillTargeting() {
  state.activeTargetSkill = null;
  state.draggingSkill = null;
  dom.targetHint.classList.add('hidden');
  dom.skillDragGhost.classList.add('hidden');
  updateDockDisplays();
}

function castSkill(id, wx, wy) {
  const def = SKILL_DEFS.find((d) => d.id === id);
  const ss = state.skills[id];
  if (!def || ss.count <= 0 || ss.cd > 0) return;

  ss.count -= 1;
  ss.cd = def.cooldown;
  cancelSkillTargeting();
  sound.playSkill();

  const tx = clamp(wx, TOWER_X + 90, WORLD_W - 40);

  if (id === 'repair') {
    const heal = Math.round(state.towerMaxHp * 0.35);
    state.towerHp = Math.min(state.towerMaxHp, state.towerHp + heal);
    spawnParticles(TOWER_X, TOWER_TOP_Y + 90, 26, {
      color: '#ffffff',
      speed: 140,
      gravity: -80,
      size: 4,
      life: 0.9,
    });
    addPopup(TOWER_X, TOWER_TOP_Y - 24, `+${heal} 修復`, '#ffffff', 17);
  } else if (id === 'shield') {
    state.shieldTimer = 5.0;
    spawnParticles(TOWER_X, TOWER_TOP_Y + 80, 24, {
      color: '#ffffff',
      speed: 170,
      gravity: 0,
      size: 3.5,
      life: 0.65,
    });
    addPopup(TOWER_X, TOWER_TOP_Y - 24, '5秒護盾啟動', '#ffffff', 16);
  } else if (id === 'arrows') {
    const count = 28;
    const dmg = Math.round(18 + state.intensity * 4.5);
    for (let i = 0; i < count; i++) {
      const offset = (Math.random() - 0.5) * 280;
      state.rainArrows.push({
        x: clamp(tx + offset, TOWER_X + 70, WORLD_W - 20),
        y: -40 - Math.random() * 340,
        vx: -45 + Math.random() * 20,
        vy: 760 + Math.random() * 220,
        damage: dmg,
        type: 'arrow',
      });
    }
    addPopup(tx, 160, '區域箭雨', '#ffffff', 16);
  } else if (id === 'meteor') {
    const count = 7;
    const dmg = Math.round(55 + state.intensity * 11);
    for (let i = 0; i < count; i++) {
      const offset = (i - 3) * 44 + (Math.random() - 0.5) * 24;
      state.rainArrows.push({
        x: clamp(tx + offset, TOWER_X + 90, WORLD_W - 30) - 90,
        y: -70 - i * 85 - Math.random() * 50,
        vx: 130,
        vy: 640 + Math.random() * 100,
        damage: dmg,
        type: 'meteor',
      });
    }
    addPopup(tx, 150, '區域火球轟炸', '#ffb142', 17);
  } else if (id === 'mine') {
    state.mines.push({
      x: tx,
      y: SEA_Y,
      phase: Math.random() * Math.PI * 2,
      radius: 17,
      damage: Math.round(95 + state.intensity * 18),
      aoe: 130,
      armed: 0.4,
    });
    spawnWaterSplash(tx, 0.85);
    addPopup(tx, SEA_Y - 34, '水雷已部署', '#ffffff', 14);
  }

  updateHud();
}

// ============================================================
// LAUNCHING PROJECTILES
// ============================================================
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
      x: CATAPULT_X + 12,
      y: CATAPULT_Y - 12,
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
  const sx = CATAPULT_X + 12;
  const sy = CATAPULT_Y - 12;
  const dx = Math.max(80, tx - sx);
  const dy = ty - sy;
  const t = clamp(dx / 640, 0.55, 1.55);
  const vx = dx / t;
  const vy = (dy - 0.5 * GRAVITY * t * t) / t;
  return { vx: clamp(vx, 160, 1080), vy: clamp(vy, -940, -120) };
}

// ============================================================
// ENEMY SPAWNING & COMBAT
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
      if (r <= 0) {
        typeKey = p.k;
        break;
      }
    }
  }

  const cfg = ENEMY_TYPES[typeKey];
  const scaleHp = 1 + (lv - 1) * 0.28;
  const scaleDmg = 1 + (lv - 1) * 0.16;
  const scaleSpeed = 1 + Math.min(0.65, (lv - 1) * 0.05);
  const bounty = Math.round(cfg.bounty * (1 + (lv - 1) * 0.22));
  const maxHp = Math.round(cfg.hp * scaleHp);

  const stopJitter = cfg.ranged ? (Math.random() - 0.5) * 140 : 0;

  state.enemies.push({
    id: Math.random().toString(36).slice(2),
    type: typeKey,
    cfg,
    x: WORLD_W + cfg.width * 0.6 + Math.random() * 40,
    y: cfg.air ? cfg.flyY + (Math.random() - 0.5) * 70 : SEA_Y,
    hp: maxHp,
    maxHp,
    armor: cfg.armor + Math.floor((lv - 1) * 0.4),
    speed: cfg.speed * scaleSpeed,
    damage: Math.round(cfg.damage * scaleDmg),
    stopX: clamp(cfg.stopX + stopJitter, TOWER_X + 95, WORLD_W - 140),
    attackTimer: cfg.attackCd * (0.4 + Math.random() * 0.5),
    bounty,
    burnTimer: 0,
    burnDps: 0,
    hitFlash: 0,
    bobPhase: Math.random() * Math.PI * 2,
    crewAlive: cfg.crew,
  });

  state.hasSpawnedAny = true;
}

function damageEnemy(enemy, rawDmg, opts = {}) {
  const { ignoreArmor = false, isHeadshot = false, burnDps = 0, burnDur = 0 } = opts;
  const effectiveArmor = ignoreArmor ? 0 : enemy.armor;
  let dmg = Math.max(4, Math.round(rawDmg - effectiveArmor * 0.55));
  if (isHeadshot) dmg = Math.round(dmg * 1.45);

  enemy.hp -= dmg;
  enemy.hitFlash = 0.16;

  if (burnDps > 0) {
    enemy.burnDps = Math.max(enemy.burnDps, burnDps);
    enemy.burnTimer = Math.max(enemy.burnTimer, burnDur);
  }

  addPopup(
    enemy.x + (Math.random() - 0.5) * 20,
    enemy.y - enemy.cfg.height - 14,
    isHeadshot ? `暴擊 -${dmg}` : `-${dmg}`,
    isHeadshot ? '#ffeaa7' : '#ffffff',
    isHeadshot ? 16 : 13
  );

  if (enemy.hp <= 0) {
    defeatEnemy(enemy);
    return true;
  }
  return false;
}

function defeatEnemy(enemy) {
  const idx = state.enemies.indexOf(enemy);
  if (idx !== -1) state.enemies.splice(idx, 1);

  state.coins += enemy.bounty;
  state.kills += 1;
  sound.playCoin();

  addPopup(enemy.x, enemy.y - enemy.cfg.height - 34, `+${enemy.bounty}G`, '#ffeaa7', 16);

  // Sinking ship / falling airship animation
  state.sinking.push({
    x: enemy.x,
    y: enemy.y,
    cfg: enemy.cfg,
    type: enemy.type,
    tilt: 0,
    tiltDir: Math.random() < 0.5 ? -1 : 1,
    vy: enemy.cfg.air ? 60 : 18,
    alpha: 1,
    life: 1.5,
  });

  spawnParticles(enemy.x, enemy.y - 14, enemy.cfg.boss ? 36 : 16, {
    color: '#ffffff',
    speed: 190,
    gravity: 340,
    size: 3.5,
    life: 0.7,
  });

  if (!enemy.cfg.air) {
    spawnWaterSplash(enemy.x, enemy.cfg.boss ? 1.5 : 0.9);
  } else {
    spawnExplosion(enemy.x, enemy.y, 65, true);
  }

  // Trigger Clear Rush x3 if screen is completely cleared!
  if (state.hasSpawnedAny && state.enemies.length === 0) {
    state.rushTimer = state.rushMax;
    state.spawnTimer = Math.min(state.spawnTimer, 0.35);
    addPopup(WORLD_W * 0.5, 190, '清場！敵軍來襲速度 ×3', '#ffffff', 18);
  }
}

function damageTower(rawDmg, hitY = TOWER_TOP_Y + 60) {
  if (state.shieldTimer > 0) {
    spawnParticles(TOWER_X + TOWER_W * 0.5 + 14, hitY, 10, {
      color: '#ffffff',
      speed: 140,
      gravity: 0,
      size: 3,
      life: 0.4,
    });
    addPopup(TOWER_X + 40, hitY - 12, '護盾格擋', '#ffffff', 13);
    return;
  }

  const dmg = Math.max(2, Math.round(rawDmg - state.towerArmor * 0.45));
  state.towerHp = Math.max(0, state.towerHp - dmg);
  state.towerFlash = 0.22;
  state.shake = Math.min(14, state.shake + 5);
  sound.playTowerHit();
  addPopup(TOWER_X + 20, hitY - 18, `-${dmg}`, '#ff7675', 15);
  spawnParticles(TOWER_X + TOWER_W * 0.4, hitY, 10, {
    color: '#ffffff',
    speed: 140,
    gravity: 360,
    size: 3,
    life: 0.5,
  });

  if (state.towerHp <= 0) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  state.gameOver = true;
  cancelSkillTargeting();
  if (state.elapsed > state.bestTime) {
    state.bestTime = state.elapsed;
    localStorage.setItem('throw_best_time', String(Math.floor(state.bestTime)));
  }
  dom.finalTime.textContent = formatTime(state.elapsed);
  dom.finalIntensity.textContent = `Lv.${state.intensity}`;
  dom.finalKills.textContent = state.kills;
  dom.bestRecord.textContent = formatTime(state.bestTime);
  dom.gameOverModal.classList.remove('hidden');
}

// ============================================================
// MAIN UPDATE LOOP
// ============================================================
function update(dt) {
  if (state.shopOpen || state.paused || state.gameOver) return;

  state.elapsed += dt;
  const newIntensity = 1 + Math.floor(state.elapsed / 24);
  if (newIntensity > state.intensity) {
    state.intensity = newIntensity;
    addPopup(WORLD_W * 0.5, 140, `強度提升 · Lv.${state.intensity}`, '#ffffff', 18);
  }

  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 32);
  if (state.towerFlash > 0) state.towerFlash = Math.max(0, state.towerFlash - dt);
  if (state.catapultRecoil > 0) state.catapultRecoil = Math.max(0, state.catapultRecoil - dt * 4.5);
  if (state.shieldTimer > 0) state.shieldTimer = Math.max(0, state.shieldTimer - dt);

  // Clear Rush x3 multiplier
  const rushMult = state.rushTimer > 0 ? 3.0 : 1.0;
  if (state.rushTimer > 0) {
    state.rushTimer = Math.max(0, state.rushTimer - dt);
  }

  // Projectile recharge timers
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
    const ss = state.skills[def.id];
    if (ss.cd > 0) ss.cd = Math.max(0, ss.cd - dt);
  });

  // Enemy spawning
  const baseInterval = Math.max(1.15, 3.6 - state.intensity * 0.24);
  state.spawnTimer -= dt * rushMult;
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = baseInterval * (0.75 + Math.random() * 0.5);
  }

  // Periodic Dreadnought Boss at Lv.5+
  if (state.intensity >= 5) {
    state.bossTimer -= dt;
    if (state.bossTimer <= 0) {
      spawnEnemy('dreadnought');
      addPopup(WORLD_W * 0.5, 180, '警告：無畏黑帆旗艦來襲！', '#ffeaa7', 19);
      state.bossTimer = Math.max(48, 82 - state.intensity * 3);
    }
  }

  // Update Player Projectiles
  for (let i = state.playerProjs.length - 1; i >= 0; i--) {
    const p = state.playerProjs[i];
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 14) p.trail.shift();

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 7;

    // Mid-air interception of enemy projectiles!
    let intercepted = false;
    for (let j = state.enemyProjs.length - 1; j >= 0; j--) {
      const ep = state.enemyProjs[j];
      if (Math.hypot(p.x - ep.x, p.y - ep.y) < p.r + ep.r + 8) {
        state.enemyProjs.splice(j, 1);
        spawnParticles(ep.x, ep.y, 12, { color: '#ffffff', speed: 150, life: 0.45 });
        addPopup(ep.x, ep.y - 12, '攔截！', '#ffffff', 13);
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
      const topY = e.cfg.air ? e.y - e.cfg.height * 0.55 : e.y - e.cfg.height - 26;
      const botY = e.cfg.air ? e.y + e.cfg.height * 0.55 : e.y + 8;

      if (p.x + p.r >= e.x - halfW && p.x - p.r <= e.x + halfW && p.y + p.r >= topY && p.y - p.r <= botY) {
        p.hitIds.add(e.id);
        const isHeadshot = !e.cfg.air && p.y < e.y - e.cfg.height - 2;

        if (p.type === 'bomb' || p.type === 'fire') {
          detonatePlayerProj(p);
          state.playerProjs.splice(i, 1);
          removed = true;
          break;
        } else {
          sound.playHit(p.type === 'spike');
          spawnParticles(p.x, p.y, 9, { color: '#ffffff', speed: 150, life: 0.45 });
          damageEnemy(e, p.damage, {
            ignoreArmor: p.type === 'spike',
            isHeadshot,
          });
          p.pierceLeft -= 1;
          if (p.pierceLeft <= 0) {
            state.playerProjs.splice(i, 1);
            removed = true;
            break;
          }
        }
      }
    }
    if (removed) continue;

    // Water hit or out of bounds
    if (p.y >= SEA_Y) {
      if (p.type === 'bomb' || p.type === 'fire') {
        p.y = SEA_Y;
        detonatePlayerProj(p);
      } else {
        spawnWaterSplash(p.x, 0.75);
      }
      state.playerProjs.splice(i, 1);
    } else if (p.x > WORLD_W + 120 || p.x < -120 || p.y > WORLD_H + 120) {
      state.playerProjs.splice(i, 1);
    }
  }

  // Update Rain Arrows & Meteors (Skills)
  for (let i = state.rainArrows.length - 1; i >= 0; i--) {
    const r = state.rainArrows[i];
    r.x += r.vx * dt;
    r.y += r.vy * dt;

    if (r.type === 'arrow') {
      let hit = false;
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (Math.abs(r.x - e.x) < e.cfg.width * 0.55 && Math.abs(r.y - (e.y - e.cfg.height * 0.5)) < e.cfg.height + 16) {
          damageEnemy(e, r.damage, { ignoreArmor: false });
          spawnParticles(r.x, r.y, 5, { color: '#ffffff', speed: 100, life: 0.3 });
          hit = true;
          break;
        }
      }
      if (hit || r.y >= SEA_Y) {
        if (!hit) spawnWaterSplash(r.x, 0.35);
        state.rainArrows.splice(i, 1);
      }
    } else {
      // Meteor
      spawnParticles(r.x, r.y, 1, { color: '#ffb142', speed: 40, gravity: -20, size: 3.5, life: 0.28 });
      let hitEnemy = false;
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (Math.hypot(r.x - e.x, r.y - (e.y - 12)) < e.cfg.width * 0.55) {
          hitEnemy = true;
          break;
        }
      }
      if (hitEnemy || r.y >= SEA_Y) {
        spawnExplosion(r.x, Math.min(r.y, SEA_Y), 108, true);
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
          if (Math.hypot(e.x - r.x, e.y - Math.min(r.y, SEA_Y)) <= 108 + e.cfg.width * 0.4) {
            damageEnemy(e, r.damage, { burnDps: 16, burnDur: 4 });
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
    if (m.armed > 0) {
      m.armed -= dt;
      continue;
    }
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (e.cfg.air) continue;
      if (Math.abs(e.x - m.x) < e.cfg.width * 0.5 + m.radius) {
        spawnExplosion(m.x, SEA_Y, m.aoe, false);
        spawnWaterSplash(m.x, 1.6);
        for (let k = state.enemies.length - 1; k >= 0; k--) {
          const target = state.enemies[k];
          if (target.cfg.air) continue;
          if (Math.abs(target.x - m.x) <= m.aoe + target.cfg.width * 0.4) {
            target.x += 42; // Knockback!
            damageEnemy(target, m.damage, { ignoreArmor: true });
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

    // Burn DoT
    if (e.burnTimer > 0) {
      e.burnTimer -= dt;
      if (Math.random() < 0.35) {
        spawnParticles(e.x + (Math.random() - 0.5) * e.cfg.width * 0.5, e.y - 16, 1, {
          color: '#ffb142',
          speed: 45,
          gravity: -90,
          size: 3,
          life: 0.35,
        });
      }
      e.hp -= e.burnDps * dt;
      if (e.hp <= 0) {
        defeatEnemy(e);
        continue;
      }
    }

    // Move or Attack
    const moveSpeed = e.speed * (state.rushTimer > 0 ? 1.85 : 1.0);
    if (e.x > e.stopX) {
      e.x = Math.max(e.stopX, e.x - moveSpeed * dt);
    } else {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        e.attackTimer = e.cfg.attackCd;
        if (e.cfg.ranged) {
          fireEnemyProjectile(e);
        } else {
          damageTower(e.damage, SEA_Y - 50);
          e.x += 12; // Small recoil
        }
      }
    }
  }

  // Update Enemy Projectiles
  for (let i = state.enemyProjs.length - 1; i >= 0; i--) {
    const ep = state.enemyProjs[i];
    ep.vy += ep.gravity * dt;
    ep.x += ep.vx * dt;
    ep.y += ep.vy * dt;

    // Hit tower
    if (
      ep.x - ep.r <= TOWER_X + TOWER_W * 0.52 &&
      ep.x + ep.r >= TOWER_X - TOWER_W * 0.52 &&
      ep.y + ep.r >= TOWER_TOP_Y - 12 &&
      ep.y - ep.r <= SEA_Y
    ) {
      damageTower(ep.damage, ep.y);
      state.enemyProjs.splice(i, 1);
      continue;
    }

    if (ep.y >= SEA_Y || ep.x < -60) {
      if (ep.y >= SEA_Y) spawnWaterSplash(ep.x, 0.45);
      state.enemyProjs.splice(i, 1);
    }
  }

  // Update Sinking Ships
  for (let i = state.sinking.length - 1; i >= 0; i--) {
    const s = state.sinking[i];
    s.life -= dt;
    s.y += s.vy * dt;
    s.tilt += s.tiltDir * dt * 0.9;
    s.alpha = clamp(s.life / 1.5, 0, 1);
    if (s.life <= 0) state.sinking.splice(i, 1);
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    if (pt.type === 'ring') {
      pt.r = pt.maxR * (1 - pt.life / pt.maxLife);
    } else {
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
  }

  // Update Popups
  for (let i = state.popups.length - 1; i >= 0; i--) {
    const pp = state.popups[i];
    pp.life -= dt;
    pp.y += pp.vy * dt;
    if (pp.life <= 0) state.popups.splice(i, 1);
  }

  updateHud();
}

function detonatePlayerProj(p) {
  const isFire = p.type === 'fire';
  spawnExplosion(p.x, p.y, p.aoe, isFire);
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j];
    const dist = Math.hypot(e.x - p.x, (e.y - e.cfg.height * 0.4) - p.y);
    if (dist <= p.aoe + e.cfg.width * 0.42) {
      const falloff = 1 - (dist / (p.aoe + e.cfg.width * 0.5)) * 0.35;
      damageEnemy(e, p.damage * falloff, {
        ignoreArmor: p.type === 'bomb',
        burnDps: p.burnDps,
        burnDur: p.burnDur,
      });
    }
  }
}

function fireEnemyProjectile(e) {
  const sx = e.x - e.cfg.width * 0.25;
  const sy = e.cfg.air ? e.y + 18 : e.y - e.cfg.height - 10;
  const tx = TOWER_X + (Math.random() - 0.5) * 36;
  const ty = TOWER_TOP_Y + 40 + Math.random() * 140;

  if (e.cfg.projType === 'airbomb') {
    const t = 1.25;
    state.enemyProjs.push({
      type: 'airbomb',
      x: sx,
      y: sy,
      vx: (tx - sx) / t,
      vy: 40,
      gravity: 460,
      r: 9,
      damage: e.damage,
    });
  } else {
    const g = 520;
    const t = clamp(Math.abs(sx - tx) / 360, 0.9, 1.9);
    state.enemyProjs.push({
      type: e.cfg.projType,
      x: sx,
      y: sy,
      vx: (tx - sx) / t,
      vy: (ty - sy - 0.5 * g * t * t) / t,
      gravity: g,
      r: e.cfg.projType === 'arrow' ? 5 : 8,
      damage: e.damage,
    });
  }
}

// ============================================================
// CANVAS RENDERING (MONOCHROME ATMOSPHERIC STREAMLINED STYLE)
// ============================================================
function render() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Full-bleed atmospheric monochrome gradient sky
  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, '#090b0f');
  sky.addColorStop(0.55, '#141922');
  sky.addColorStop(0.78, '#1e2530');
  sky.addColorStop(1, '#0c1016');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh);

  ctx.save();
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  ctx.translate(viewOffsetX + shakeX, viewOffsetY + shakeY);
  ctx.scale(viewScale, viewScale);

  drawBackgroundDecor();
  drawCliffAndTower();
  drawCatapultAndStickman();
  drawShieldDome();
  drawSeaBack();
  drawMines();
  drawSinkingShips();
  drawEnemies();
  drawProjectiles();
  drawRain();
  drawSeaFront();
  drawParticles();
  drawAimTrajectory();
  drawSkillTargetingOverlay();
  drawPopups();

  ctx.restore();
}

function drawBackgroundDecor() {
  const t = state.elapsed;

  // Minimalist geometric moon & halo
  ctx.save();
  const moonX = 980;
  const moonY = 148;
  const glow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 150);
  glow.addColorStop(0, 'rgba(255,255,255,0.22)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Distant sleek mountain silhouettes
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.beginPath();
  ctx.moveTo(-200, SEA_Y);
  ctx.lineTo(140, 410);
  ctx.lineTo(390, 495);
  ctx.lineTo(660, 395);
  ctx.lineTo(940, 480);
  ctx.lineTo(1180, 420);
  ctx.lineTo(1500, SEA_Y);
  ctx.closePath();
  ctx.fill();

  // Subtle drifting mist lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const cx = ((t * (10 + i * 4) + i * 340) % (WORLD_W + 400)) - 200;
    const cy = 110 + i * 52;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 120 + i * 25, cy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCliffAndTower() {
  const x = TOWER_X - TOWER_W * 0.5;
  const w = TOWER_W;
  const topY = TOWER_TOP_Y;
  const h = SEA_Y - topY;
  const tier = state.towerTier;

  // Coastal cliff foundation
  ctx.save();
  ctx.fillStyle = '#0d1015';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-180, WORLD_H + 100);
  ctx.lineTo(-180, SEA_Y - 12);
  ctx.lineTo(x - 10, SEA_Y - 14);
  ctx.lineTo(x + w + 26, SEA_Y - 8);
  ctx.lineTo(x + w + 46, SEA_Y + 24);
  ctx.lineTo(x + w + 60, WORLD_H + 100);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tower body by tier (9 distinct architectural looks)
  const fills = [
    '#2a2520', // 0 木塔
    '#2b3038', // 1 石塔
    '#302e2a', // 2 木板混合石塔
    '#232933', // 3 鐵塔
    '#1c222b', // 4 框架鐵塔
    '#343a42', // 5 水泥塔
    '#2c333d', // 6 鐵架水泥塔
    '#1e252f', // 7 鋼塔
    '#242c36', // 8 鋼筋水泥塔
  ];

  ctx.fillStyle = state.towerFlash > 0 ? 'rgba(255,107,107,0.45)' : fills[tier];
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;

  // Main tower silhouette
  ctx.beginPath();
  if (tier >= 7) {
    // Sleek chamfered steel / fortress bastion
    ctx.moveTo(x - 8, SEA_Y);
    ctx.lineTo(x, topY + 12);
    ctx.lineTo(x + 8, topY);
    ctx.lineTo(x + w - 8, topY);
    ctx.lineTo(x + w, topY + 12);
    ctx.lineTo(x + w + 8, SEA_Y);
  } else {
    ctx.rect(x, topY, w, h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Architectural details per tier
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.3;

  if (tier === 0) {
    // Wooden horizontal planks & cross brace
    for (let y = topY + 22; y < SEA_Y; y += 22) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + 8, topY + 22); ctx.lineTo(x + w - 8, SEA_Y - 20);
    ctx.moveTo(x + w - 8, topY + 22); ctx.lineTo(x + 8, SEA_Y - 20);
    ctx.stroke();
  } else if (tier === 1 || tier === 2) {
    // Stone masonry blocks
    for (let row = 0; row < 9; row++) {
      const y = topY + row * 25;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
      const offset = (row % 2) * 22;
      for (let bx = x + 22 + offset; bx < x + w - 6; bx += 44) {
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + 25); ctx.stroke();
      }
    }
    if (tier === 2) {
      // Timber reinforcement beams
      ctx.strokeStyle = 'rgba(255,255,255,0.58)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 6, topY + 16, w - 12, h - 24);
      ctx.beginPath();
      ctx.moveTo(x + 6, topY + 16); ctx.lineTo(x + w - 6, SEA_Y - 8);
      ctx.stroke();
    }
  } else if (tier === 3 || tier === 4) {
    // Iron plates & rivets / Lattice frame
    for (let y = topY + 38; y < SEA_Y; y += 38) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
      if (tier === 4) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 38); ctx.lineTo(x + w - 4, y);
        ctx.moveTo(x + w - 4, y - 38); ctx.lineTo(x + 4, y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = topY + 12; y < SEA_Y; y += 38) {
      ctx.beginPath(); ctx.arc(x + 8, y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w - 8, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (tier === 5 || tier === 6) {
    // Monolithic concrete + external iron scaffold on tier 6
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let y = topY + 44; y < SEA_Y; y += 44) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    }
    if (tier === 6) {
      ctx.strokeStyle = 'rgba(255,255,255,0.62)';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(x - 6, topY + 8, w + 12, h - 8);
      for (let y = topY + 50; y < SEA_Y; y += 50) {
        ctx.beginPath();
        ctx.moveTo(x - 6, y); ctx.lineTo(x + w + 6, y);
        ctx.moveTo(x - 6, y - 50); ctx.lineTo(x + 12, y);
        ctx.moveTo(x + w + 6, y - 50); ctx.lineTo(x + w - 12, y);
        ctx.stroke();
      }
    }
  } else {
    // Tier 7 Steel & Tier 8 Reinforced Concrete Fortress
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 18, topY); ctx.lineTo(x + 14, SEA_Y);
    ctx.moveTo(x + w - 18, topY); ctx.lineTo(x + w - 14, SEA_Y);
    ctx.stroke();
    if (tier === 8) {
      for (let y = topY + 34; y < SEA_Y; y += 34) {
        ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + w - 14, y); ctx.stroke();
      }
      // Crown battlements
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 10, topY - 7, 16, 7);
      ctx.fillRect(x + w * 0.5 - 8, topY - 7, 16, 7);
      ctx.fillRect(x + w - 26, topY - 7, 16, 7);
    }
  }

  // Top deck platform
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 10, topY - 4, w + 20, 5);
  ctx.restore();
}

function drawCatapultAndStickman() {
  ctx.save();
  const baseX = CATAPULT_X;
  const baseY = TOWER_TOP_Y - 4;

  // Stickman defender standing behind catapult (left side of deck)
  const sx = baseX - 30;
  const sy = baseY;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';

  // Legs
  ctx.beginPath();
  ctx.moveTo(sx, sy - 14); ctx.lineTo(sx - 6, sy);
  ctx.moveTo(sx, sy - 14); ctx.lineTo(sx + 6, sy);
  // Torso
  ctx.moveTo(sx, sy - 14); ctx.lineTo(sx + (state.aiming ? -3 : 0), sy - 30);
  // Arms reaching toward catapult lever
  ctx.moveTo(sx - 1, sy - 26); ctx.lineTo(sx + 14, sy - 20);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(sx + (state.aiming ? -3 : 0), sy - 36, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Catapult A-Frame & Wheels
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(baseX - 10, baseY - 6);
  ctx.lineTo(baseX + 26, baseY - 6);
  ctx.moveTo(baseX + 4, baseY - 6);
  ctx.lineTo(baseX + 14, baseY - 34);
  ctx.lineTo(baseX + 22, baseY - 6);
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#0b0d10';
  [baseX - 4, baseX + 22].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, baseY - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Dynamic Catapult Throwing Arm
  let armAngle = -0.85;
  if (state.aiming) {
    const pull = clamp(Math.hypot(state.aimVx, state.aimVy) / 1150, 0, 1);
    armAngle = -0.85 - pull * 1.35;
  } else if (state.catapultRecoil > 0) {
    armAngle = -0.85 + state.catapultRecoil * 0.95;
  }

  const pivotX = baseX + 10;
  const pivotY = baseY - 12;
  const armLen = 36;
  const tipX = pivotX + Math.cos(armAngle) * armLen;
  const tipY = pivotY + Math.sin(armAngle) * armLen;

  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Cup at tip
  ctx.beginPath();
  ctx.arc(tipX, tipY, 6, armAngle + 0.5, armAngle + Math.PI - 0.5);
  ctx.stroke();

  // Loaded projectile sitting in cup if charged
  const ps = state.projectiles[state.selectedProj];
  if (ps && ps.charges >= 1) {
    ctx.fillStyle = state.selectedProj === 'fire' ? '#ffb142' : '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY - 2, 5.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawShieldDome() {
  if (state.shieldTimer <= 0) return;
  ctx.save();
  const cx = TOWER_X;
  const cy = TOWER_TOP_Y + 95;
  const pulse = 0.85 + Math.sin(state.elapsed * 10) * 0.15;
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * pulse})`;
  ctx.fillStyle = `rgba(255,255,255,${0.09 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 148, -Math.PI * 0.65, Math.PI * 0.5);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function drawSeaBack() {
  const t = state.elapsed;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  ctx.beginPath();
  ctx.moveTo(-200, WORLD_H + 100);
  for (let x = -200; x <= WORLD_W + 200; x += 36) {
    const y = SEA_Y - 4 + Math.sin(x * 0.014 + t * 1.7) * 5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WORLD_W + 200, WORLD_H + 100);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSeaFront() {
  const t = state.elapsed;
  ctx.save();
  const seaGrad = ctx.createLinearGradient(0, SEA_Y, 0, WORLD_H);
  seaGrad.addColorStop(0, 'rgba(16, 22, 30, 0.88)');
  seaGrad.addColorStop(1, '#06080b');
  ctx.fillStyle = seaGrad;
  ctx.beginPath();
  ctx.moveTo(-200, WORLD_H + 120);
  for (let x = -200; x <= WORLD_W + 200; x += 28) {
    const y = SEA_Y + 2 + Math.sin(x * 0.018 - t * 2.4) * 5.5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WORLD_W + 200, WORLD_H + 120);
  ctx.closePath();
  ctx.fill();

  // Crisp white waterline highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = -200; x <= WORLD_W + 200; x += 28) {
    const y = SEA_Y + 2 + Math.sin(x * 0.018 - t * 2.4) * 5.5;
    if (x === -200) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMines() {
  state.mines.forEach((m) => {
    const y = m.y + Math.sin(m.phase) * 3.5;
    ctx.save();
    ctx.translate(m.x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#0b0d10';
    ctx.lineWidth = 2;

    // Spikes
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Blinking indicator dot
    ctx.fillStyle = Math.sin(state.elapsed * 9) > 0 ? '#ff6b6b' : '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPirateStickman(x, y, hasHat = true) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  // Body
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y - 16);
  ctx.moveTo(x, y - 12); ctx.lineTo(x - 8, y - 8);
  ctx.moveTo(x, y - 12); ctx.lineTo(x + 7, y - 7);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(x, y - 21, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Pirate Tricorn Hat
  if (hasHat) {
    ctx.fillStyle = '#0b0d10';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 24);
    ctx.lineTo(x, y - 32);
    ctx.lineTo(x + 9, y - 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawShipVisual(x, y, cfg, type, flash = false, tilt = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(tilt);

  const w = cfg.width;
  const h = cfg.height;

  if (cfg.air) {
    // Pirate Zeppelin / Airship
    ctx.fillStyle = flash ? '#ffffff' : '#161b24';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -14, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Streamline ribs
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -14); ctx.lineTo(w * 0.46, -14);
    ctx.stroke();

    // Gondola
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(-18, 12, 36, 12);
    ctx.strokeRect(-18, 12, 36, 12);
    ctx.beginPath();
    ctx.moveTo(-14, 4); ctx.lineTo(-14, 12);
    ctx.moveTo(14, 4); ctx.lineTo(14, 12);
    ctx.stroke();
  } else {
    // Pirate Stickman Crew on deck
    if (cfg.crew >= 2) {
      drawPirateStickman(-22, -h + 4, true);
      drawPirateStickman(22, -h + 4, true);
    } else {
      drawPirateStickman(0, -h + 4, true);
    }

    // Sail & Mast
    if (type !== 'rammer') {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      const mastH = cfg.boss ? 76 : 48;
      ctx.beginPath();
      ctx.moveTo(12, -h + 2);
      ctx.lineTo(12, -h - mastH);
      ctx.stroke();

      ctx.fillStyle = cfg.boss ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)';
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(12, -h - mastH + 4);
      ctx.quadraticCurveTo(-18, -h - mastH * 0.55, 12, -h - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Ship Hull
    ctx.fillStyle = flash ? '#ffffff' : (cfg.boss ? '#10141c' : '#181e28');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = cfg.boss ? 2.6 : 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h + 4);
    ctx.lineTo(w * 0.5, -h + 4);
    ctx.lineTo(w * 0.36, 4);
    ctx.lineTo(-w * 0.38, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Portholes / Armor Ramming Spike
    if (type === 'rammer') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, -h + 10);
      ctx.lineTo(-w * 0.66, -h * 0.45);
      ctx.lineTo(-w * 0.44, -2);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'cannon' || cfg.boss) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.5 - 8, -h + 10, 12, 5);
    }
  }

  ctx.restore();
}

function drawEnemies() {
  state.enemies.forEach((e) => {
    const bobY = e.cfg.air ? Math.sin(e.bobPhase) * 6 : Math.sin(e.bobPhase) * 3;
    const tilt = e.cfg.air ? 0 : Math.cos(e.bobPhase) * 0.04;
    drawShipVisual(e.x, e.y + bobY, e.cfg, e.type, e.hitFlash > 0, tilt, 1);

    // HP Bar above enemy
    if (e.hp < e.maxHp || e.cfg.boss) {
      const bw = e.cfg.boss ? 92 : 52;
      const bx = e.x - bw * 0.5;
      const by = e.cfg.air ? e.y - e.cfg.height - 16 : e.y - e.cfg.height - 42;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = e.burnTimer > 0 ? '#ffb142' : '#ffffff';
      ctx.fillRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), 5);
    }
  });
}

function drawSinkingShips() {
  state.sinking.forEach((s) => {
    drawShipVisual(s.x, s.y, s.cfg, s.type, false, s.tilt, s.alpha);
  });
}

function drawProjectiles() {
  // Player projectiles
  state.playerProjs.forEach((p) => {
    // Streamlined motion trail
    if (p.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = p.type === 'fire' ? 'rgba(255,177,66,0.55)' : 'rgba(255,255,255,0.38)';
      ctx.lineWidth = p.type === 'fire' ? 4 : 2.2;
      ctx.beginPath();
      p.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.type === 'stone' || p.type === 'triple') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-p.r, -2);
      ctx.lineTo(-3, -p.r);
      ctx.lineTo(p.r, -3);
      ctx.lineTo(4, p.r);
      ctx.lineTo(-p.r * 0.7, p.r * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'bomb') {
      ctx.fillStyle = '#0b0d10';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Sparking fuse
      ctx.fillStyle = '#ffeaa7';
      ctx.beginPath();
      ctx.arc(p.r * 0.75, -p.r * 0.75, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spike') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (p.r + 5), Math.sin(a) * (p.r + 5));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.72, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'fire') {
      ctx.fillStyle = '#ffb142';
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Enemy projectiles
  state.enemyProjs.forEach((ep) => {
    ctx.save();
    ctx.translate(ep.x, ep.y);
    if (ep.type === 'arrow') {
      const ang = Math.atan2(ep.vy, ep.vx);
      ctx.rotate(ang);
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0b0d10';
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, ep.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawRain() {
  state.rainArrows.forEach((r) => {
    ctx.save();
    if (r.type === 'arrow') {
      const ang = Math.atan2(r.vy, r.vx);
      ctx.translate(r.x, r.y);
      ctx.rotate(ang);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffb142';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawParticles() {
  state.particles.forEach((pt) => {
    const a = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (pt.type === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2.5 * a;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawAimTrajectory() {
  if (!state.aiming) return;
  const sx = CATAPULT_X + 12;
  const sy = CATAPULT_Y - 12;

  ctx.save();
  // Pull tension line at pointer
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(state.aimStartX, state.aimStartY);
  ctx.lineTo(state.aimCurrX, state.aimCurrY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dotted parabolic trajectory preview
  for (let step = 1; step <= 26; step++) {
    const t = step * 0.055;
    const px = sx + state.aimVx * t;
    const py = sy + state.aimVy * t + 0.5 * GRAVITY * t * t;
    if (py > SEA_Y + 6 || px > WORLD_W + 20) break;
    const alpha = Math.max(0.12, 1 - step / 28);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1.8, 4.2 - step * 0.09), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSkillTargetingOverlay() {
  const sid = state.activeTargetSkill || state.draggingSkill;
  if (!sid) return;
  const def = SKILL_DEFS.find((d) => d.id === sid);
  if (!def || !def.targeted) return;

  const tx = clamp(state.pointerWorldX, TOWER_X + 90, WORLD_W - 40);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([7, 6]);

  if (def.targetType === 'sea') {
    ctx.beginPath();
    ctx.arc(tx, SEA_Y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const span = sid === 'arrows' ? 280 : 240;
    ctx.fillRect(tx - span * 0.5, 40, span, SEA_Y - 40);
    ctx.strokeRect(tx - span * 0.5, 40, span, SEA_Y - 40);
  }
  ctx.restore();
}

function drawPopups() {
  ctx.save();
  ctx.textAlign = 'center';
  state.popups.forEach((pp) => {
    const a = clamp(pp.life / pp.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = `700 ${pp.size}px Inter, "Noto Sans TC", sans-serif`;
    ctx.fillStyle = pp.color;
    ctx.fillText(pp.text, pp.x, pp.y);
  });
  ctx.restore();
}

// ============================================================
// INPUT HANDLING (SLINGSHOT DRAG + QUICK TAP + SKILL TARGETING)
// ============================================================
canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 2) {
    cancelSkillTargeting();
    return;
  }
  sound.init();
  if (state.shopOpen || state.paused || state.gameOver) return;

  const wp = screenToWorld(e.clientX, e.clientY);
  state.pointerWorldX = wp.x;
  state.pointerWorldY = wp.y;

  // If currently targeting a skill via click-to-cast
  if (state.activeTargetSkill) {
    castSkill(state.activeTargetSkill, wp.x, wp.y);
    return;
  }

  state.aiming = true;
  state.aimStartX = wp.x;
  state.aimStartY = wp.y;
  state.aimCurrX = wp.x;
  state.aimCurrY = wp.y;
  const quick = solveQuickBallistic(wp.x, wp.y);
  state.aimVx = quick.vx;
  state.aimVy = quick.vy;
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
    const quick = solveQuickBallistic(wp.x, wp.y);
    state.aimVx = quick.vx;
    state.aimVy = quick.vy;
  } else {
    const power = clamp(dist * 4.2, 220, 1180);
    const ang = Math.atan2(dy, dx);
    state.aimVx = clamp(Math.cos(ang) * power, 120, 1120);
    state.aimVy = clamp(Math.sin(ang) * power, -980, -60);
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!state.aiming) return;
  state.aiming = false;
  fireProjectile(state.aimVx, state.aimVy);
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  cancelSkillTargeting();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.shopOpen) closeShop();
    else if (state.activeTargetSkill) cancelSkillTargeting();
    else if (state.paused) togglePause();
    return;
  }
  if (state.gameOver) return;
  const k = e.key.toLowerCase();
  if (k === 's') {
    state.shopOpen ? closeShop() : openShop();
  } else if (k === 'p') {
    if (!state.shopOpen) togglePause();
  } else if (k === 'm') {
    toggleSound();
  } else if (['1', '2', '3', '4', '5'].includes(k)) {
    const def = PROJECTILE_DEFS[Number(k) - 1];
    if (def && state.projectiles[def.id].unlocked) {
      state.selectedProj = def.id;
      updateDockDisplays();
    }
  }
});

// UI Button Bindings
function togglePause() {
  if (state.shopOpen || state.gameOver) return;
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
dom.shopModal.addEventListener('click', (e) => {
  if (e.target === dom.shopModal) closeShop();
});
document.querySelectorAll('.shop-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    shopTab = tabBtn.dataset.tab;
    document.querySelectorAll('.shop-tab').forEach((t) => t.classList.toggle('active', t === tabBtn));
    renderShopBody();
  });
});

dom.pauseBtn.addEventListener('click', togglePause);
dom.resumeBtn.addEventListener('click', togglePause);
dom.pauseRestartBtn.addEventListener('click', restartGame);
dom.restartBtn.addEventListener('click', restartGame);
dom.soundBtn.addEventListener('click', toggleSound);
dom.cancelTargetBtn.addEventListener('click', cancelSkillTargeting);

// ============================================================
// BOOTSTRAP & ANIMATION LOOP
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
