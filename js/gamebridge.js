// js/gamebridge.js — Shared state bridge between Three.js ES module and React UI.
// Loaded as a plain <script> so it runs synchronously before any other code.

window.GameBridge = (function () {
  const _listeners = {};

  const state = {
    started: false,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    hunger: 60,
    thirst: 100,
    dayCount: 1,
    isNight: false,
    isBloodMoon: false,
    timeFrac: 0,
    posX: 0,
    posY: 64,
    posZ: 0,
    mobCount: 0,
    hordeActive: false,
    // Inventory / progression — mirrored from the authoritative game-side model.
    inv: [],
    selIdx: 0,
    xp: 0,
    level: 1,
    levelXp: 0,
    nextLevelXp: 0,
    itemMeta: {},
    recipeMeta: [],
    perks: { miningSpeed: 1, meleeDmg: 1 },
    stats: { kills: 0, blocksMined: 0, blocksPlaced: 0, deaths: 0 },
    deathCause: 'walker',
    lootOpen: null,   // { id, slots } when a loot container is open
  };

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }

  function off(event, fn) {
    if (_listeners[event])
      _listeners[event] = _listeners[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    (_listeners[event] || []).forEach(fn => fn(data));
  }

  function setState(patch) {
    Object.assign(state, patch);
    emit('state', Object.assign({}, state));
  }

  return { state, on, off, emit, setState };
})();
