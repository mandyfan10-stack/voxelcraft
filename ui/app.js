// app.jsx — Game shell. Routes between menu / hud / inventory / settings / death.

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
  const [screen, setScreen] = React.useState("menu"); // menu | hud | inventory | settings | death
  const [hordeActive, setHordeActive] = React.useState(false);

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
    const onState = s => setHordeActive(!!s.hordeActive);
    window.GameBridge.on("death", onDeath);
    window.GameBridge.on("state", onState);
    return () => {
      window.GameBridge.off("death", onDeath);
      window.GameBridge.off("state", onState);
    };
  }, []);
  function handleStart() {
    // Latched state, not an event — survives if main.js is still loading.
    window.GameBridge.setState({
      started: true
    });
    setScreen("hud");
  }
  function handleRespawn() {
    window.GameBridge.emit("respawn");
    setScreen("hud");
  }

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
        setScreen(s => s === "settings" || s === "inventory" ? "hud" : s === "hud" ? "settings" : s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen]);
  const inGame = screen !== "menu" && screen !== "death";
  return /*#__PURE__*/React.createElement(React.Fragment, null, !inGame && /*#__PURE__*/React.createElement(VoxelBG, null), inGame && /*#__PURE__*/React.createElement(HUD, {
    showMinimap: true,
    hordeAlert: hordeActive,
    onOpenInventory: () => setScreen("inventory"),
    onOpenSettings: () => setScreen("settings"),
    onDie: () => setScreen("death")
  }), screen === "menu" && /*#__PURE__*/React.createElement(MainMenu, {
    onStart: handleStart
  }), screen === "inventory" && /*#__PURE__*/React.createElement(Inventory, {
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
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));