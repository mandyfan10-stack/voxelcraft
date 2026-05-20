// app.jsx — Game shell. Routes between menu / hud / inventory / loot / settings / death,
// and shows a fatal-error screen if the game module emits one or the UI tree throws.

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (this.state.error) {
      return <FatalErrorScreen message={'UI crashed: ' + (this.state.error.message || this.state.error)} />;
    }
    return this.props.children;
  }
}

function TopBarButton({ label, onPress }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onPress(); }}
      onClick={onPress}
      style={{
        minWidth: 56, height: 44,
        padding: "0 12px",
        appearance: "none",
        border: "1px solid var(--steel-2)",
        background: "linear-gradient(180deg, rgba(43,40,35,0.92) 0%, rgba(10,9,8,0.95) 100%)",
        color: "var(--bone)",
        fontFamily: "var(--display)",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "0.15em",
        boxShadow: "inset 0 1px 0 rgba(216,210,196,0.08), 0 4px 12px rgba(0,0,0,0.7)",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        cursor: "crosshair",
      }}
    >
      {label}
    </button>
  );
}

function FatalErrorScreen({ message }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(5,3,2,0.95)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 40, zIndex: 9999, pointerEvents: "auto",
    }}>
      <div className="panel metal" style={{ padding: 32, maxWidth: 540, textAlign: "center" }}>
        <div className="tag" style={{ color: "var(--blood)", marginBottom: 8 }}>// FATAL ERROR</div>
        <div className="stencil" style={{ fontSize: 28, marginBottom: 16 }}>SIGNAL LOST</div>
        <div className="mono" style={{ fontSize: 12, lineHeight: 1.6, color: "var(--bone)" }}>{message}</div>
        <button className="btn primary" onClick={() => location.reload()} style={{ marginTop: 24, padding: "12px 24px", fontSize: 14 }}>
          ▶ RELOAD
        </button>
      </div>
    </div>
  );
}

// Distress / CRT look — applied once to the document.
const DISTRESS = {
  distress:   0.25,  // grain/distress intensity — was 1
  bloodlevel: 0.35,  // blood vignette tint
  cyanlevel:  0.5,   // cyan glow on elements
  scanlines:  0.12,  // scanline opacity — was 0.5, main visibility killer
};

function App() {
  const [screen, setScreen] = React.useState("menu"); // menu | hud | inventory | loot | settings | death
  const [hordeActive, setHordeActive] = React.useState(false);
  const [hasSave, setHasSave] = React.useState(!!window.GameBridge.state.hasSave);
  const [fatalError, setFatalError] = React.useState(null);

  // Apply the distress CSS variables once
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--distress",   DISTRESS.distress);
    r.style.setProperty("--bloodlevel", DISTRESS.bloodlevel);
    r.style.setProperty("--cyanlevel",  DISTRESS.cyanlevel);
    r.style.setProperty("--scanlines",  DISTRESS.scanlines);
  }, []);

  // Game events from the Three.js bridge
  React.useEffect(() => {
    const onDeath = () => setScreen("death");
    const onState = (s) => {
      setHordeActive(!!s.hordeActive);
      setHasSave(!!s.hasSave);
      // Opening a loot crate is event-like — react when lootOpen flips on.
      if (s.lootOpen) {
        setScreen(prev => prev === "loot" ? prev : "loot");
      }
    };
    const onFatal = (info) => setFatalError(info?.reason || 'Unknown fatal error');
    window.GameBridge.on("death", onDeath);
    window.GameBridge.on("state", onState);
    window.GameBridge.on("fatalError", onFatal);
    return () => {
      window.GameBridge.off("death", onDeath);
      window.GameBridge.off("state", onState);
      window.GameBridge.off("fatalError", onFatal);
    };
  }, []);

  function handleStart() {
    // Latched state, not an event — survives if main.js is still loading.
    window.GameBridge.setState({ started: true });
    setScreen("hud");
  }
  function handleLoad() {
    window.GameBridge.emit("loadGame");
    setScreen("hud");
  }
  function handleRespawn() {
    window.GameBridge.emit("respawn");
    setScreen("hud");
  }

  // Exit pointer lock when leaving the "hud" screen (inventory, settings, etc.)
  React.useEffect(() => {
    if (screen !== "hud" && screen !== "menu" && screen !== "death") {
      if (document.pointerLockElement) document.exitPointerLock();
    }
    // Mirror lock state to the game module for touch (no pointer lock there).
    if (window.IS_TOUCH) {
      window.GameBridge.emit("uiOverlay", screen !== "hud");
    }
  }, [screen]);

  // Keyboard: I = inventory, ESC = pause / resume
  React.useEffect(() => {
    const handler = (e) => {
      if (screen === "menu" || screen === "death") return;
      const k = e.key.toLowerCase();
      if (k === "i") {
        e.preventDefault();
        setScreen(s => s === "inventory" ? "hud" : s === "hud" ? "inventory" : s);
      } else if (k === "escape") {
        e.preventDefault();
        setScreen(s => {
          if (s === "loot") { window.GameBridge.emit("loot:close"); return "hud"; }
          if (s === "settings" || s === "inventory") return "hud";
          if (s === "hud") return "settings";
          return s;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen]);

  const inGame = screen !== "menu" && screen !== "death";

  if (fatalError) return <FatalErrorScreen message={fatalError} />;

  return (
    <>
      {/* CSS voxel scene behind the menu / death screens; in-game the
          Three.js canvas is the world. */}
      {!inGame && <VoxelBG />}

      {/* HUD overlays the live game under any pause/inventory screen */}
      {inGame && (
        <HUD
          showMinimap={true}
          hordeAlert={hordeActive}
          onOpenInventory={() => setScreen("inventory")}
          onOpenSettings={() => setScreen("settings")}
          onDie={() => setScreen("death")}
        />
      )}

      {/* TopBar: INV / PAUSE buttons — touch only, replaces I and ESC. */}
      {inGame && window.IS_TOUCH && screen === "hud" && (
        <div style={{
          position: "fixed", top: 16, right: 16,
          display: "flex", gap: 10,
          pointerEvents: "auto",
          zIndex: 700,
        }}>
          <TopBarButton label="INV" onPress={() => setScreen("inventory")} />
          <TopBarButton label="⏸" onPress={() => setScreen("settings")} />
        </div>
      )}

      {screen === "menu" && <MainMenu onStart={handleStart} onLoad={handleLoad} hasSave={hasSave} />}

      {screen === "inventory" && <Inventory onClose={() => setScreen("hud")} />}

      {screen === "loot" && <Loot onClose={() => setScreen("hud")} />}

      {screen === "settings" && (
        <Settings onResume={() => setScreen("hud")} onMenu={() => setScreen("menu")} />
      )}

      {screen === "death" && (
        <DeathScreen onRespawn={handleRespawn} onMenu={() => setScreen("menu")} />
      )}

      {/* Always-on CRT chrome */}
      <div className="vignette" />
      <div className="noise" />
      <div className="crt" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary><App /></ErrorBoundary>
);
