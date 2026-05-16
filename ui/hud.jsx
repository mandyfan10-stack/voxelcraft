// hud.jsx — In-game heads-up display + minimap. Corner-based layout.

function HUD({ onOpenInventory, onOpenSettings, onDie, showMinimap, hordeAlert }) {
  const [hp, setHp] = React.useState(100);
  const [stamina, setStamina] = React.useState(46);
  const [hunger, setHunger] = React.useState(58);
  const [selectedSlot, setSelectedSlot] = React.useState(2);
  const [compassDeg, setCompassDeg] = React.useState(127);
  const [posX, setPosX] = React.useState(0);
  const [posY, setPosY] = React.useState(64);
  const [posZ, setPosZ] = React.useState(0);

  // Sync real game state from bridge
  React.useEffect(() => {
    const handler = (s) => {
      setHp(s.hp);
      setPosX(s.posX);
      setPosY(s.posY);
      setPosZ(s.posZ);
    };
    window.GameBridge.on('state', handler);
    return () => window.GameBridge.off('state', handler);
  }, []);

  // Simulated stamina drift + compass wander
  React.useEffect(() => {
    const i = setInterval(() => {
      setStamina(s => Math.max(20, Math.min(100, s + (Math.random() - 0.45) * 8)));
      setCompassDeg(d => (d + (Math.random() - 0.5) * 6 + 360) % 360);
    }, 900);
    return () => clearInterval(i);
  }, []);

  const hotbar = [
    { kind: "dirt", count: 64 },
    { kind: "stone", count: 32 },
    { kind: "wood", count: 18 },
    { kind: "metal", count: 8 },
    { kind: "leaves", count: 24 },
    { kind: "bone", count: 4 },
    { kind: "glass", count: 12 },
    { kind: "flesh", count: 2 },
  ];

  return (
    <div data-screen-label="02 HUD" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* ── Top-left: vitals stack ───────────────────────────────── */}
      <div style={{
        position: "absolute", left: 24, top: 24,
        pointerEvents: "auto",
        display: "flex", flexDirection: "column", gap: 8,
        minWidth: 280,
      }}>
        <VitalsRow label="HP"  value={Math.round(hp)}      max={100} kind="" />
        <VitalsRow label="STA" value={Math.round(stamina)} max={100} kind="stamina" />
        <VitalsRow label="HGR" value={Math.round(hunger)}  max={100} kind="hunger" />

        {/* coords */}
        <div className="mono dim" style={{
          fontSize: 11, letterSpacing: "0.12em", marginTop: 4,
          display: "flex", gap: 16,
        }}>
          <span>X<span className="cyan" style={{ marginLeft: 6 }}>{posX}</span></span>
          <span>Y<span className="cyan" style={{ marginLeft: 6 }}>{posY}</span></span>
          <span>Z<span className="cyan" style={{ marginLeft: 6 }}>{posZ}</span></span>
        </div>
      </div>

      {/* ── Top-right: day/night + minimap ───────────────────────── */}
      <div style={{
        position: "absolute", right: 24, top: 24,
        pointerEvents: "auto",
        display: "flex", flexDirection: "column", gap: 10,
        alignItems: "flex-end",
      }}>
        <DayNightWidget />
        {showMinimap && <Minimap compassDeg={compassDeg} />}
      </div>

      {/* ── Horde alert (center-top, only when triggered) ────────── */}
      {hordeAlert && <HordeAlert />}

      {/* ── Bottom-center: hotbar ────────────────────────────────── */}
      <div style={{
        position: "absolute", left: "50%", bottom: 28,
        transform: "translateX(-50%)",
        pointerEvents: "auto",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      }}>
        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em" }}>
          ░ SLOT {selectedSlot + 1} ░ {hotbar[selectedSlot].kind.toUpperCase()} ░ ×{hotbar[selectedSlot].count}
        </div>
        <div style={{
          display: "flex", gap: 4,
          padding: 6,
          background: "rgba(10,9,8,0.85)",
          border: "1px solid var(--steel-2)",
          boxShadow: "inset 0 1px 0 rgba(216,210,196,0.06), 0 4px 16px rgba(0,0,0,0.7)",
        }}>
          {hotbar.map((slot, i) => (
            <button
              key={i}
              onClick={() => setSelectedSlot(i)}
              style={{
                width: 60, height: 60,
                background: "rgba(20,17,13,0.9)",
                border: i === selectedSlot ? "2px solid var(--cyan)" : "1px solid var(--steel-2)",
                boxShadow: i === selectedSlot
                  ? "inset 0 0 0 1px rgba(0,255,255,0.3), 0 0 16px rgba(0,255,255, calc(0.5 * var(--cyanlevel)))"
                  : "inset 0 1px 0 rgba(216,210,196,0.05)",
                position: "relative",
                cursor: "crosshair",
                padding: 0,
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VoxelBlock kind={slot.kind} size={42} />
              </div>
              <div className="mono" style={{
                position: "absolute", right: 3, bottom: 1,
                fontSize: 10, color: "var(--bone)",
                textShadow: "1px 1px 0 #000, -1px -1px 0 #000",
              }}>
                {slot.count}
              </div>
              <div className="mono dim" style={{
                position: "absolute", left: 3, top: 1,
                fontSize: 9, color: i === selectedSlot ? "var(--cyan)" : "var(--bone-dim)",
              }}>
                {i + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom-left: action prompts ──────────────────────────── */}
      <div style={{
        position: "absolute", left: 24, bottom: 28,
        pointerEvents: "auto",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
          <span className="kbd">LMB</span> MINE   <span className="kbd">RMB</span> PLACE   <span className="kbd">SHIFT</span> SPRINT
        </div>
        <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
          <span className="kbd">I</span> INVENTORY   <span className="kbd">ESC</span> PAUSE
        </div>
      </div>

      {/* ── Bottom-right: clock / direction indicator ────────────── */}
      <div style={{
        position: "absolute", right: 24, bottom: 28,
        pointerEvents: "auto",
        textAlign: "right",
      }}>
        <div className="mono cyan" style={{ fontSize: 22, letterSpacing: "0.15em", fontWeight: 600 }}>
          21:43
        </div>
        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", marginTop: 2 }}>
          ░ DUSK ░ -2°C ░ FOG INCOMING
        </div>
      </div>
    </div>
  );
}

function VitalsRow({ label, value, max, kind }) {
  const pct = (value / max) * 100;
  const low = pct < 30;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "44px 1fr 56px",
      gap: 10, alignItems: "center",
      background: "rgba(10,9,8,0.78)",
      border: "1px solid var(--steel-2)",
      padding: "8px 12px",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.05)",
    }}>
      <span className="mono dim" style={{
        fontSize: 11, letterSpacing: "0.15em", fontWeight: 600,
        color: low ? "var(--blood)" : "var(--bone-dim)",
      }}>
        {label}
      </span>
      <div className={"bar " + kind}>
        <div className="fill" style={{ width: pct + "%" }} />
      </div>
      <span className="mono" style={{
        fontSize: 12, textAlign: "right",
        color: low ? "var(--blood)" : "var(--bone)",
        textShadow: low ? "0 0 6px rgba(204,34,0,0.6)" : "none",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}/{max}
      </span>
    </div>
  );
}

function DayNightWidget() {
  return (
    <div style={{
      background: "rgba(10,9,8,0.78)",
      border: "1px solid var(--steel-2)",
      padding: "10px 14px",
      minWidth: 220,
      textAlign: "right",
    }}>
      <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", marginBottom: 2 }}>
        ░ DAY 06 / 07 ░
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        <span className="display" style={{
          fontSize: 28, color: "var(--blood)",
          textShadow: "0 0 12px rgba(204,34,0,0.6)",
          letterSpacing: "0.06em",
          fontWeight: 700,
        }}>
          BLOOD MOON
        </span>
      </div>
      {/* day progress bar — 7 ticks */}
      <div style={{ display: "flex", gap: 3, marginTop: 8, justifyContent: "flex-end" }}>
        {[1,2,3,4,5,6,7].map(n => (
          <div key={n} style={{
            width: 26, height: 6,
            background: n <= 6 ? (n === 7 ? "var(--blood)" : "var(--rust)") : "var(--steel-2)",
            border: "1px solid #0a0908",
            opacity: n === 7 ? 1 : (n <= 6 ? 0.85 : 0.4),
            ...(n === 7 ? { animation: "flicker 1.5s infinite", background: "var(--blood)" } : {}),
          }} />
        ))}
      </div>
    </div>
  );
}

function Minimap({ compassDeg }) {
  // Generate a static-ish set of dots; mob dots drift slightly
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 700);
    return () => clearInterval(i);
  }, []);

  const mobs = [
    { angle: 35,  dist: 0.65, kind: "T" }, // Troll
    { angle: 110, dist: 0.45, kind: "B" }, // Brute
    { angle: 200, dist: 0.85, kind: "H" }, // Husk
    { angle: 285, dist: 0.55, kind: "T" },
    { angle: 320, dist: 0.30, kind: "F" }, // Fleshball
  ];

  const blocks = [
    { angle: 60, dist: 0.2 },
    { angle: 80, dist: 0.25 },
    { angle: 75, dist: 0.32 },
    { angle: 250, dist: 0.4 },
  ];

  const r = 95;
  const dotPos = (angle, dist) => {
    const a = ((angle + compassDeg) * Math.PI) / 180;
    return { left: 100 + Math.sin(a) * dist * r, top: 100 - Math.cos(a) * dist * r };
  };

  return (
    <div style={{
      width: 220, height: 230,
      background: "rgba(10,9,8,0.85)",
      border: "1px solid var(--steel-2)",
      padding: 10,
      position: "relative",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.06), 0 4px 16px rgba(0,0,0,0.7)",
    }}>
      {/* Compass top strip */}
      <div style={{
        position: "relative",
        height: 18,
        overflow: "hidden",
        marginBottom: 6,
        borderBottom: "1px solid var(--steel-2)",
      }}>
        <CompassStrip deg={compassDeg} />
        {/* center tick */}
        <div style={{
          position: "absolute", left: "50%", top: 0, width: 1, height: "100%",
          background: "var(--cyan)", boxShadow: "0 0 6px rgba(0,255,255,0.8)",
        }} />
      </div>

      {/* radar circle */}
      <div style={{
        position: "relative",
        width: 200, height: 200,
        margin: "0 auto",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(74,107,42,0.12) 0%, rgba(10,9,8,0.95) 70%)",
        border: "1px solid var(--steel-2)",
        overflow: "hidden",
      }}>
        {/* range rings */}
        {[0.33, 0.66, 1].map((r, i) => (
          <div key={i} style={{
            position: "absolute",
            left: 100 - r * 95, top: 100 - r * 95,
            width: r * 190, height: r * 190,
            borderRadius: "50%",
            border: "1px dashed rgba(74,107,42,0.3)",
          }} />
        ))}
        {/* crosshair */}
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(74,107,42,0.2)" }} />
        <div style={{ position: "absolute", top: "50%", left: 0, height: 1, width: "100%", background: "rgba(74,107,42,0.2)" }} />

        {/* radar sweep */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 95, height: 2,
          background: "linear-gradient(90deg, rgba(0,255,255,0.6), transparent)",
          transformOrigin: "left center",
          transform: `rotate(${tick * 80}deg)`,
          transition: "transform 0.7s linear",
          boxShadow: "0 0 8px rgba(0,255,255,0.5)",
        }} />

        {/* placed blocks (small grey dots) */}
        {blocks.map((b, i) => {
          const p = dotPos(b.angle, b.dist);
          return (
            <div key={"b" + i} style={{
              position: "absolute", left: p.left - 2, top: p.top - 2,
              width: 4, height: 4, background: "var(--bone-dim)",
            }} />
          );
        })}

        {/* mobs (red blips) */}
        {mobs.map((m, i) => {
          const p = dotPos(m.angle + tick * 4, m.dist);
          return (
            <div key={"m" + i} style={{
              position: "absolute", left: p.left - 4, top: p.top - 4,
              width: 8, height: 8,
              background: "var(--blood)",
              boxShadow: "0 0 8px rgba(204,34,0,0.9)",
              animation: "flicker 0.8s infinite",
              fontFamily: "var(--mono)",
              fontSize: 7,
              color: "#000",
              textAlign: "center",
              lineHeight: "8px",
              fontWeight: 700,
            }}>
              {m.kind}
            </div>
          );
        })}

        {/* player center */}
        <div style={{
          position: "absolute", left: 100 - 4, top: 100 - 4,
          width: 8, height: 8,
          background: "var(--bone)",
          boxShadow: "0 0 8px rgba(216,210,196,0.9)",
        }} />
        {/* player facing arrow */}
        <div style={{
          position: "absolute", left: 100 - 1, top: 100 - 18,
          width: 2, height: 14,
          background: "var(--bone)",
          boxShadow: "0 0 6px rgba(216,210,196,0.7)",
        }} />
      </div>

      <div className="mono dim" style={{ fontSize: 9, letterSpacing: "0.18em", marginTop: 6, textAlign: "center" }}>
        ░ RADAR / 64m / 5 HOSTILES ░
      </div>
    </div>
  );
}

function CompassStrip({ deg }) {
  const marks = [];
  const dirs = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
  for (let d = 0; d < 360; d += 15) {
    const offset = ((d - deg + 540) % 360) - 180; // -180..180
    const isMain = d % 45 === 0;
    marks.push({ d, offset, label: dirs[d], isMain });
  }
  return (
    <>
      {marks.map(m => (
        Math.abs(m.offset) < 80 ? (
          <div key={m.d} style={{
            position: "absolute",
            left: `calc(50% + ${m.offset * 1.5}px)`,
            top: 0, transform: "translateX(-50%)",
            color: m.isMain ? "var(--bone)" : "var(--bone-dim)",
            fontFamily: "var(--mono)",
            fontSize: m.isMain ? 11 : 9,
            fontWeight: m.isMain ? 700 : 400,
            letterSpacing: "0.08em",
            opacity: 1 - Math.abs(m.offset) / 100,
          }}>
            {m.isMain ? m.label : "·"}
          </div>
        ) : null
      ))}
    </>
  );
}

function HordeAlert() {
  return (
    <div style={{
      position: "absolute",
      left: "50%", top: 24,
      transform: "translateX(-50%)",
      pointerEvents: "auto",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div className="display flicker" style={{
        fontSize: 36, color: "var(--blood)",
        letterSpacing: "0.2em",
        textShadow: "0 0 24px rgba(204,34,0,0.9), 2px 0 0 rgba(0,255,255,0.3)",
        fontWeight: 900,
      }}>
        ⚠ HORDE DETECTED
      </div>
      <div className="mono" style={{
        fontSize: 11, letterSpacing: "0.25em",
        color: "var(--bone-dim)",
      }}>
        ░ 47m N ░ 12 HOSTILES ░ CLOSING FAST ░
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 18, alignItems: "center" }}>
        <CreatureSilhouette kind="troll" size={60} className="pulse" />
        <CreatureSilhouette kind="brute" size={60} className="pulse" />
        <CreatureSilhouette kind="husk" size={60} className="pulse" />
      </div>
    </div>
  );
}

window.HUD = HUD;
