// death.jsx — Run-over overlay. Reads real stats from the GameBridge snapshot.

const ZOMBIE_INFO = {
  walker:   { name: "WALKER",      tag: '"THE SHAMBLING DEAD"', tier: 1, method: "MAULED" },
  runner:   { name: "RUNNER",      tag: '"THE FAST DEAD"',       tier: 2, method: "RUN DOWN" },
  brute:    { name: "FERAL BRUTE", tag: '"THE ARMORED ONE"',     tier: 4, method: "CRUSHED" },
  screamer: { name: "SCREAMER",    tag: '"THE HORDE CALLER"',    tier: 3, method: "OVERRUN" },
};

function DeathScreen({ onRespawn, onMenu }) {
  const [snap, setSnap] = React.useState(() => ({ ...window.GameBridge.state }));
  React.useEffect(() => {
    const h = (s) => setSnap({ ...s });
    window.GameBridge.on("state", h);
    return () => window.GameBridge.off("state", h);
  }, []);

  const causeKey = snap.deathCause || "walker";
  const info     = ZOMBIE_INFO[causeKey] || ZOMBIE_INFO.walker;
  const stats    = snap.stats || { kills: 0, blocksMined: 0, blocksPlaced: 0, deaths: 0 };
  const day      = snap.dayCount || 1;
  const timeStr  = formatTime(snap.timeFrac || 0);
  const location = `X ${snap.posX || 0} / Y ${snap.posY || 0} / Z ${snap.posZ || 0}`;

  return (
    <div data-screen-label="04 Death" style={{
      position: "absolute", inset: 0,
      pointerEvents: "auto",
      background:
        "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,4,2,0.85) 0%, rgba(2,1,1,0.98) 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      overflow: "hidden",
    }}>
      {/* blood splatter backdrop */}
      <div className="splatter" style={{ left: "5%",  top: "10%",    width: 500, height: 500, opacity: 0.45 }} />
      <div className="splatter" style={{ right: "8%", top: "20%",    width: 380, height: 380, opacity: 0.35, transform: "rotate(140deg)" }} />
      <div className="splatter" style={{ left: "30%", bottom: "5%",  width: 420, height: 420, opacity: 0.4,  transform: "rotate(-60deg)" }} />
      <div className="splatter" style={{ right: "10%", bottom: "8%", width: 340, height: 340, opacity: 0.5,  transform: "rotate(220deg)" }} />

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 90%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(204,34,0,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 320px 1fr",
        gap: 60,
        alignItems: "center",
        maxWidth: 1400,
        width: "100%",
      }}>
        {/* Left: title + cause */}
        <div style={{ textAlign: "right" }}>
          <div className="tag" style={{ color: "var(--blood)", marginBottom: 12, letterSpacing: "0.3em" }}>
            ░ SIGNAL LOST ░
          </div>
          <h1 className="display flicker" style={{
            fontSize: 120, margin: 0, color: "var(--blood)",
            letterSpacing: "0.08em",
            textShadow: "0 0 32px rgba(204,34,0,0.7), 3px 0 0 rgba(0,0,0,0.8)",
            lineHeight: 0.9, fontWeight: 900,
          }}>
            YOU<br />DIED
          </h1>
          <div className="div-ascii" style={{ marginTop: 14, color: "var(--rust)" }}>
            ━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div className="mono dim" style={{ fontSize: 12, marginTop: 12, letterSpacing: "0.18em" }}>
            CAUSE OF DEATH
          </div>
          <div className="display" style={{
            fontSize: 32, color: "var(--bone)", marginTop: 4, letterSpacing: "0.12em",
            textShadow: "0 0 12px rgba(204,34,0,0.5)",
          }}>
            {info.method} BY {info.name}
          </div>
          <div className="mono dim" style={{ fontSize: 11, marginTop: 6, letterSpacing: "0.12em" }}>
            ░ DAY {String(day).padStart(2, "0")} ░ {timeStr} ░
          </div>
        </div>

        {/* Center: assailant portrait */}
        <div style={{
          padding: 24,
          background: "rgba(10,4,2,0.85)",
          border: "2px solid var(--blood-deep)",
          boxShadow: "inset 0 0 40px rgba(204,34,0,0.2), 0 0 60px rgba(0,0,0,0.9), 0 0 80px rgba(204,34,0,0.15)",
          position: "relative",
        }}>
          <div className="tag" style={{ color: "var(--blood)", marginBottom: 10, textAlign: "center" }}>
            ░ ASSAILANT ░
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 16px" }}>
            <CreatureSilhouette kind={causeKey} size={240} className="pulse" bleeding />
          </div>
          <div className="display" style={{ fontSize: 24, color: "var(--bone)", textAlign: "center", letterSpacing: "0.15em" }}>
            {info.name}
          </div>
          <div className="mono dim" style={{ fontSize: 11, textAlign: "center", marginTop: 4, letterSpacing: "0.12em" }}>
            {info.tag} ░ THREAT TIER 0{info.tier}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--rust)", textAlign: "center", marginTop: 10, lineHeight: 1.6, letterSpacing: "0.03em", fontStyle: "italic" }}>
            // It got to you first.
          </div>
        </div>

        {/* Right: run record */}
        <div>
          <div className="tag" style={{ marginBottom: 12, letterSpacing: "0.3em" }}>
            ░ RUN RECORD ░
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <StatRow label="DAYS SURVIVED"   value={day} highlight />
            <StatRow label="CHARACTER LEVEL" value={snap.level || 1} />
            <StatRow label="BLOCKS MINED"    value={(stats.blocksMined || 0).toLocaleString()} />
            <StatRow label="BLOCKS PLACED"   value={(stats.blocksPlaced || 0).toLocaleString()} />
            <StatRow label="HOSTILES KILLED" value={stats.kills || 0} />
            <StatRow label="DEATHS THIS RUN" value={stats.deaths || 1} blood />
            <StatRow label="LAST LOCATION"   value={location} small />
          </div>
          <div className="div-ascii" style={{ marginTop: 14, color: "var(--rust)" }}>
            ━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", marginTop: 10 }}>
            <span style={{ color: "var(--blood)" }}>► THE WORLD DOES NOT FORGIVE</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: 20, marginTop: 60, zIndex: 2 }}>
        <button className="btn primary" onClick={onRespawn} style={{ padding: "20px 40px", fontSize: 18 }}>
          ▶ RESPAWN AT BEDROLL
        </button>
        <button className="btn" onClick={onMenu} style={{ padding: "20px 40px", fontSize: 14 }}>
          ◀ RETURN TO MENU
        </button>
      </div>
      <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.25em", marginTop: 18, position: "relative" }}>
        ░ INVENTORY PRESERVED ON RESPAWN ░
      </div>
    </div>
  );
}

function formatTime(frac) {
  const totalMin = Math.floor(frac * 24 * 60);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function StatRow({ label, value, highlight, blood, small }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "160px 1fr",
      gap: 14, alignItems: "baseline",
      padding: "6px 12px",
      background: "rgba(10,4,2,0.7)",
      borderLeft: `2px solid ${highlight ? "var(--cyan)" : blood ? "var(--blood)" : "var(--steel-2)"}`,
    }}>
      <span className="mono dim" style={{ fontSize: 10, letterSpacing: "0.15em" }}>
        {label}
      </span>
      <span className="mono" style={{
        fontSize: small ? 11 : 16,
        color: highlight ? "var(--cyan)" : blood ? "var(--blood)" : "var(--bone)",
        textShadow: highlight ? "0 0 8px rgba(0,255,255,0.5)" : blood ? "0 0 6px rgba(204,34,0,0.5)" : "none",
        letterSpacing: small ? "0.08em" : "0.05em",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 600,
      }}>
        {value}
      </span>
    </div>
  );
}

window.DeathScreen = DeathScreen;
