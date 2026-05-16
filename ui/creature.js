// creature.jsx — Abstract voxel creature silhouettes, pure CSS grid.
// Each creature is a 14×14 grid of blocks. 'X' = body, 'F' = face/skin, 'E' = eye,
// 'M' = mouth, 'T' = tooth, '.' = empty.

const CREATURE_PALETTES = {
  troll: {
    body: "#4a6b2a",
    bodyShade: "#2a3d18",
    face: "#a89274",
    faceShade: "#6b5a44",
    eye: "#d8d2c4",
    eyeDot: "#0a0908",
    mouth: "#3d2110",
    tooth: "#d8d2c4"
  },
  brute: {
    body: "#6b3b1f",
    bodyShade: "#3d2110",
    face: "#8a6a4c",
    faceShade: "#4a3424",
    eye: "#cc2200",
    eyeDot: "#0a0908",
    mouth: "#0a0908",
    tooth: "#a89274"
  },
  husk: {
    body: "#8a8473",
    bodyShade: "#4a4640",
    face: "#a89274",
    faceShade: "#5a4838",
    eye: "#00ffff",
    eyeDot: "#0a0908",
    mouth: "#1c1814",
    tooth: "#d8d2c4"
  },
  fleshball: {
    body: "#d8b0a0",
    bodyShade: "#8a5a48",
    face: "#d8a890",
    faceShade: "#6b4838",
    eye: "#d8d2c4",
    eyeDot: "#0a0908",
    mouth: "#cc2200",
    tooth: "#d8d2c4"
  }
};

// 14×14 patterns
const CREATURE_PATTERNS = {
  // Fat bulbous troll, large grin, embedded human-ish face
  troll: ["..............", "....XXXX......", "...XFFFFX.....", "..XFFFFFFX....", "..XFEEFFEEX...",
  // eyes
  "..XFFFFFFFX...", "..XFFMMMMFX...",
  // mouth
  "..XFMTMTMMX...",
  // teeth
  ".XXFFFFFFXXX..", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX", ".XXXXXXXXXXXX.", "..XX......XX.."],
  // Brute — taller, more menacing, broader shoulders
  brute: ["..............", "...XX.....XX..", "..XFFXXXXXFX..", "..XFFFEEFFFX..", "..XXFFFFFFXX..", "..XXFMMMMFXX..", ".XXXXFFFFXXXX.", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX", "XXXX.XXXX.XXXX", ".XX...XX...XX.", ".XX...XX...XX.", ".XX...XX...XX."],
  // Husk — gaunt, skeletal, glowing eyes
  husk: ["...XXXX.......", "..XFFFFX......", "..XFEEFX......", "..XFFFFX......", "..XFMMFX......", "...XXXX.......", "..XXXXXX......", ".XXX..XXX.....", ".XX....XX.....", ".XX....XX.....", ".XX....XX.....", "..XX..XX......", "...X..X.......", "..XX..XX......"],
  // Fleshball — round, just a face on meat
  fleshball: ["..............", "....XXXXXX....", "..XXFFFFFFXX..", ".XFFFFFFFFFFX.", ".XFFEEFFEEFFX.", ".XFFFFFFFFFFX.", ".XFFFMMMMFFFX.", ".XFFMTTTMMFFX.", ".XXFFFFFFFFXX.", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX", ".XXXXXXXXXXXX.", "..XXXXXXXXXX..", "...XX....XX..."]
};
function CreatureSilhouette({
  kind = "troll",
  size = 140,
  shake = false,
  bleeding = false,
  glow = null,
  // override glow color (defaults to blood)
  className = "",
  style = {}
}) {
  const pattern = CREATURE_PATTERNS[kind] || CREATURE_PATTERNS.troll;
  const palette = CREATURE_PALETTES[kind] || CREATURE_PALETTES.troll;
  const rows = pattern.length;
  const cols = pattern[0].length;
  const cell = size / cols;
  const colorMap = {
    X: palette.body,
    F: palette.face,
    E: palette.eye,
    M: palette.mouth,
    T: palette.tooth
  };
  const shadeMap = {
    X: palette.bodyShade,
    F: palette.faceShade,
    E: palette.eyeDot,
    M: "#000",
    T: palette.faceShade
  };
  const glowColor = glow ?? "rgba(204,34,0,0.45)";
  return /*#__PURE__*/React.createElement("div", {
    className: "creature " + className + (shake ? " shake" : ""),
    style: {
      width: size,
      height: size / cols * rows,
      position: "relative",
      filter: `drop-shadow(0 0 ${size / 8}px ${glowColor})`,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
      gridTemplateRows: `repeat(${rows}, ${cell}px)`,
      width: cols * cell,
      height: rows * cell
    }
  }, pattern.flatMap((row, ri) => row.split("").map((ch, ci) => {
    if (ch === ".") return /*#__PURE__*/React.createElement("div", {
      key: ri + "-" + ci
    });
    // simulate top-light shading: top edge brighter, bottom darker
    const base = colorMap[ch] || palette.body;
    const shade = shadeMap[ch] || palette.bodyShade;
    // randomize a hair of distress per block — deterministic from indices
    const seed = (ri * 31 + ci * 17) % 7;
    const distressOffset = seed === 0 ? -8 : seed === 1 ? 4 : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: ri + "-" + ci,
      style: {
        background: `linear-gradient(180deg, ${base} 0%, ${shade} 100%)`,
        boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.5)`,
        transform: distressOffset ? `translateY(${distressOffset * 0.05}px)` : undefined,
        // eye pupils — black dot center
        ...(ch === "E" ? {
          background: `radial-gradient(circle at 50% 50%, ${shadeMap.E} 0%, ${shadeMap.E} 35%, ${base} 38%, ${base} 100%)`
        } : {}),
        ...(ch === "T" ? {
          background: `linear-gradient(180deg, ${base} 0%, ${shade} 100%)`
        } : {})
      }
    });
  }))), bleeding && /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      position: "absolute",
      left: -size * 0.2,
      top: size * 0.4,
      width: size * 1.4,
      height: size * 1.4
    }
  }));
}
const CREATURE_CSS = `
@keyframes creatureShake {
  0%, 100% { transform: translate(0,0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, 2px); }
  80% { transform: translate(1px, -1px); }
}
.creature.shake { animation: creatureShake 0.18s steps(2) infinite; }

@keyframes creaturePulse {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(204,34,0,0.4)); }
  50% { filter: drop-shadow(0 0 24px rgba(204,34,0,0.7)); }
}
.creature.pulse { animation: creaturePulse 1.4s ease-in-out infinite; }
`;
if (!document.getElementById("creature-css")) {
  const s = document.createElement("style");
  s.id = "creature-css";
  s.textContent = CREATURE_CSS;
  document.head.appendChild(s);
}

// Small voxel block icon (for hotbar)
function VoxelBlock({
  kind = "dirt",
  size = 44,
  selected = false
}) {
  const palettes = {
    dirt: {
      top: "#6b4828",
      side: "#3a2818",
      front: "#4a3018",
      flecks: "#2a1808"
    },
    stone: {
      top: "#6a6a68",
      side: "#3a3a38",
      front: "#4a4a48",
      flecks: "#2a2a28"
    },
    wood: {
      top: "#8a6a4c",
      side: "#3d2110",
      front: "#5a3a20",
      flecks: "#1a0e05"
    },
    metal: {
      top: "#a8a496",
      side: "#4a4640",
      front: "#6b6660",
      flecks: "#2a2620"
    },
    flesh: {
      top: "#a87060",
      side: "#5a2820",
      front: "#6b3424",
      flecks: "#3a1810"
    },
    leaves: {
      top: "#5a8a35",
      side: "#1a3d10",
      front: "#2a4d18",
      flecks: "#0a1d05"
    },
    glass: {
      top: "rgba(0,255,255,0.25)",
      side: "rgba(0,180,180,0.2)",
      front: "rgba(0,255,255,0.18)",
      flecks: "rgba(0,255,255,0.4)"
    },
    bone: {
      top: "#d8d2c4",
      side: "#6b665a",
      front: "#a89274",
      flecks: "#3a3630"
    }
  };
  const p = palettes[kind] || palettes.dirt;
  const s = size;
  const depth = s * 0.32;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: s,
      height: s,
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: s,
      height: depth,
      background: p.top,
      transform: "skewX(-30deg)",
      transformOrigin: "bottom left",
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.4)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: depth - 1,
      width: s - depth * 0.5,
      height: s - depth,
      background: `linear-gradient(180deg, ${p.front} 0%, ${p.side} 100%)`,
      boxShadow: `inset 1px 0 0 rgba(255,255,255,0.06), inset -1px -1px 0 rgba(0,0,0,0.5)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 0,
      top: depth - 1,
      width: depth * 0.5,
      height: s - depth,
      background: p.side,
      transform: "skewY(-30deg)",
      transformOrigin: "top left",
      boxShadow: `inset -1px 0 0 rgba(0,0,0,0.6)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: `radial-gradient(circle at 20% 30%, ${p.flecks} 1px, transparent 2px),
                          radial-gradient(circle at 70% 60%, ${p.flecks} 1px, transparent 2px),
                          radial-gradient(circle at 45% 80%, ${p.flecks} 1px, transparent 2px)`,
      opacity: 0.7
    }
  }), selected && /*#__PURE__*/React.createElement("div", {
    className: "selected-outline",
    style: {
      position: "absolute",
      inset: -2
    }
  }));
}
Object.assign(window, {
  CreatureSilhouette,
  VoxelBlock
});