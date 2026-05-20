// app.jsx — Game shell. Routes between menu / hud / inventory / loot / settings / death,
// and shows a fatal-error screen if the game module emits one or the UI tree throws.

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }
  render() {
    if (this.state.error) {
      return /*#__PURE__*/React.createElement(FatalErrorScreen, {
        message: 'UI crashed: ' + (this.state.error.message || this.state.error)
      });
    }
    return this.props.children;
  }
}
function FatalErrorScreen({
  message
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(5,3,2,0.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      zIndex: 9999,
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel metal",
    style: {
      padding: 32,
      maxWidth: 540,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 8
    }
  }, "// FATAL ERROR"), /*#__PURE__*/React.createElement("div", {
    className: "stencil",
    style: {
      fontSize: 28,
      marginBottom: 16
    }
  }, "SIGNAL LOST"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 12,
      lineHeight: 1.6,
      color: "var(--bone)"
    }
  }, message), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => location.reload(),
    style: {
      marginTop: 24,
      padding: "12px 24px",
      fontSize: 14
    }
  }, "\u25B6 RELOAD")));
}

// Distress / CRT look — applied once to the document.
const DISTRESS = {
  distress: 0.25,
  // grain/distress intensity — was 1
  bloodlevel: 0.35,
  // blood vignette tint
  cyanlevel: 0.5,
  // cyan glow on elements
  scanlines: 0.12 // scanline opacity — was 0.5, main visibility killer
};
function App() {
  const [screen, setScreen] = React.useState("menu"); // menu | hud | inventory | loot | settings | death
  const [hordeActive, setHordeActive] = React.useState(false);
  const [hasSave, setHasSave] = React.useState(!!window.GameBridge.state.hasSave);
  const [fatalError, setFatalError] = React.useState(null);

  // Apply the distress CSS variables once
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--distress", DISTRESS.distress);
    r.style.setProperty("--bloodlevel", DISTRESS.bloodlevel);
    r.style.setProperty("--cyanlevel", DISTRESS.cyanlevel);
    r.style.setProperty("--scanlines", DISTRESS.scanlines);
  }, []);

  // Game events from the Three.js bridge
  React.useEffect(() => {
    const onDeath = () => setScreen("death");
    const onState = s => {
      setHordeActive(!!s.hordeActive);
      setHasSave(!!s.hasSave);
      // Opening a loot crate is event-like — react when lootOpen flips on.
      if (s.lootOpen) {
        setScreen(prev => prev === "loot" ? prev : "loot");
      }
    };
    const onFatal = info => setFatalError(info?.reason || 'Unknown fatal error');
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
    window.GameBridge.setState({
      started: true
    });
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
  }, [screen]);

  // Keyboard: I = inventory, ESC = pause / resume
  React.useEffect(() => {
    const handler = e => {
      if (screen === "menu" || screen === "death") return;
      const k = e.key.toLowerCase();
      if (k === "i") {
        e.preventDefault();
        setScreen(s => s === "inventory" ? "hud" : s === "hud" ? "inventory" : s);
      } else if (k === "escape") {
        e.preventDefault();
        setScreen(s => {
          if (s === "loot") {
            window.GameBridge.emit("loot:close");
            return "hud";
          }
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
  if (fatalError) return /*#__PURE__*/React.createElement(FatalErrorScreen, {
    message: fatalError
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, !inGame && /*#__PURE__*/React.createElement(VoxelBG, null), inGame && /*#__PURE__*/React.createElement(HUD, {
    showMinimap: true,
    hordeAlert: hordeActive,
    onOpenInventory: () => setScreen("inventory"),
    onOpenSettings: () => setScreen("settings"),
    onDie: () => setScreen("death")
  }), screen === "menu" && /*#__PURE__*/React.createElement(MainMenu, {
    onStart: handleStart,
    onLoad: handleLoad,
    hasSave: hasSave
  }), screen === "inventory" && /*#__PURE__*/React.createElement(Inventory, {
    onClose: () => setScreen("hud")
  }), screen === "loot" && /*#__PURE__*/React.createElement(Loot, {
    onClose: () => setScreen("hud")
  }), screen === "settings" && /*#__PURE__*/React.createElement(Settings, {
    onResume: () => setScreen("hud"),
    onMenu: () => setScreen("menu")
  }), screen === "death" && /*#__PURE__*/React.createElement(DeathScreen, {
    onRespawn: handleRespawn,
    onMenu: () => setScreen("menu")
  }), /*#__PURE__*/React.createElement("div", {
    className: "vignette"
  }), /*#__PURE__*/React.createElement("div", {
    className: "noise"
  }), /*#__PURE__*/React.createElement("div", {
    className: "crt"
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));