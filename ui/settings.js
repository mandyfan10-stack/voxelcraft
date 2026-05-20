// settings.jsx — In-game pause / settings overlay. Technical readout style.

function Settings({
  onResume,
  onMenu
}) {
  const [tab, setTab] = React.useState("GRAPHICS");
  const [fov, setFov] = React.useState(78);
  const [renderDist, setRenderDist] = React.useState(8);
  const [resolution, setResolution] = React.useState("1920×1080");
  const [shadows, setShadows] = React.useState("HIGH");
  const [master, setMaster] = React.useState(72);
  const [ambience, setAmbience] = React.useState(85);
  const [sfx, setSfx] = React.useState(60);
  const [music, setMusic] = React.useState(40);
  const [difficulty, setDifficulty] = React.useState("HARD");
  const [friendlyFire, setFriendlyFire] = React.useState(false);
  const [autoSave, setAutoSave] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "05 Settings",
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(5,3,2,0.85)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto"
    },
    onClick: e => {
      if (e.target === e.currentTarget) onResume();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel metal",
    style: {
      width: 920,
      height: 600,
      padding: 0,
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Rivets, null), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,0,0,0.55)",
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 18,
      borderRight: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 4
    }
  }, "// PAUSED"), /*#__PURE__*/React.createElement("div", {
    className: "stencil",
    style: {
      fontSize: 22
    }
  }, "SYSTEM"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 9,
      letterSpacing: "0.18em",
      marginTop: 2
    }
  }, "\u2591 WORLD FROZEN \u2591")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, ["GRAPHICS", "AUDIO", "GAMEPLAY", "CONTROLS"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      appearance: "none",
      border: "none",
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
      textShadow: tab === t ? "0 0 8px rgba(204,34,0,0.4)" : "none"
    }
  }, tab === t ? "▶ " : "  ", t))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: onResume,
    style: {
      padding: "12px",
      fontSize: 13
    }
  }, "\u25B6 RESUME"), /*#__PURE__*/React.createElement("button", {
    className: "btn danger",
    onClick: onMenu,
    style: {
      padding: "10px",
      fontSize: 11
    }
  }, "QUIT TO MENU"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 9,
      letterSpacing: "0.18em",
      textAlign: "center",
      marginTop: 4
    }
  }, "\u2591 AUTOSAVE ENABLED \u2591"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 36,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      marginBottom: 4
    }
  }, "// TAB / ", tab), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 32,
      marginBottom: 24,
      letterSpacing: "0.1em"
    }
  }, tab), tab === "GRAPHICS" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "FIELD OF VIEW",
    value: fov,
    min: 60,
    max: 120,
    unit: "\xB0",
    onChange: setFov
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "RENDER DISTANCE",
    value: renderDist,
    min: 2,
    max: 16,
    unit: " CHUNKS",
    onChange: setRenderDist
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "RESOLUTION",
    value: resolution,
    options: ["1280×720", "1920×1080", "2560×1440", "3840×2160"],
    onChange: setResolution
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "SHADOW QUALITY",
    value: shadows,
    options: ["OFF", "LOW", "MED", "HIGH"],
    onChange: setShadows
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "MOTION BLUR",
    value: "OFF",
    options: ["OFF", "LIGHT", "HEAVY"],
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "CRT FILTER",
    value: "ON",
    options: ["OFF", "ON"],
    onChange: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.18em",
      marginTop: 8,
      padding: "8px 12px",
      borderLeft: "2px solid var(--cyan)",
      background: "rgba(0,255,255,0.05)"
    }
  }, "\u2591 GPU: ", /*#__PURE__*/React.createElement("span", {
    className: "cyan"
  }, "RUSTED-9000 / 2.4GB"), " \u2591 FPS: ", /*#__PURE__*/React.createElement("span", {
    className: "cyan"
  }, "47"), " \u2591")), tab === "AUDIO" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "MASTER VOLUME",
    value: master,
    min: 0,
    max: 100,
    unit: "%",
    onChange: v => {
      setMaster(v);
      window.GameBridge.emit("audio:master", v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "AMBIENT HORROR",
    value: ambience,
    min: 0,
    max: 100,
    unit: "%",
    onChange: v => {
      setAmbience(v);
      window.GameBridge.emit("audio:ambient", v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "SFX",
    value: sfx,
    min: 0,
    max: 100,
    unit: "%",
    onChange: v => {
      setSfx(v);
      window.GameBridge.emit("audio:sfx", v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "MUSIC",
    value: music,
    min: 0,
    max: 100,
    unit: "%",
    onChange: v => {
      setMusic(v);
      window.GameBridge.emit("audio:music", v);
    }
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "CREATURE VOICES",
    value: "ON",
    options: ["OFF", "MUTED", "ON"],
    onChange: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.18em",
      marginTop: 8,
      padding: "8px 12px",
      borderLeft: "2px solid var(--blood)",
      background: "rgba(204,34,0,0.05)"
    }
  }, "\u26A0 AMBIENT HORROR ABOVE 80% MAY INCREASE PARANOIA EVENTS")), tab === "GAMEPLAY" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(RadioRow, {
    label: "DIFFICULTY",
    value: difficulty,
    options: ["NORMAL", "HARD", "HARDCORE"],
    onChange: setDifficulty
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "FRIENDLY FIRE",
    value: friendlyFire,
    onChange: setFriendlyFire
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "AUTO-SAVE",
    value: autoSave,
    onChange: setAutoSave
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "SHOW DAMAGE NUMBERS",
    value: true,
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "MOTION SICKNESS REDUCTION",
    value: false,
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(RadioRow, {
    label: "HORDE FREQUENCY",
    value: "EVERY 5 DAYS",
    options: ["EVERY 3 DAYS", "EVERY 5 DAYS", "EVERY 7 DAYS"],
    onChange: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.18em",
      marginTop: 8,
      padding: "8px 12px",
      borderLeft: "2px solid var(--rust)",
      background: "rgba(107,59,31,0.1)"
    }
  }, "\u2591 CHANGES APPLY AFTER NEXT DAY-CYCLE \u2591")), tab === "CONTROLS" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, [["MOVE FORWARD", "W"], ["MOVE BACK", "S"], ["STRAFE LEFT / RIGHT", "A / D"], ["JUMP", "SPACE"], ["SPRINT", "SHIFT"], ["MINE BLOCK", "LMB"], ["PLACE BLOCK", "RMB"], ["INVENTORY", "I"], ["MAP TOGGLE", "M"], ["PAUSE", "ESC"], ["INTERACT", "E"], ["DROP ITEM", "Q"], ["CROUCH", "CTRL"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      padding: "8px 12px",
      background: "rgba(10,9,8,0.5)",
      border: "1px solid var(--steel-2)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.12em"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "kbd",
    style: {
      fontSize: 11,
      padding: "3px 10px"
    }
  }, v)))))));
}
function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange
}) {
  const pct = (value - min) / (max - min) * 100;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.15em"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "mono cyan",
    style: {
      fontSize: 12,
      fontVariantNumeric: "tabular-nums"
    }
  }, value, unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 22,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      height: 6,
      transform: "translateY(-50%)",
      background: "#0a0908",
      border: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: pct + "%",
      background: "linear-gradient(90deg, var(--blood-deep) 0%, var(--blood) 100%)",
      boxShadow: "0 0 8px rgba(204,34,0,0.4)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    value: value,
    onChange: e => onChange(Number(e.target.value)),
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      opacity: 0,
      cursor: "crosshair"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: `calc(${pct}% - 6px)`,
      top: "50%",
      width: 12,
      height: 18,
      background: "var(--bone)",
      transform: "translateY(-50%)",
      border: "1px solid #0a0908",
      boxShadow: "0 0 8px rgba(0,255,255, calc(0.6 * var(--cyanlevel)))",
      pointerEvents: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 9,
      letterSpacing: "0.1em",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, min), /*#__PURE__*/React.createElement("span", null, max)));
}
function RadioRow({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.15em",
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      gap: 4
    }
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    onClick: () => onChange(o),
    className: "btn",
    style: {
      padding: "8px 4px",
      fontSize: 11,
      letterSpacing: "0.1em",
      ...(value === o ? {
        color: "var(--cyan)",
        borderColor: "var(--cyan)",
        background: "linear-gradient(180deg, #0a1c1e 0%, #050d0e 100%)",
        boxShadow: "inset 0 0 0 1px rgba(0,255,255,0.4), 0 0 12px rgba(0,255,255,0.3)"
      } : {})
    }
  }, o))));
}
function ToggleRow({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 70px",
      alignItems: "center",
      padding: "10px 12px",
      background: "rgba(10,9,8,0.5)",
      border: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.15em"
    }
  }, label), /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange(!value),
    className: "btn",
    style: {
      padding: "6px 0",
      fontSize: 11,
      letterSpacing: "0.15em",
      ...(value ? {
        color: "var(--cyan)",
        borderColor: "var(--cyan)",
        background: "linear-gradient(180deg, #0a1c1e 0%, #050d0e 100%)",
        boxShadow: "inset 0 0 0 1px rgba(0,255,255,0.4)"
      } : {
        color: "var(--bone-dim)"
      })
    }
  }, value ? "ON" : "OFF"));
}
window.Settings = Settings;