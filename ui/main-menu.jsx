// main-menu.jsx — Main Menu screen with worn survival aesthetic + countdown dread.

function MainMenu({ onStart }) {
  const [difficulty, setDifficulty] = React.useState("HARD");
  const [seed, setSeed] = React.useState("BLOODMOON-7724");

  // countdown to "horde night" — runs forever
  const [time, setTime] = React.useState(60 * 60 * 6 + 23 * 60 + 12);
  React.useEffect(() => {
    const i = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const hh = String(Math.floor(time / 3600)).padStart(2, "0");
  const mm = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");

  return (
    <div data-screen-label="01 Main Menu" style={{
      position: "absolute", inset: 0,
      pointerEvents: "auto",
      display: "grid",
      gridTemplateColumns: "1fr 480px",
      background: "rgba(5,3,2,0.78)",
      backdropFilter: "blur(2px)",
    }}>
      {/* Left: title block */}
      <div style={{
        padding: "60px 80px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative",
      }}>
        <div>
          <div className="tag" style={{ color: "var(--blood)", marginBottom: 8 }}>
            ▼ VOXELFEAR.exe / v0.7.3 / WORLD: UNSTABLE
          </div>
          <div className="div-ascii">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <h1
            className="display flicker"
            data-text="VOXELFEAR"
            style={{
              fontSize: 180,
              lineHeight: 0.85,
              margin: "24px 0 12px",
              color: "var(--bone)",
              letterSpacing: "0.04em",
              fontWeight: 900,
              textShadow: `
                3px 0 0 rgba(204,34,0,calc(0.7 * var(--bloodlevel))),
                -3px 0 0 rgba(0,255,255,calc(0.4 * var(--cyanlevel))),
                0 0 32px rgba(204,34,0,calc(0.4 * var(--bloodlevel)))`,
            }}
          >
            <span className="glitch" data-text="VOXEL">VOXEL</span>
            <span className="glitch blood" data-text="FEAR" style={{ color: "var(--blood)" }}>FEAR</span>
          </h1>
          <div className="mono dim" style={{ fontSize: 14, marginBottom: 32, letterSpacing: "0.1em" }}>
            ░ A SURVIVAL RECORD ░ NO ONE GETS OUT ░
          </div>
        </div>

        {/* Countdown — the dread */}
        <div style={{ position: "relative" }}>
          <div className="tag" style={{ marginBottom: 10 }}>
            BLOOD MOON RISING IN
          </div>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: 96,
            fontWeight: 700,
            color: "var(--blood)",
            letterSpacing: "0.04em",
            textShadow: "0 0 32px rgba(204,34,0,0.6)",
            lineHeight: 1,
          }}>
            <span style={{ display: "inline-block", minWidth: "1.6em" }}>{hh}</span>
            <span style={{ color: "var(--rust)" }}>:</span>
            <span style={{ display: "inline-block", minWidth: "1.6em" }}>{mm}</span>
            <span style={{ color: "var(--rust)" }}>:</span>
            <span style={{ display: "inline-block", minWidth: "1.6em" }}>{ss}</span>
          </div>
          <div className="mono dim" style={{ fontSize: 12, marginTop: 8, letterSpacing: "0.18em" }}>
            DAY 06 OF 07 ░ HORDE COMMITTED ░ THEY KNOW WHERE YOU ARE
          </div>
        </div>

        {/* foot */}
        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.2em", display: "flex", justifyContent: "space-between" }}>
          <span>BUILD 0.7.3-CORRUPTED</span>
          <span>SAVE: NONE_FOUND.dat</span>
          <span>UPTIME: 06D:23H:12M</span>
        </div>

        {/* blood splatter accent */}
        <div className="splatter" style={{ left: 40, top: 80, width: 280, height: 280, opacity: 0.18 }} />
        <div className="splatter" style={{ right: -40, bottom: 120, width: 200, height: 200, opacity: 0.12, transform: "rotate(140deg)" }} />
      </div>

      {/* Right: control panel */}
      <div className="panel metal" style={{
        margin: 40, padding: "40px 40px",
        display: "flex", flexDirection: "column", gap: 28,
        position: "relative",
      }}>
        <span className="rivet" style={{ left: 8, top: 8 }} />
        <span className="rivet" style={{ right: 8, top: 8 }} />
        <span className="rivet" style={{ left: 8, bottom: 8 }} />
        <span className="rivet" style={{ right: 8, bottom: 8 }} />

        <div>
          <div className="tag" style={{ marginBottom: 6 }}>// DIFFICULTY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {["NORMAL", "HARD", "HARDCORE"].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="btn"
                style={{
                  padding: "14px 8px",
                  fontSize: 13,
                  ...(difficulty === d ? {
                    color: "var(--cyan)",
                    borderColor: "var(--cyan)",
                    background: "linear-gradient(180deg, #0a1c1e 0%, #050d0e 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(0,255,255,0.4), 0 0 16px rgba(0,255,255,0.3)",
                  } : {})
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mono dim" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
            {difficulty === "NORMAL" && "// Hordes every 7 days. Death is recoverable."}
            {difficulty === "HARD" && "// Hordes every 5 days. You lose 30% of inventory."}
            {difficulty === "HARDCORE" && (
              <span style={{ color: "var(--blood)" }}>
                // PERMADEATH. One life. World deletes on death.
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="tag" style={{ marginBottom: 6 }}>// WORLD SEED</div>
          <div style={{ position: "relative" }}>
            <input
              value={seed}
              onChange={e => setSeed(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                background: "#0a0908",
                color: "var(--cyan)",
                border: "1px solid var(--steel-2)",
                padding: "14px 16px",
                fontFamily: "var(--mono)",
                fontSize: 16,
                letterSpacing: "0.1em",
                outline: "none",
                textShadow: "0 0 8px rgba(0,255,255, calc(0.6 * var(--cyanlevel)))",
              }}
            />
            <button
              onClick={() => setSeed("BLOODMOON-" + Math.floor(Math.random() * 9999).toString().padStart(4, "0"))}
              className="mono dim"
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "1px solid var(--steel-2)",
                color: "var(--bone-dim)", padding: "4px 8px", fontSize: 10, cursor: "crosshair",
                letterSpacing: "0.1em",
              }}
            >
              ⟳ RANDOMIZE
            </button>
          </div>
        </div>

        <div className="div-ascii">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

        <button
          className="btn primary"
          onClick={onStart}
          style={{ padding: "22px", fontSize: 22, letterSpacing: "0.2em" }}
        >
          ▶ START SURVIVAL
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button className="btn" style={{ padding: "12px", fontSize: 12 }}>LOAD WORLD</button>
          <button className="btn" style={{ padding: "12px", fontSize: 12 }}>SETTINGS</button>
        </div>

        <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.18em", textAlign: "center", marginTop: 4 }}>
          ░ LAST RUN: 06 DAYS / KILLED BY TROLL ░
        </div>
      </div>
    </div>
  );
}

window.MainMenu = MainMenu;
