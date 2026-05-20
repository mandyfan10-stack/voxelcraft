// settings.jsx — In-game pause / settings overlay. Technical readout style.

function Settings({ onResume, onMenu }) {
  const [tab, setTab] = React.useState("GRAPHICS");
  const [fov, setFov] = React.useState(75);
  const [renderDist, setRenderDist] = React.useState(4);
  const [resolution, setResolution] = React.useState("1920×1080");
  const [shadows, setShadows] = React.useState("HIGH");

  const [master, setMaster] = React.useState(72);
  const [ambience, setAmbience] = React.useState(85);
  const [sfx, setSfx] = React.useState(60);
  const [music, setMusic] = React.useState(40);

  const [difficulty, setDifficulty] = React.useState("HARD");
  const [friendlyFire, setFriendlyFire] = React.useState(false);
  const [autoSave, setAutoSave] = React.useState(true);

  return (
    <div data-screen-label="05 Settings" style={{
      position: "absolute", inset: 0,
      background: "rgba(5,3,2,0.85)",
      backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "auto",
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onResume(); }}
    >
      <div className="panel metal" style={{
        width: 920, height: 600,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        position: "relative",
      }}>
        <Rivets />

        {/* Left: tab strip */}
        <div style={{
          background: "rgba(0,0,0,0.55)",
          padding: 28,
          display: "flex", flexDirection: "column", gap: 18,
          borderRight: "1px solid var(--steel-2)",
        }}>
          <div>
            <div className="tag" style={{ color: "var(--blood)", marginBottom: 4 }}>// PAUSED</div>
            <div className="stencil" style={{ fontSize: 22 }}>SYSTEM</div>
            <div className="mono dim" style={{ fontSize: 9, letterSpacing: "0.18em", marginTop: 2 }}>
              ░ WORLD FROZEN ░
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {["GRAPHICS", "AUDIO", "GAMEPLAY", "CONTROLS"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  appearance: "none", border: "none",
                  textAlign: "left",
                  padding: "10px 12px",
                  fontFamily: "var(--display)",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.15em",
                  background: tab === t ? "rgba(204,34,0,0.15)" : "transparent",
                  color: tab === t ? "var(--blood)" : "var(--bone-dim)",
                  borderLeft: tab === t ? "2px solid var(--blood)" : "2px solid transparent",
                  cursor: "crosshair",
                  textShadow: tab === t ? "0 0 8px rgba(204,34,0,0.4)" : "none",
                }}
              >
                {tab === t ? "▶ " : "  "}{t}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn primary" onClick={onResume} style={{ padding: "12px", fontSize: 13 }}>
              ▶ RESUME
            </button>
            <button className="btn danger" onClick={onMenu} style={{ padding: "10px", fontSize: 11 }}>
              QUIT TO MENU
            </button>
            <div className="mono dim" style={{ fontSize: 9, letterSpacing: "0.18em", textAlign: "center", marginTop: 4 }}>
              ░ AUTOSAVE ENABLED ░
            </div>
          </div>
        </div>

        {/* Right: panel */}
        <div style={{ padding: 36, overflowY: "auto" }}>
          <div className="tag" style={{ marginBottom: 4 }}>// TAB / {tab}</div>
          <div className="display" style={{ fontSize: 32, marginBottom: 24, letterSpacing: "0.1em" }}>
            {tab}
          </div>

          {tab === "GRAPHICS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SliderRow label="FIELD OF VIEW" value={fov}
                min={60} max={120} unit="°"
                onChange={(v) => { setFov(v); window.GameBridge.emit("setFov", v); }} />
              <SliderRow label="RENDER DISTANCE" value={renderDist}
                min={2} max={16} unit=" CHUNKS"
                onChange={(v) => { setRenderDist(v); window.GameBridge.emit("setRenderDist", v); }} />
              <RadioRow label="RESOLUTION" value={resolution} options={["1280×720", "1920×1080", "2560×1440", "3840×2160"]} onChange={setResolution} />
              <RadioRow label="SHADOW QUALITY" value={shadows} options={["OFF", "LOW", "MED", "HIGH"]} onChange={setShadows} />
              <RadioRow label="MOTION BLUR" value="OFF" options={["OFF", "LIGHT", "HEAVY"]} onChange={() => {}} />
              <RadioRow label="CRT FILTER" value="ON" options={["OFF", "ON"]} onChange={() => {}} />
              <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.18em", marginTop: 8, padding: "8px 12px", borderLeft: "2px solid var(--cyan)", background: "rgba(0,255,255,0.05)" }}>
                ░ GPU: <span className="cyan">RUSTED-9000 / 2.4GB</span> ░ FPS: <span className="cyan">47</span> ░
              </div>
            </div>
          )}

          {tab === "AUDIO" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SliderRow label="MASTER VOLUME" value={master}
                min={0} max={100} unit="%"
                onChange={(v) => { setMaster(v); window.GameBridge.emit("audio:master", v); }} />
              <SliderRow label="AMBIENT HORROR" value={ambience}
                min={0} max={100} unit="%"
                onChange={(v) => { setAmbience(v); window.GameBridge.emit("audio:ambient", v); }} />
              <SliderRow label="SFX" value={sfx}
                min={0} max={100} unit="%"
                onChange={(v) => { setSfx(v); window.GameBridge.emit("audio:sfx", v); }} />
              <SliderRow label="MUSIC" value={music}
                min={0} max={100} unit="%"
                onChange={(v) => { setMusic(v); window.GameBridge.emit("audio:music", v); }} />
              <RadioRow label="CREATURE VOICES" value="ON" options={["OFF", "MUTED", "ON"]} onChange={() => {}} />
              <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.18em", marginTop: 8, padding: "8px 12px", borderLeft: "2px solid var(--blood)", background: "rgba(204,34,0,0.05)" }}>
                ⚠ AMBIENT HORROR ABOVE 80% MAY INCREASE PARANOIA EVENTS
              </div>
            </div>
          )}

          {tab === "GAMEPLAY" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <RadioRow label="DIFFICULTY" value={difficulty} options={["NORMAL", "HARD", "HARDCORE"]} onChange={setDifficulty} />
              <ToggleRow label="FRIENDLY FIRE" value={friendlyFire} onChange={setFriendlyFire} />
              <ToggleRow label="AUTO-SAVE" value={autoSave}
                onChange={(v) => { setAutoSave(v); window.GameBridge.emit("setAutoSave", v); }} />
              <ToggleRow label="SHOW DAMAGE NUMBERS" value={true} onChange={() => {}} />
              <ToggleRow label="MOTION SICKNESS REDUCTION" value={false} onChange={() => {}} />
              <RadioRow label="HORDE FREQUENCY" value="EVERY 5 DAYS" options={["EVERY 3 DAYS", "EVERY 5 DAYS", "EVERY 7 DAYS"]} onChange={() => {}} />
              <div className="mono dim" style={{ fontSize: 10, letterSpacing: "0.18em", marginTop: 8, padding: "8px 12px", borderLeft: "2px solid var(--rust)", background: "rgba(107,59,31,0.1)" }}>
                ░ CHANGES APPLY AFTER NEXT DAY-CYCLE ░
              </div>
            </div>
          )}

          {tab === "CONTROLS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["MOVE FORWARD", "W"],
                ["MOVE BACK", "S"],
                ["STRAFE LEFT / RIGHT", "A / D"],
                ["JUMP", "SPACE"],
                ["SPRINT", "SHIFT"],
                ["MINE BLOCK", "LMB"],
                ["PLACE BLOCK", "RMB"],
                ["INVENTORY", "I"],
                ["MAP TOGGLE", "M"],
                ["PAUSE", "ESC"],
                ["INTERACT", "E"],
                ["DROP ITEM", "Q"],
                ["CROUCH", "CTRL"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  padding: "8px 12px",
                  background: "rgba(10,9,8,0.5)",
                  border: "1px solid var(--steel-2)",
                  alignItems: "center",
                }}>
                  <span className="mono dim" style={{ fontSize: 11, letterSpacing: "0.12em" }}>{k}</span>
                  <span className="kbd" style={{ fontSize: 11, padding: "3px 10px" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="mono dim" style={{ fontSize: 11, letterSpacing: "0.15em" }}>{label}</span>
        <span className="mono cyan" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: "relative", height: 22, padding: "8px 0" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%", height: 6,
          transform: "translateY(-50%)",
          background: "#0a0908",
          border: "1px solid var(--steel-2)",
        }}>
          <div style={{
            height: "100%",
            width: pct + "%",
            background: "linear-gradient(90deg, var(--blood-deep) 0%, var(--blood) 100%)",
            boxShadow: "0 0 8px rgba(204,34,0,0.4)",
          }} />
        </div>
        <input
          type="range"
          min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%",
            opacity: 0, cursor: "crosshair",
          }}
        />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 6px)`, top: "50%",
          width: 12, height: 18,
          background: "var(--bone)",
          transform: "translateY(-50%)",
          border: "1px solid #0a0908",
          boxShadow: "0 0 8px rgba(0,255,255, calc(0.6 * var(--cyanlevel)))",
          pointerEvents: "none",
        }} />
      </div>
      {/* tick marks */}
      <div className="mono dim" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.1em", marginTop: 2 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function RadioRow({ label, value, options, onChange }) {
  return (
    <div>
      <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.15em", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4 }}>
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="btn"
            style={{
              padding: "8px 4px",
              fontSize: 11,
              letterSpacing: "0.1em",
              ...(value === o ? {
                color: "var(--cyan)",
                borderColor: "var(--cyan)",
                background: "linear-gradient(180deg, #0a1c1e 0%, #050d0e 100%)",
                boxShadow: "inset 0 0 0 1px rgba(0,255,255,0.4), 0 0 12px rgba(0,255,255,0.3)",
              } : {})
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 70px",
      alignItems: "center",
      padding: "10px 12px",
      background: "rgba(10,9,8,0.5)",
      border: "1px solid var(--steel-2)",
    }}>
      <span className="mono dim" style={{ fontSize: 11, letterSpacing: "0.15em" }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="btn"
        style={{
          padding: "6px 0",
          fontSize: 11,
          letterSpacing: "0.15em",
          ...(value ? {
            color: "var(--cyan)",
            borderColor: "var(--cyan)",
            background: "linear-gradient(180deg, #0a1c1e 0%, #050d0e 100%)",
            boxShadow: "inset 0 0 0 1px rgba(0,255,255,0.4)",
          } : { color: "var(--bone-dim)" })
        }}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );
}

window.Settings = Settings;
