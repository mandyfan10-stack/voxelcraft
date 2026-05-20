// hud.jsx — In-game heads-up display + minimap. Corner-based layout.

function HUD({
  onOpenInventory,
  onOpenSettings,
  onDie,
  showMinimap,
  hordeAlert
}) {
  const [hp, setHp] = React.useState(100);
  const [stamina, setStamina] = React.useState(100);
  const [hunger, setHunger] = React.useState(100);
  const [selectedSlot, setSelectedSlot] = React.useState(0);
  const [compassDeg, setCompassDeg] = React.useState(0);
  const [posX, setPosX] = React.useState(0);
  const [posY, setPosY] = React.useState(64);
  const [posZ, setPosZ] = React.useState(0);
  const [dayCount, setDayCount] = React.useState(1);
  const [isNight, setIsNight] = React.useState(false);
  const [timeFrac, setTimeFrac] = React.useState(0);
  const [mobBlips, setMobBlips] = React.useState([]);
  const [inv, setInv] = React.useState([]);
  const [itemMeta, setItemMeta] = React.useState({});
  const [maxHp, setMaxHp] = React.useState(100);
  const [thirst, setThirst] = React.useState(100);
  const [level, setLevel] = React.useState(1);
  const [xp, setXp] = React.useState(0);
  const [levelXp, setLevelXp] = React.useState(0);
  const [nextLevelXp, setNextLevelXp] = React.useState(0);
  const [isBloodMoon, setIsBloodMoon] = React.useState(false);
  const [mineProgress, setMineProgress] = React.useState(0);

  // Visual effects state
  const [damageFlash, setDamageFlash] = React.useState(0); // 0-1 intensity
  const [hitLabel, setHitLabel] = React.useState(null); // {dmg, fatal, key}
  const [pointerLocked, setPointerLocked] = React.useState(false);
  const prevHpRef = React.useRef(100);

  // Track pointer lock for crosshair — single listener
  React.useEffect(() => {
    const check = () => setPointerLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', check);
    check(); // sync initial state
    return () => document.removeEventListener('pointerlockchange', check);
  }, []);

  // Sync ALL real game state from bridge
  React.useEffect(() => {
    const handler = s => {
      const newHp = s.hp ?? 100;
      if (newHp < prevHpRef.current) {
        // Damage taken — flash
        const intensity = Math.min(1, (prevHpRef.current - newHp) / 30);
        setDamageFlash(intensity);
        setTimeout(() => setDamageFlash(0), 350);
      }
      prevHpRef.current = newHp;
      setHp(newHp);
      setStamina(s.stamina ?? 100);
      setHunger(s.hunger ?? 100);
      setPosX(s.posX ?? 0);
      setPosY(s.posY ?? 0);
      setPosZ(s.posZ ?? 0);
      setDayCount(s.dayCount ?? 1);
      setIsNight(!!s.isNight);
      setTimeFrac(s.timeFrac ?? 0);
      setMobBlips(s.mobBlips ?? []);
      setInv(s.inv ?? []);
      setItemMeta(s.itemMeta ?? {});
      setMaxHp(s.maxHp ?? 100);
      setThirst(s.thirst ?? 100);
      setLevel(s.level ?? 1);
      setXp(s.xp ?? 0);
      setLevelXp(s.levelXp ?? 0);
      setNextLevelXp(s.nextLevelXp ?? 0);
      setIsBloodMoon(!!s.isBloodMoon);
      setMineProgress(s.mineProgress ?? 0);
      if (s.selIdx !== undefined) setSelectedSlot(s.selIdx);
    };
    window.GameBridge.on('state', handler);
    return () => window.GameBridge.off('state', handler);
  }, []);

  // Hit / kill events
  React.useEffect(() => {
    const onHit = ({
      dmg,
      fatal
    }) => {
      setHitLabel({
        dmg,
        fatal,
        key: Date.now()
      });
      setTimeout(() => setHitLabel(null), fatal ? 700 : 400);
    };
    window.GameBridge.on('hit', onHit);
    return () => window.GameBridge.off('hit', onHit);
  }, []);

  // Compass wander (subtle — real yaw not on bridge yet)
  React.useEffect(() => {
    const i = setInterval(() => {
      setCompassDeg(d => (d + (Math.random() - 0.5) * 3 + 360) % 360);
    }, 600);
    return () => clearInterval(i);
  }, []);

  // Resolve a hotbar slot to display data via the item registry snapshot.
  function slotItem(i) {
    const s = inv[i];
    if (!s) return null;
    const m = itemMeta[s.id] || {};
    return {
      id: s.id,
      count: s.count,
      durability: s.durability,
      kind: m.kind || 'dirt',
      name: m.name || s.id,
      maxDura: m.durability || 0
    };
  }
  function handleSlotClick(i) {
    setSelectedSlot(i);
    window.GameBridge.emit('selectSlot', i);
  }
  const selHotbar = slotItem(selectedSlot);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "02 HUD",
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 24,
      top: 24,
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minWidth: 280
    }
  }, /*#__PURE__*/React.createElement(VitalsRow, {
    label: "HP",
    value: Math.round(hp),
    max: maxHp,
    kind: ""
  }), /*#__PURE__*/React.createElement(VitalsRow, {
    label: "STA",
    value: Math.round(stamina),
    max: 100,
    kind: "stamina"
  }), /*#__PURE__*/React.createElement(VitalsRow, {
    label: "HGR",
    value: Math.round(hunger),
    max: 100,
    kind: "hunger"
  }), /*#__PURE__*/React.createElement(VitalsRow, {
    label: "THR",
    value: Math.round(thirst),
    max: 100,
    kind: "thirst"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.12em",
      marginTop: 4,
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", null, "X", /*#__PURE__*/React.createElement("span", {
    className: "cyan",
    style: {
      marginLeft: 6
    }
  }, posX)), /*#__PURE__*/React.createElement("span", null, "Y", /*#__PURE__*/React.createElement("span", {
    className: "cyan",
    style: {
      marginLeft: 6
    }
  }, posY)), /*#__PURE__*/React.createElement("span", null, "Z", /*#__PURE__*/React.createElement("span", {
    className: "cyan",
    style: {
      marginLeft: 6
    }
  }, posZ))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.14em",
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", null, "LVL ", /*#__PURE__*/React.createElement("span", {
    className: "cyan",
    style: {
      fontSize: 12
    }
  }, level)), /*#__PURE__*/React.createElement("span", null, Math.max(0, xp - levelXp), " / ", Math.max(1, nextLevelXp - levelXp), " XP")), /*#__PURE__*/React.createElement("div", {
    className: "bar xp",
    style: {
      height: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fill",
    style: {
      width: Math.max(0, Math.min(100, (xp - levelXp) / Math.max(1, nextLevelXp - levelXp) * 100)) + "%"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 24,
      top: 24,
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(DayNightWidget, {
    dayCount: dayCount,
    isNight: isNight,
    timeFrac: timeFrac
  }), showMinimap && /*#__PURE__*/React.createElement(Minimap, {
    compassDeg: compassDeg,
    mobBlips: mobBlips
  })), hordeAlert && /*#__PURE__*/React.createElement(HordeAlert, {
    bloodMoon: isBloodMoon,
    count: mobBlips.length
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      bottom: 28,
      transform: "translateX(-50%)",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em"
    }
  }, "\u2591 SLOT ", selectedSlot + 1, " \u2591 ", selHotbar ? selHotbar.name.toUpperCase() : "EMPTY", selHotbar && selHotbar.count > 1 ? " ×" + selHotbar.count : "", " \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: 6,
      background: "rgba(10,9,8,0.85)",
      border: "1px solid var(--steel-2)",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.06), 0 4px 16px rgba(0,0,0,0.7)"
    }
  }, Array.from({
    length: 8
  }).map((_, i) => {
    const it = slotItem(i);
    const duraFrac = it && it.maxDura > 0 && it.durability !== undefined ? Math.max(0, Math.min(1, it.durability / it.maxDura)) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => handleSlotClick(i),
      style: {
        width: 60,
        height: 60,
        background: "rgba(20,17,13,0.9)",
        border: i === selectedSlot ? "2px solid var(--cyan)" : "1px solid var(--steel-2)",
        boxShadow: i === selectedSlot ? "inset 0 0 0 1px rgba(0,255,255,0.3), 0 0 16px rgba(0,255,255, calc(0.5 * var(--cyanlevel)))" : "inset 0 1px 0 rgba(216,210,196,0.05)",
        position: "relative",
        cursor: "crosshair",
        padding: 0
      }
    }, it && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement(VoxelBlock, {
      kind: it.kind,
      size: 42
    })), it && it.count > 1 && /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        position: "absolute",
        right: 3,
        bottom: 1,
        fontSize: 10,
        color: "var(--bone)",
        textShadow: "1px 1px 0 #000, -1px -1px 0 #000"
      }
    }, it.count), duraFrac !== null && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 4,
        right: 4,
        bottom: 3,
        height: 3,
        background: "#0a0908",
        border: "1px solid var(--steel-2)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: duraFrac * 100 + "%",
        background: duraFrac < 0.25 ? "var(--blood)" : duraFrac < 0.5 ? "#cc8800" : "var(--olive)"
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "mono dim",
      style: {
        position: "absolute",
        left: 3,
        top: 1,
        fontSize: 9,
        color: i === selectedSlot ? "var(--cyan)" : "var(--bone-dim)"
      }
    }, i + 1));
  }))), !window.IS_TOUCH && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 24,
      bottom: 28,
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.1em"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "LMB"), " MINE   ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "RMB"), " PLACE   ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "SHIFT"), " SPRINT"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.1em"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "I"), " INVENTORY   ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "ESC"), " PAUSE")), window.IS_TOUCH && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Joystick, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 24,
      bottom: 100,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      alignItems: "center",
      pointerEvents: "auto",
      zIndex: 600
    }
  }, /*#__PURE__*/React.createElement(ActionButton, {
    label: "MINE",
    kind: "mine",
    hold: true,
    big: true,
    color: "var(--blood-deep)",
    onTick: null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(ActionButton, {
    label: "PLACE",
    hold: false,
    onTick: () => {
      window.MobileInput.placeTick++;
    },
    color: "var(--olive)"
  }), /*#__PURE__*/React.createElement(ActionButton, {
    label: "E",
    hold: false,
    onTick: () => {
      window.MobileInput.interactTick++;
    },
    color: "var(--cyan-dim)"
  })), /*#__PURE__*/React.createElement(ActionButton, {
    label: "JUMP",
    kind: "jump",
    hold: true,
    color: "var(--rust)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 24,
      bottom: 28,
      pointerEvents: "auto",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono cyan",
    style: {
      fontSize: 22,
      letterSpacing: "0.15em",
      fontWeight: 600
    }
  }, fracToTime(timeFrac)), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em",
      marginTop: 2
    }
  }, "\u2591 ", timeFracToPhase(timeFrac), " \u2591 ", mobBlips.length, " HOSTILE", mobBlips.length !== 1 ? "S" : "", " \u2591")), (pointerLocked || window.IS_TOUCH) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: -10,
      top: -1,
      width: 7,
      height: 2,
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 0 3px rgba(0,0,0,0.8)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: -10,
      top: -1,
      width: 7,
      height: 2,
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 0 3px rgba(0,0,0,0.8)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: -1,
      top: -10,
      width: 2,
      height: 7,
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 0 3px rgba(0,0,0,0.8)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: -1,
      bottom: -10,
      width: 2,
      height: 7,
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 0 3px rgba(0,0,0,0.8)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: -1.5,
      top: -1.5,
      width: 3,
      height: 3,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.95)"
    }
  }), mineProgress > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: -42,
      top: 16,
      width: 84,
      height: 5,
      background: "rgba(0,0,0,0.65)",
      border: "1px solid var(--steel-2)",
      boxShadow: "0 0 6px rgba(0,0,0,0.7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(100, mineProgress * 100) + "%",
      background: "linear-gradient(90deg, var(--olive) 0%, var(--cyan) 100%)",
      boxShadow: "0 0 6px rgba(0,255,255,0.4)"
    }
  }))), damageFlash > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, rgba(180,0,0,${damageFlash * 0.55}) 0%, rgba(120,0,0,${damageFlash * 0.8}) 100%)`,
      zIndex: 800
    }
  }), hp < 40 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 38%, rgba(140,0,0,0.45) 72%, rgba(180,0,0,0.75) 100%)",
      animation: "vignettePulse 1.2s ease-in-out infinite",
      zIndex: 799,
      opacity: 0.4 + (1 - hp / 40) * 0.6
    }
  }), hitLabel && /*#__PURE__*/React.createElement("div", {
    key: hitLabel.key,
    style: {
      position: "absolute",
      left: "50%",
      top: "42%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      fontFamily: "var(--display)",
      fontWeight: 900,
      fontSize: hitLabel.fatal ? 32 : 22,
      letterSpacing: "0.08em",
      color: hitLabel.fatal ? "var(--blood)" : "#ffcc44",
      textShadow: hitLabel.fatal ? "0 0 20px rgba(204,34,0,0.9), 2px 0 0 rgba(0,0,0,0.8)" : "0 0 12px rgba(255,180,0,0.7), 1px 1px 0 rgba(0,0,0,0.9)",
      animation: "fadeUpOut 0.5s ease-out forwards",
      zIndex: 810
    }
  }, hitLabel.fatal ? "☠ KILL" : `-${hitLabel.dmg}`), hunger <= 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "35%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
      fontFamily: "var(--mono)",
      fontSize: 12,
      letterSpacing: "0.25em",
      color: "#cc6600",
      textShadow: "0 0 8px rgba(204,100,0,0.7)",
      animation: "flicker 1s infinite",
      zIndex: 805
    }
  }, "\u2591 STARVATION DAMAGE \u2591"));
}
function VitalsRow({
  label,
  value,
  max,
  kind
}) {
  const pct = value / max * 100;
  const low = pct < 30;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "44px 1fr 56px",
      gap: 10,
      alignItems: "center",
      background: "rgba(10,9,8,0.78)",
      border: "1px solid var(--steel-2)",
      padding: "8px 12px",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.05)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.15em",
      fontWeight: 600,
      color: low ? "var(--blood)" : "var(--bone-dim)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "bar " + kind
  }, /*#__PURE__*/React.createElement("div", {
    className: "fill",
    style: {
      width: pct + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      textAlign: "right",
      color: low ? "var(--blood)" : "var(--bone)",
      textShadow: low ? "0 0 6px rgba(204,34,0,0.6)" : "none",
      fontVariantNumeric: "tabular-nums"
    }
  }, value, "/", max));
}

// Convert 0-1 time fraction to "HH:MM" (day=06:00..18:00, night=18:00..06:00)
function fracToTime(frac) {
  const totalMin = Math.floor(frac * 24 * 60);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function timeFracToPhase(frac) {
  if (frac < 0.25) return 'DAWN';
  if (frac < 0.45) return 'DAY';
  if (frac < 0.55) return 'DUSK';
  if (frac < 0.85) return 'NIGHT';
  return 'PRE-DAWN';
}
function DayNightWidget({
  dayCount = 1,
  isNight = false,
  timeFrac = 0
}) {
  const cycleDay = (dayCount - 1) % 7 + 1; // position in 7-day cycle
  const isBloodMoon = cycleDay === 7 && isNight;
  const label = isBloodMoon ? 'BLOOD MOON' : isNight ? 'NIGHT' : 'DAY';
  const labelColor = isBloodMoon ? 'var(--blood)' : isNight ? '#6677cc' : 'var(--bone)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(10,9,8,0.78)",
      border: "1px solid var(--steel-2)",
      padding: "10px 14px",
      minWidth: 220,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em",
      marginBottom: 2
    }
  }, "\u2591 DAY ", dayCount, " / CYCLE ", cycleDay, "/7 \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "display",
    style: {
      fontSize: isBloodMoon ? 28 : 22,
      color: labelColor,
      textShadow: isBloodMoon ? "0 0 12px rgba(204,34,0,0.6)" : isNight ? "0 0 8px rgba(100,120,204,0.5)" : "none",
      letterSpacing: "0.06em",
      fontWeight: 700,
      animation: isBloodMoon ? "flicker 1.5s infinite" : "none"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      marginTop: 8,
      justifyContent: "flex-end"
    }
  }, [1, 2, 3, 4, 5, 6, 7].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      width: 26,
      height: 6,
      background: n < cycleDay ? "var(--rust)" : n === cycleDay ? isBloodMoon ? "var(--blood)" : "var(--olive)" : "var(--steel-2)",
      border: "1px solid #0a0908",
      opacity: n < cycleDay ? 0.85 : n === cycleDay ? 1 : 0.4,
      ...(n === cycleDay && isBloodMoon ? {
        animation: "flicker 1.5s infinite"
      } : {})
    }
  }))));
}
function Minimap({
  compassDeg,
  mobBlips = []
}) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 700);
    return () => clearInterval(i);
  }, []);
  const blocks = [];
  const RAD_R = 95;
  // mobBlips angles are already player-relative (0 = forward = top of radar)
  const mobDotPos = (angle, dist) => {
    const a = angle * Math.PI / 180;
    return {
      left: 100 + Math.sin(a) * dist * RAD_R,
      top: 100 - Math.cos(a) * dist * RAD_R
    };
  };
  // compass strip uses compassDeg for the heading display only
  const r = RAD_R;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      height: 230,
      background: "rgba(10,9,8,0.85)",
      border: "1px solid var(--steel-2)",
      padding: 10,
      position: "relative",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.06), 0 4px 16px rgba(0,0,0,0.7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 18,
      overflow: "hidden",
      marginBottom: 6,
      borderBottom: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement(CompassStrip, {
    deg: compassDeg
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: 0,
      width: 1,
      height: "100%",
      background: "var(--cyan)",
      boxShadow: "0 0 6px rgba(0,255,255,0.8)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 200,
      height: 200,
      margin: "0 auto",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(74,107,42,0.12) 0%, rgba(10,9,8,0.95) 70%)",
      border: "1px solid var(--steel-2)",
      overflow: "hidden"
    }
  }, [0.33, 0.66, 1].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: "absolute",
      left: 100 - r * 95,
      top: 100 - r * 95,
      width: r * 190,
      height: r * 190,
      borderRadius: "50%",
      border: "1px dashed rgba(74,107,42,0.3)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: 0,
      width: 1,
      height: "100%",
      background: "rgba(74,107,42,0.2)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: 0,
      height: 1,
      width: "100%",
      background: "rgba(74,107,42,0.2)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 95,
      height: 2,
      background: "linear-gradient(90deg, rgba(0,255,255,0.6), transparent)",
      transformOrigin: "left center",
      transform: `rotate(${tick * 80}deg)`,
      transition: "transform 0.7s linear",
      boxShadow: "0 0 8px rgba(0,255,255,0.5)"
    }
  }), mobBlips.map((m, i) => {
    const p = mobDotPos(m.angle, m.dist);
    return /*#__PURE__*/React.createElement("div", {
      key: "m" + i,
      style: {
        position: "absolute",
        left: p.left - 4,
        top: p.top - 4,
        width: 8,
        height: 8,
        background: "var(--blood)",
        boxShadow: "0 0 8px rgba(204,34,0,0.9)",
        animation: "flicker 0.8s infinite",
        fontFamily: "var(--mono)",
        fontSize: 7,
        color: "#000",
        textAlign: "center",
        lineHeight: "8px",
        fontWeight: 700
      }
    }, m.kind);
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 100 - 4,
      top: 100 - 4,
      width: 8,
      height: 8,
      background: "var(--bone)",
      boxShadow: "0 0 8px rgba(216,210,196,0.9)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 100 - 1,
      top: 100 - 18,
      width: 2,
      height: 14,
      background: "var(--bone)",
      boxShadow: "0 0 6px rgba(216,210,196,0.7)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 9,
      letterSpacing: "0.18em",
      marginTop: 6,
      textAlign: "center"
    }
  }, "\u2591 RADAR / 64m / ", mobBlips.length, " HOSTILE", mobBlips.length !== 1 ? "S" : "", " \u2591"));
}
function CompassStrip({
  deg
}) {
  const marks = [];
  const dirs = {
    0: "N",
    45: "NE",
    90: "E",
    135: "SE",
    180: "S",
    225: "SW",
    270: "W",
    315: "NW"
  };
  for (let d = 0; d < 360; d += 15) {
    const offset = (d - deg + 540) % 360 - 180; // -180..180
    const isMain = d % 45 === 0;
    marks.push({
      d,
      offset,
      label: dirs[d],
      isMain
    });
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, marks.map(m => Math.abs(m.offset) < 80 ? /*#__PURE__*/React.createElement("div", {
    key: m.d,
    style: {
      position: "absolute",
      left: `calc(50% + ${m.offset * 1.5}px)`,
      top: 0,
      transform: "translateX(-50%)",
      color: m.isMain ? "var(--bone)" : "var(--bone-dim)",
      fontFamily: "var(--mono)",
      fontSize: m.isMain ? 11 : 9,
      fontWeight: m.isMain ? 700 : 400,
      letterSpacing: "0.08em",
      opacity: 1 - Math.abs(m.offset) / 100
    }
  }, m.isMain ? m.label : "·") : null));
}
function HordeAlert({
  bloodMoon,
  count
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: 24,
      transform: "translateX(-50%)",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display flicker",
    style: {
      fontSize: bloodMoon ? 40 : 30,
      color: bloodMoon ? "var(--blood)" : "#cc7744",
      letterSpacing: "0.2em",
      textShadow: "0 0 24px rgba(204,34,0,0.9), 2px 0 0 rgba(0,255,255,0.3)",
      fontWeight: 900
    }
  }, bloodMoon ? "☠ BLOOD MOON HORDE" : "⚠ HOSTILES NEARBY"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      letterSpacing: "0.25em",
      color: "var(--bone-dim)"
    }
  }, "\u2591 ", count, " HOSTILE", count !== 1 ? "S" : "", " TRACKED \u2591 ", bloodMoon ? "SURVIVE UNTIL DAWN" : "STAY ALERT", " \u2591"), bloodMoon && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: "flex",
      gap: 18,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(CreatureSilhouette, {
    kind: "walker",
    size: 56,
    className: "pulse"
  }), /*#__PURE__*/React.createElement(CreatureSilhouette, {
    kind: "brute",
    size: 56,
    className: "pulse"
  }), /*#__PURE__*/React.createElement(CreatureSilhouette, {
    kind: "runner",
    size: 56,
    className: "pulse"
  })));
}
window.HUD = HUD;