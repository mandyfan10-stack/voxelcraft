// app.jsx — Prototype router. Keys + on-screen quick nav.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "distress": 1,
  "bloodlevel": 0.75,
  "cyanlevel": 0.6,
  "scanlines": 0.5,
  "horde": false,
  "minimap": true,
  "showAnnotations": false
} /*EDITMODE-END*/;
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState("menu"); // menu | hud | inventory | settings | death

  // Listen for death events from Three.js game
  React.useEffect(() => {
    const handler = () => setScreen("death");
    window.GameBridge.on('death', handler);
    return () => window.GameBridge.off('death', handler);
  }, []);
  function handleStart() {
    window.GameBridge.emit('start');
    setScreen("hud");
  }
  function handleRespawn() {
    window.GameBridge.emit('respawn');
    setScreen("hud");
  }

  // Apply tweak CSS variables
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--distress", t.distress);
    r.style.setProperty("--bloodlevel", t.bloodlevel);
    r.style.setProperty("--cyanlevel", t.cyanlevel);
    r.style.setProperty("--scanlines", t.scanlines);
  }, [t.distress, t.bloodlevel, t.cyanlevel, t.scanlines]);

  // Keyboard nav
  React.useEffect(() => {
    const handler = e => {
      const k = e.key.toLowerCase();
      if (screen === "menu" || screen === "death") {
        if (k === "enter") {
          if (screen === "menu") setScreen("hud");else setScreen("hud");
        }
        return;
      }
      if (k === "i") {
        e.preventDefault();
        setScreen(s => s === "inventory" ? "hud" : "inventory");
      } else if (k === "escape") {
        e.preventDefault();
        setScreen(s => s === "settings" ? "hud" : s === "hud" ? "settings" : s);
      } else if (k === "\\") {
        e.preventDefault();
        setScreen("death");
      } else if (k === "m") {
        e.preventDefault();
        setTweak("minimap", !t.minimap);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, t.minimap]);
  const inGame = screen !== "menu" && screen !== "death";
  return /*#__PURE__*/React.createElement(React.Fragment, null, !inGame && /*#__PURE__*/React.createElement(VoxelBG, null), screen !== "menu" && screen !== "death" && /*#__PURE__*/React.createElement(HUD, {
    showMinimap: t.minimap,
    hordeAlert: t.horde,
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
  }), /*#__PURE__*/React.createElement(QuickNav, {
    screen: screen,
    setScreen: setScreen
  }), t.showAnnotations && /*#__PURE__*/React.createElement(Annotations, {
    screen: screen
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Tweaks"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Distress"
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Overall distress",
    value: t.distress,
    min: 0,
    max: 2,
    step: 0.05,
    onChange: v => setTweak("distress", v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Scanlines",
    value: t.scanlines,
    min: 0,
    max: 1,
    step: 0.05,
    onChange: v => setTweak("scanlines", v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Blood intensity",
    value: t.bloodlevel,
    min: 0,
    max: 1.5,
    step: 0.05,
    onChange: v => setTweak("bloodlevel", v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Cyan glow",
    value: t.cyanlevel,
    min: 0,
    max: 1.2,
    step: 0.05,
    onChange: v => setTweak("cyanlevel", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Gameplay state"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Horde alert active",
    value: t.horde,
    onChange: v => setTweak("horde", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Show minimap",
    value: t.minimap,
    onChange: v => setTweak("minimap", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Designer"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Show annotations",
    value: t.showAnnotations,
    onChange: v => setTweak("showAnnotations", v)
  })));
}
function QuickNav({
  screen,
  setScreen
}) {
  const items = [{
    id: "menu",
    label: "MENU",
    key: ""
  }, {
    id: "hud",
    label: "HUD",
    key: ""
  }, {
    id: "inventory",
    label: "INVENTORY",
    key: "I"
  }, {
    id: "settings",
    label: "PAUSE",
    key: "ESC"
  }, {
    id: "death",
    label: "DEATH",
    key: "\\"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: "50%",
      top: 8,
      transform: "translateX(-50%)",
      zIndex: 9100,
      display: "flex",
      gap: 1,
      padding: 3,
      background: "rgba(5,3,2,0.85)",
      border: "1px solid var(--steel-2)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.8)"
    }
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => setScreen(it.id),
    style: {
      appearance: "none",
      border: "none",
      background: screen === it.id ? "rgba(204,34,0,0.2)" : "transparent",
      color: screen === it.id ? "var(--blood)" : "var(--bone-dim)",
      fontFamily: "var(--display)",
      fontWeight: 700,
      letterSpacing: "0.18em",
      fontSize: 11,
      padding: "8px 14px",
      cursor: "crosshair",
      textShadow: screen === it.id ? "0 0 6px rgba(204,34,0,0.5)" : "none"
    }
  }, it.label, it.key && /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 8,
      marginLeft: 6,
      letterSpacing: "0.1em"
    }
  }, "[", it.key, "]"))));
}
function Annotations({
  screen
}) {
  const notes = {
    menu: [{
      x: "20%",
      y: "20%",
      text: "Distressed dual-shadow title: blood + cyan offset evokes CRT misalignment + visceral horror."
    }, {
      x: "20%",
      y: "75%",
      text: "Ticking countdown to Blood Moon = persistent dread. The clock literally tells you when you die."
    }, {
      x: "75%",
      y: "30%",
      text: "Cyan = active state across all UI. Riveted metal panel separates 'menu' from 'world'."
    }, {
      x: "75%",
      y: "70%",
      text: "Hardcore copy turns red — a verbal warning that survives any volume of UI noise."
    }],
    hud: [{
      x: "20%",
      y: "20%",
      text: "Vitals stacked top-left, single-column. HP/STA/HGR labels left-aligned for quick scan."
    }, {
      x: "78%",
      y: "20%",
      text: "Day strip = 7 ticks. Day 7 flickers red — your fate is a UI element."
    }, {
      x: "50%",
      y: "92%",
      text: "Hotbar dead-center, monospaced count and slot index. Cyan ring on the active slot."
    }, {
      x: "78%",
      y: "65%",
      text: "Radar uses muted olive grid (calm) with red blips (threat). Sweep arm is the one cyan flourish — alive UI."
    }],
    inventory: [{
      x: "20%",
      y: "25%",
      text: "Worn-metal locker aesthetic: rivets in every corner, stencil 'INVENTORY' fades like spray-paint."
    }, {
      x: "50%",
      y: "30%",
      text: "Hotbar broken out at top of grid — visually identical, contextually anchored."
    }, {
      x: "80%",
      y: "40%",
      text: "Cursed items show a red ▲ in the corner + red name. Hover and click both populate the info card."
    }, {
      x: "80%",
      y: "75%",
      text: "Recipes show ingredients inline; locked ones desaturate. CRAFT button never moves."
    }],
    settings: [{
      x: "20%",
      y: "35%",
      text: "Tab strip is left-anchored with a red accent bar — different visual logic from the cyan in-game UI, signaling 'this is meta'."
    }, {
      x: "65%",
      y: "30%",
      text: "Sliders show min/max ticks, current value in cyan with telemetry feel."
    }, {
      x: "65%",
      y: "75%",
      text: "Footnote cards (cyan/red/rust border) inform user about real consequences of a setting."
    }],
    death: [{
      x: "20%",
      y: "30%",
      text: "YOU DIED at 120pt, red, flickers. Dual-shadow break gives the type a wound."
    }, {
      x: "50%",
      y: "50%",
      text: "The creature that killed you is shown at scale, pulsing — confronts you with what won."
    }, {
      x: "78%",
      y: "45%",
      text: "Stats list uses cyan for headline (time survived), red for losses (deaths), rust for everything else."
    }]
  };
  const arr = notes[screen] || [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 8500
    }
  }, arr.map((n, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: "absolute",
      left: n.x,
      top: n.y,
      maxWidth: 280,
      background: "rgba(0,255,255,0.06)",
      border: "1px solid rgba(0,255,255,0.4)",
      padding: "8px 12px",
      color: "var(--cyan)",
      fontFamily: "var(--mono)",
      fontSize: 10,
      letterSpacing: "0.05em",
      lineHeight: 1.5,
      boxShadow: "0 0 16px rgba(0,255,255,0.15)",
      backdropFilter: "blur(4px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      letterSpacing: "0.2em",
      marginBottom: 4,
      fontSize: 9
    }
  }, "\u2591 NOTE ", String(i + 1).padStart(2, "0"), " \u2591"), n.text)));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));