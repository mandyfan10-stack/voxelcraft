// loot.jsx — Loot-crate transfer overlay. Driven by GameBridge.state.lootOpen.

const CRATE_TITLES = {
  cabinet:   "RUSTED CABINET",
  toolbox:   "TOOLBOX",
  ammoCrate: "AMMO CRATE",
};

const CRATE_TAGS = {
  cabinet:   "// HOUSEHOLD SCRAPS",
  toolbox:   "// WORK GEAR",
  ammoCrate: "// MILITARY",
};

function Loot({ onClose }) {
  const [snap, setSnap] = React.useState(() => ({ ...window.GameBridge.state }));

  React.useEffect(() => {
    const h = (s) => setSnap({ ...s });
    window.GameBridge.on("state", h);
    return () => window.GameBridge.off("state", h);
  }, []);

  const open = snap.lootOpen;
  const meta = snap.itemMeta || {};
  const contents = open ? open.contents : [];

  // Close on ESC.
  React.useEffect(() => {
    const k = (e) => { if (e.key === "Escape") { e.preventDefault(); doClose(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  function doClose() {
    window.GameBridge.emit("loot:close");
    onClose();
  }

  function takeOne(idx) {
    if (!open) return;
    window.GameBridge.emit("loot:take", { crateId: open.id, idx });
  }
  function takeAll() {
    if (!open) return;
    window.GameBridge.emit("loot:takeAll", { crateId: open.id });
  }

  if (!open) return null;

  const title = CRATE_TITLES[open.type] || "CACHE";
  const tag   = CRATE_TAGS[open.type]   || "// SALVAGE";

  return (
    <div data-screen-label="06 Loot" style={{
      position: "absolute", inset: 0,
      background: "rgba(5,3,2,0.85)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "auto",
    }}
    onClick={(e) => { if (e.target === e.currentTarget) doClose(); }}
    >
      <div className="panel metal" style={{
        width: 620, padding: 28,
        display: "flex", flexDirection: "column", gap: 16,
        position: "relative",
      }}>
        <Rivets />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="tag" style={{ color: "var(--blood)", marginBottom: 2 }}>{tag}</div>
            <div className="stencil" style={{ fontSize: 26 }}>{title}</div>
          </div>
          <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            {contents.length} STACK{contents.length !== 1 ? "S" : ""}
          </div>
        </div>

        {contents.length === 0 ? (
          <div className="mono dim" style={{ fontSize: 12, padding: "30px 0", textAlign: "center", letterSpacing: "0.12em" }}>
            ▪ EMPTY ▪
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            padding: 10,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid var(--steel-2)",
          }}>
            {contents.map((item, i) => {
              const m = meta[item.id] || {};
              return (
                <button
                  key={i}
                  onClick={() => takeOne(i)}
                  style={{
                    aspectRatio: "1 / 1",
                    background: "rgba(20,17,13,0.85)",
                    border: "1px solid var(--steel-2)",
                    position: "relative", padding: 0,
                    cursor: "crosshair",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4,
                  }}
                  title={(m.name || item.id) + ' ×' + item.count}
                >
                  <VoxelBlock kind={m.kind || "dirt"} size={44} />
                  <div className="mono" style={{ fontSize: 11, color: "var(--bone)" }}>
                    ×{item.count}
                  </div>
                  <div className="mono dim" style={{ fontSize: 9, letterSpacing: "0.04em", lineHeight: 1.1, textAlign: "center", padding: "0 4px" }}>
                    {(m.name || item.id).toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
          <span className="kbd">CLICK</span> TAKE ONE STACK&nbsp;&nbsp;&nbsp;
          <span className="kbd">ESC</span> CLOSE
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn primary"
            disabled={contents.length === 0}
            onClick={takeAll}
            style={{ flex: 1, padding: 12, fontSize: 13, opacity: contents.length === 0 ? 0.5 : 1 }}
          >
            ▶ TAKE EVERYTHING
          </button>
          <button className="btn" onClick={doClose} style={{ padding: 12, fontSize: 13 }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

window.Loot = Loot;
