// inventory.jsx — Full-screen inventory: live grid, click-to-move, real crafting.
// Driven entirely by the GameBridge snapshot; every mutation is sent as a command.

function Rivets() {
  return (
    <>
      <span className="rivet" style={{ left: 8, top: 8 }} />
      <span className="rivet" style={{ right: 8, top: 8 }} />
      <span className="rivet" style={{ left: 8, bottom: 8 }} />
      <span className="rivet" style={{ right: 8, bottom: 8 }} />
    </>
  );
}

function MiniStat({ label, value, max, kind }) {
  const v = Math.round(value || 0);
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "62px 1fr 46px", gap: 8, alignItems: "center" }}>
      <span className="mono dim" style={{ fontSize: 9, letterSpacing: "0.12em" }}>{label}</span>
      <div className={"bar " + kind} style={{ height: 8 }}>
        <div className="fill" style={{ width: pct + "%" }} />
      </div>
      <span className="mono" style={{ fontSize: 10, textAlign: "right", color: "var(--bone)" }}>{v}/{max}</span>
    </div>
  );
}

function SkillRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--steel-2)" }}>
      <span className="mono dim" style={{ fontSize: 10, letterSpacing: "0.1em" }}>{label}</span>
      <span className="mono cyan" style={{ fontSize: 11 }}>{value}</span>
    </div>
  );
}

function itemDesc(info) {
  switch (info.category) {
    case "block":  return "// Building material. Select in the hotbar, place with right-click.";
    case "tool":   return "// Speeds up mining when selected in the hotbar. Wears down with use.";
    case "weapon": return "// Melee weapon. Select in the hotbar for far heavier hits.";
    case "food":   return "// Edible. Double-click to consume — restores hunger and health.";
    case "drink":  return "// Drinkable. Double-click to consume — restores thirst.";
    default:       return "// Raw crafting material. Combine at the crafting panel.";
  }
}

function Inventory({ onClose }) {
  const [snap, setSnap] = React.useState(() => ({ ...window.GameBridge.state }));
  const [picked, setPicked] = React.useState(null);   // slot index held for a move
  const [hover, setHover] = React.useState(null);     // slot index under the cursor

  React.useEffect(() => {
    const h = (s) => setSnap({ ...s });
    window.GameBridge.on("state", h);
    return () => window.GameBridge.off("state", h);
  }, []);

  const inv     = snap.inv || [];
  const meta    = snap.itemMeta || {};
  const recipes = snap.recipeMeta || [];
  const selIdx  = snap.selIdx || 0;

  const slotData = (i) => {
    const s = inv[i];
    if (!s) return null;
    const m = meta[s.id] || {};
    return {
      id: s.id, count: s.count, durability: s.durability,
      name: m.name || s.id, kind: m.kind || "dirt",
      category: m.category || "material", stack: m.stack || 1,
      maxDura: m.durability || 0,
    };
  };

  const invCount = (id) => {
    let n = 0;
    for (const s of inv) if (s && s.id === id) n += s.count;
    return n;
  };
  const recipeReady = (r) => r.inputs.every((inp) => invCount(inp.id) >= inp.count);

  function clickSlot(idx, e) {
    if (e.shiftKey) {
      if (inv[idx]) window.GameBridge.emit("inv:split", { idx });
      setPicked(null);
      return;
    }
    if (picked === null) {
      if (inv[idx]) setPicked(idx);
    } else if (picked === idx) {
      setPicked(null);
    } else {
      window.GameBridge.emit("inv:move", { from: picked, to: idx });
      setPicked(null);
    }
  }
  function ctxSlot(idx, e) {
    e.preventDefault();
    if (inv[idx]) window.GameBridge.emit("inv:drop", { idx });
    setPicked(null);
  }
  function dblSlot(idx) {
    const d = slotData(idx);
    if (d && (d.category === "food" || d.category === "drink")) {
      window.GameBridge.emit("consume", { idx });
      setPicked(null);
    }
  }

  const infoIdx = hover !== null ? hover : picked;
  const info    = infoIdx !== null ? slotData(infoIdx) : null;
  const used    = inv.filter(Boolean).length;

  const lvl     = snap.level || 1;
  const xpInLvl = Math.max(0, (snap.xp || 0) - (snap.levelXp || 0));
  const xpNeed  = Math.max(1, (snap.nextLevelXp || 0) - (snap.levelXp || 0));
  const perks   = snap.perks || { miningSpeed: 1, meleeDmg: 1 };

  const renderSlot = (idx, hotbarNum) => {
    const d = slotData(idx);
    const isPicked = picked === idx;
    const isSel = hotbarNum !== undefined && idx === selIdx;
    const duraFrac = d && d.durability !== undefined && d.maxDura > 0
      ? Math.max(0, Math.min(1, d.durability / d.maxDura)) : null;
    return (
      <button
        key={idx}
        onClick={(e) => clickSlot(idx, e)}
        onContextMenu={(e) => ctxSlot(idx, e)}
        onDoubleClick={() => dblSlot(idx)}
        onMouseEnter={() => setHover(idx)}
        onMouseLeave={() => setHover(null)}
        style={{
          width: "100%", aspectRatio: "1 / 1",
          background: isPicked ? "rgba(0,255,255,0.12)" : "rgba(20,17,13,0.85)",
          border: isPicked ? "2px solid var(--cyan)"
                : isSel ? "2px solid var(--olive)"
                : "1px solid var(--steel-2)",
          position: "relative", cursor: "crosshair", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {d && <VoxelBlock kind={d.kind} size={36} />}
        {d && d.count > 1 && (
          <div className="mono" style={{ position: "absolute", right: 3, bottom: 1, fontSize: 10, color: "var(--bone)", textShadow: "1px 1px 0 #000, -1px -1px 0 #000" }}>
            {d.count}
          </div>
        )}
        {duraFrac !== null && (
          <div style={{ position: "absolute", left: 3, right: 3, bottom: 2, height: 3, background: "#0a0908", border: "1px solid var(--steel-2)" }}>
            <div style={{ height: "100%", width: duraFrac * 100 + "%", background: duraFrac < 0.25 ? "var(--blood)" : duraFrac < 0.5 ? "#cc8800" : "var(--olive)" }} />
          </div>
        )}
        {hotbarNum !== undefined && (
          <div className="mono" style={{ position: "absolute", left: 3, top: 1, fontSize: 9, color: isSel ? "var(--olive)" : "var(--bone-dim)" }}>
            {hotbarNum}
          </div>
        )}
      </button>
    );
  };

  return (
    <div data-screen-label="03 Inventory" style={{
      position: "absolute", inset: 0,
      background: "rgba(5,3,2,0.85)", backdropFilter: "blur(3px)",
      display: "grid", gridTemplateColumns: "300px 1fr 348px",
      gap: 16, padding: 40, pointerEvents: "auto",
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* LEFT — survivor ───────────────────────────────────────────── */}
      <div className="panel metal" style={{ padding: 26, position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
        <Rivets />
        <div>
          <div className="tag" style={{ color: "var(--blood)", marginBottom: 4 }}>// SURVIVOR</div>
          <div className="stencil" style={{ fontSize: 22 }}>UNNAMED SUBJECT</div>
          <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.15em", marginTop: 2 }}>
            ID #047 ░ HARDCORE PROTOCOL
          </div>
        </div>

        <div>
          <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.15em", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>LEVEL <span className="cyan" style={{ fontSize: 14 }}>{lvl}</span></span>
            <span>{xpInLvl} / {xpNeed} XP</span>
          </div>
          <div className="bar xp" style={{ height: 9 }}>
            <div className="fill" style={{ width: Math.min(100, (xpInLvl / xpNeed) * 100) + "%" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <MiniStat label="HEALTH"  value={snap.hp}      max={snap.maxHp || 100} kind="" />
          <MiniStat label="STAMINA" value={snap.stamina} max={100} kind="stamina" />
          <MiniStat label="HUNGER"  value={snap.hunger}  max={100} kind="hunger" />
          <MiniStat label="THIRST"  value={snap.thirst}  max={100} kind="thirst" />
        </div>

        <div>
          <div className="tag" style={{ marginBottom: 4 }}>// SKILLS</div>
          <SkillRow label="MINING SPEED" value={"+" + Math.round((perks.miningSpeed - 1) * 100) + "%"} />
          <SkillRow label="MELEE DAMAGE" value={"+" + Math.round((perks.meleeDmg - 1) * 100) + "%"} />
        </div>

        <div style={{ flex: 1 }} />
        <div className="mono dim" style={{ fontSize: 9, letterSpacing: "0.15em", textAlign: "center" }}>
          ░ DAY {snap.dayCount || 1} ░ {snap.isBloodMoon ? "BLOOD MOON" : snap.isNight ? "NIGHT" : "DAY"} ░
        </div>
      </div>

      {/* MIDDLE — grid ─────────────────────────────────────────────── */}
      <div className="panel metal" style={{ padding: 24, position: "relative", display: "flex", flexDirection: "column" }}>
        <Rivets />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div className="tag" style={{ color: "var(--blood)", marginBottom: 2 }}>// CACHE</div>
            <div className="stencil" style={{ fontSize: 28 }}>INVENTORY</div>
          </div>
          <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.15em" }}>{used} / {inv.length} SLOTS USED</div>
        </div>

        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", marginBottom: 6 }}>░ HOTBAR (KEYS 1-8) ░</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, padding: 6, background: "rgba(0,0,0,0.4)", border: "1px solid var(--steel-2)", marginBottom: 14 }}>
          {Array.from({ length: 8 }).map((_, i) => renderSlot(i, i + 1))}
        </div>

        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", marginBottom: 6 }}>░ STORAGE ░</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, padding: 6, background: "rgba(0,0,0,0.4)", border: "1px solid var(--steel-2)" }}>
          {Array.from({ length: Math.max(0, inv.length - 8) }).map((_, i) => renderSlot(i + 8))}
        </div>

        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.14em", marginTop: 14 }}>
          <span className="kbd">CLICK</span> PICK / PLACE&nbsp;&nbsp;<span className="kbd">SHIFT+CLICK</span> SPLIT&nbsp;&nbsp;<span className="kbd">RMB</span> DROP&nbsp;&nbsp;<span className="kbd">DBL-CLICK</span> EAT/DRINK
        </div>
      </div>

      {/* RIGHT — info + crafting ───────────────────────────────────── */}
      <div className="panel metal" style={{ padding: 24, position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
        <Rivets />
        <div>
          <div className="tag" style={{ marginBottom: 6 }}>// ITEM</div>
          {info ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                <div style={{ width: 60, height: 60, background: "rgba(0,0,0,0.4)", border: "1px solid var(--steel-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <VoxelBlock kind={info.kind} size={46} />
                </div>
                <div>
                  <div className="display" style={{ fontSize: 17, color: "var(--bone)", letterSpacing: "0.06em" }}>{info.name}</div>
                  <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>
                    ×{info.count} ░ {info.category.toUpperCase()}
                    {info.durability !== undefined && info.maxDura > 0 && <span> ░ DUR {info.durability}/{info.maxDura}</span>}
                  </div>
                </div>
              </div>
              <div className="mono dim" style={{ fontSize: 11, lineHeight: 1.5 }}>{itemDesc(info)}</div>
            </div>
          ) : (
            <div className="mono dim" style={{ fontSize: 11, padding: "16px 0", letterSpacing: "0.05em" }}>
              [ HOVER A SLOT FOR DETAILS ]
            </div>
          )}
        </div>

        <div className="div-ascii">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="tag" style={{ marginBottom: 8, color: "var(--cyan)" }}>// CRAFTING</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", paddingRight: 2 }}>
            {recipes.map((r, i) => {
              const ready = recipeReady(r);
              const outMeta = meta[r.out.id] || {};
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "38px 1fr auto", gap: 10, alignItems: "center",
                  padding: 7, background: "rgba(10,9,8,0.6)",
                  border: "1px solid " + (ready ? "var(--steel-2)" : "rgba(60,60,60,0.4)"),
                  opacity: ready ? 1 : 0.55,
                }}>
                  <div style={{ width: 34, height: 34, background: "rgba(0,0,0,0.4)", border: "1px solid var(--steel-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <VoxelBlock kind={outMeta.kind || "dirt"} size={24} />
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--bone)", letterSpacing: "0.05em", fontWeight: 600 }}>
                      {r.name}{r.out.count > 1 ? " ×" + r.out.count : ""}
                    </div>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.04em", marginTop: 2 }}>
                      {r.inputs.map((inp, j) => {
                        const have = invCount(inp.id);
                        const m = meta[inp.id] || {};
                        return (
                          <span key={j} style={{ marginRight: 8, color: have >= inp.count ? "var(--bone-dim)" : "var(--blood)" }}>
                            {(m.name || inp.id)} {have}/{inp.count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    className="btn"
                    disabled={!ready}
                    onClick={() => { if (ready) window.GameBridge.emit("craft", i); }}
                    style={{ padding: "6px 10px", fontSize: 10, cursor: ready ? "crosshair" : "not-allowed", color: ready ? "var(--bone)" : "var(--bone-dim)" }}
                  >
                    {ready ? "CRAFT" : "LOCKED"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button className="btn danger" onClick={onClose} style={{ padding: 12, fontSize: 12 }}>
          ▶ CLOSE [ I ]
        </button>
      </div>
    </div>
  );
}

window.Inventory = Inventory;
