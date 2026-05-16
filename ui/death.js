// death.jsx — Full-screen death overlay. Blood-stained, fading edges, run stats.

function DeathScreen({
  onRespawn,
  onMenu
}) {
  const stats = {
    cause: "TROLL",
    method: "MAULED",
    survived: "06D : 23H : 12M",
    blocksPlaced: 1247,
    blocksMined: 8912,
    kills: 47,
    deaths: 3,
    location: "X -2,847 / Y +064 / Z +1,203"
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "04 Death",
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "auto",
      background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,4,2,0.85) 0%, rgba(2,1,1,0.98) 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      left: "5%",
      top: "10%",
      width: 500,
      height: 500,
      opacity: 0.45
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      right: "8%",
      top: "20%",
      width: 380,
      height: 380,
      opacity: 0.35,
      transform: "rotate(140deg)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      left: "30%",
      bottom: "5%",
      width: 420,
      height: 420,
      opacity: 0.4,
      transform: "rotate(-60deg)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      right: "10%",
      bottom: "8%",
      width: 340,
      height: 340,
      opacity: 0.5,
      transform: "rotate(220deg)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 90%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at center, rgba(204,34,0,0.12) 0%, transparent 70%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "1fr 320px 1fr",
      gap: 60,
      alignItems: "center",
      maxWidth: 1400,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 12,
      letterSpacing: "0.3em"
    }
  }, "\u2591 SIGNAL LOST \u2591"), /*#__PURE__*/React.createElement("h1", {
    className: "display flicker",
    style: {
      fontSize: 120,
      margin: 0,
      color: "var(--blood)",
      letterSpacing: "0.08em",
      textShadow: "0 0 32px rgba(204,34,0,0.7), 3px 0 0 rgba(0,0,0,0.8)",
      lineHeight: 0.9,
      fontWeight: 900
    }
  }, "YOU", /*#__PURE__*/React.createElement("br", null), "DIED"), /*#__PURE__*/React.createElement("div", {
    className: "div-ascii",
    style: {
      marginTop: 14,
      color: "var(--rust)"
    }
  }, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 12,
      marginTop: 12,
      letterSpacing: "0.18em"
    }
  }, "CAUSE OF DEATH"), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 32,
      color: "var(--bone)",
      marginTop: 4,
      letterSpacing: "0.12em",
      textShadow: "0 0 12px rgba(204,34,0,0.5)"
    }
  }, stats.method, " BY ", stats.cause), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      marginTop: 6,
      letterSpacing: "0.12em"
    }
  }, "\u2591 NIGHT 06 \u2591 21:47 LOCAL \u2591")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      background: "rgba(10,4,2,0.85)",
      border: "2px solid var(--blood-deep)",
      boxShadow: "inset 0 0 40px rgba(204,34,0,0.2), 0 0 60px rgba(0,0,0,0.9), 0 0 80px rgba(204,34,0,0.15)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 10,
      textAlign: "center"
    }
  }, "\u2591 ASSAILANT \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      margin: "8px 0 16px"
    }
  }, /*#__PURE__*/React.createElement(CreatureSilhouette, {
    kind: "troll",
    size: 240,
    className: "pulse",
    bleeding: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 24,
      color: "var(--bone)",
      textAlign: "center",
      letterSpacing: "0.15em"
    }
  }, "FAT TROLL"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      textAlign: "center",
      marginTop: 4,
      letterSpacing: "0.12em"
    }
  }, "\"GRINNING ONE\" \u2591 THREAT TIER 04"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      color: "var(--rust)",
      textAlign: "center",
      marginTop: 10,
      lineHeight: 1.6,
      letterSpacing: "0.03em",
      fontStyle: "italic"
    }
  }, "// Encounter +47m N of base.", /*#__PURE__*/React.createElement("br", null), "// It saw you first.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      marginBottom: 12,
      letterSpacing: "0.3em"
    }
  }, "\u2591 RUN RECORD \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(StatRow, {
    label: "TIME SURVIVED",
    value: stats.survived,
    highlight: true
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "BLOCKS MINED",
    value: stats.blocksMined.toLocaleString()
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "BLOCKS PLACED",
    value: stats.blocksPlaced.toLocaleString()
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "HOSTILES KILLED",
    value: stats.kills
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "DEATHS THIS RUN",
    value: stats.deaths,
    blood: true
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "LAST LOCATION",
    value: stats.location,
    small: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "div-ascii",
    style: {
      marginTop: 14,
      color: "var(--rust)"
    }
  }, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em",
      marginTop: 10
    }
  }, "BEST RUN: 12D / 18H / 04M", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blood)"
    }
  }, "\u25BA THIS RUN: SHORTER")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      gap: 20,
      marginTop: 60,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: onRespawn,
    style: {
      padding: "20px 40px",
      fontSize: 18
    }
  }, "\u25B6 RESPAWN AT BEDROLL"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onMenu,
    style: {
      padding: "20px 40px",
      fontSize: 14
    }
  }, "\u25C0 RETURN TO MENU")), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.25em",
      marginTop: 18,
      position: "relative"
    }
  }, "\u2591 HARDCORE MODE: RESPAWN AVAILABLE \u2014 INVENTORY LOST \u2591"));
}
function StatRow({
  label,
  value,
  highlight,
  blood,
  small
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "160px 1fr",
      gap: 14,
      alignItems: "baseline",
      padding: "6px 12px",
      background: "rgba(10,4,2,0.7)",
      borderLeft: `2px solid ${highlight ? "var(--cyan)" : blood ? "var(--blood)" : "var(--steel-2)"}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.15em"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: small ? 11 : 16,
      color: highlight ? "var(--cyan)" : blood ? "var(--blood)" : "var(--bone)",
      textShadow: highlight ? "0 0 8px rgba(0,255,255,0.5)" : blood ? "0 0 6px rgba(204,34,0,0.5)" : "none",
      letterSpacing: small ? "0.08em" : "0.05em",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 600
    }
  }, value));
}
window.DeathScreen = DeathScreen;