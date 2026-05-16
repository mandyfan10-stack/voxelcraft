function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// voxel-bg.jsx — first-person CSS voxel world running behind the prototype.
// Pure CSS 3D: a tilted block floor receding to horizon, a few standing structures,
// fog gradient, dim moon, drifting sway.

const VOXEL_BG_CSS = `
.vx-stage {
  position: absolute; inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 80% 40% at 50% 28%, #1a2014 0%, #0a0f06 50%, #050302 100%),
    linear-gradient(180deg, #0a0c08 0%, #050302 70%, #000 100%);
  perspective: 800px;
  perspective-origin: 50% 45%;
}
.vx-moon {
  position: absolute; left: 70%; top: 12%;
  width: 90px; height: 90px;
  background: radial-gradient(circle at 35% 35%, #4a3a28 0%, #2a1f14 60%, transparent 100%);
  border-radius: 50%;
  opacity: 0.55;
  filter: blur(0.5px);
  box-shadow: 0 0 80px rgba(204,80,40,0.15);
}
.vx-fog {
  position: absolute; left: 0; right: 0; top: 35%; height: 35%;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(20,16,12,0.5) 30%,
    rgba(10,9,8,0.85) 70%,
    rgba(5,3,2,1) 100%);
  pointer-events: none;
}
.vx-floor {
  position: absolute;
  left: 50%; bottom: -50%;
  width: 2400px; height: 1600px;
  transform: translateX(-50%) rotateX(72deg);
  transform-origin: 50% 0%;
  background-image:
    linear-gradient(to right, rgba(0,0,0,0.6) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.6) 1px, transparent 1px),
    /* dirt blotches */
    radial-gradient(circle at 20% 30%, rgba(60,40,20,0.5) 0%, transparent 8%),
    radial-gradient(circle at 65% 55%, rgba(40,30,15,0.6) 0%, transparent 12%),
    radial-gradient(circle at 80% 80%, rgba(50,35,20,0.5) 0%, transparent 10%),
    radial-gradient(circle at 30% 70%, rgba(35,28,15,0.7) 0%, transparent 14%),
    /* base */
    linear-gradient(180deg, #2a1f14 0%, #1a1208 40%, #100905 100%);
  background-size: 80px 80px, 80px 80px, auto, auto, auto, auto, auto;
}

/* structure: a chunky voxel cube sitting on the floor */
.vx-struct {
  position: absolute;
  transform-style: preserve-3d;
}
.vx-struct .face {
  position: absolute;
  border: 1px solid rgba(0,0,0,0.7);
  box-shadow: inset 0 0 0 1px rgba(60,40,20,0.3);
}
.vx-struct .top    { background: linear-gradient(135deg, #3a2818 0%, #1f1408 100%); }
.vx-struct .front  { background: linear-gradient(180deg, #2a1c10 0%, #14090a 100%); }
.vx-struct .side   { background: linear-gradient(180deg, #1a1208 0%, #0a0604 100%); }

/* a pile of debris / craggy block silhouettes near foreground */
.vx-shadow {
  position: absolute;
  background: radial-gradient(ellipse 60% 30% at 50% 100%, rgba(0,0,0,0.85) 0%, transparent 70%);
}

.vx-rain {
  position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(90deg,
      transparent 0, transparent 3px,
      rgba(180,180,200,0.02) 3px, rgba(180,180,200,0.02) 4px);
  opacity: 0.4;
  animation: vxRain 0.8s linear infinite;
}
@keyframes vxRain {
  0% { background-position: 0 0; }
  100% { background-position: -4px 12px; }
}

.vx-sway {
  animation: vxSway 18s ease-in-out infinite;
}
@keyframes vxSway {
  0%, 100% { transform: translate(0,0); }
  50% { transform: translate(-6px, 3px); }
}

/* Crosshair */
.vx-crosshair {
  position: absolute; left: 50%; top: 50%;
  width: 22px; height: 22px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.vx-crosshair::before,
.vx-crosshair::after {
  content: ""; position: absolute;
  background: rgba(216,210,196,0.6);
  box-shadow: 0 0 4px rgba(0,0,0,0.8);
}
.vx-crosshair::before {
  left: 50%; top: 0; width: 2px; height: 100%;
  transform: translateX(-50%);
}
.vx-crosshair::after {
  left: 0; top: 50%; width: 100%; height: 2px;
  transform: translateY(-50%);
}

/* Hand / pickaxe placeholder in lower-right */
.vx-hand {
  position: absolute;
  right: -40px; bottom: -40px;
  width: 380px; height: 380px;
  transform: rotate(-18deg);
  transform-origin: center;
  pointer-events: none;
}
.vx-hand .pick-handle {
  position: absolute;
  right: 80px; bottom: 0;
  width: 28px; height: 280px;
  background: linear-gradient(90deg, #3a2818 0%, #6b4828 30%, #3a2818 60%, #1f1408 100%);
  border: 1px solid #1a0e05;
  transform: rotate(15deg);
}
.vx-hand .pick-head {
  position: absolute;
  right: 30px; top: 30px;
  width: 140px; height: 60px;
  background: linear-gradient(180deg, #4a4640 0%, #2a2620 50%, #1a1814 100%);
  border: 1px solid #0a0908;
  clip-path: polygon(0 30%, 30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%);
}
@keyframes vxBob {
  0%, 100% { transform: rotate(-18deg) translateY(0); }
  50% { transform: rotate(-17deg) translateY(-8px); }
}
.vx-hand { animation: vxBob 4.5s ease-in-out infinite; }
`;
function VoxelBG({
  paused = false
}) {
  React.useEffect(() => {
    if (!document.getElementById("vx-bg-css")) {
      const s = document.createElement("style");
      s.id = "vx-bg-css";
      s.textContent = VOXEL_BG_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Structures: positioned absolutely on the floor (in pre-perspective space we fake with size + position)
  const structures = [{
    left: 18,
    bottom: 24,
    w: 80,
    h: 80,
    depth: 80,
    opacity: 0.85
  }, {
    left: 70,
    bottom: 28,
    w: 60,
    h: 110,
    depth: 60,
    opacity: 0.78
  }, {
    left: 38,
    bottom: 18,
    w: 50,
    h: 50,
    depth: 50,
    opacity: 0.7
  }, {
    left: 52,
    bottom: 14,
    w: 35,
    h: 35,
    depth: 35,
    opacity: 0.55
  }, {
    left: 85,
    bottom: 16,
    w: 40,
    h: 60,
    depth: 40,
    opacity: 0.55
  }, {
    left: 8,
    bottom: 14,
    w: 30,
    h: 30,
    depth: 30,
    opacity: 0.5
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "vx-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "vx-moon"
  }), /*#__PURE__*/React.createElement("div", {
    className: "vx-sway",
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "vx-floor"
  }), structures.map((s, i) => /*#__PURE__*/React.createElement(VxBlock, _extends({
    key: i
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "vx-fog"
  }), /*#__PURE__*/React.createElement("div", {
    className: "vx-rain"
  }), /*#__PURE__*/React.createElement("div", {
    className: "vx-crosshair"
  }), /*#__PURE__*/React.createElement("div", {
    className: "vx-hand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pick-handle"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pick-head"
  })));
}
function VxBlock({
  left,
  bottom,
  w,
  h,
  depth,
  opacity
}) {
  // Fake an isometric-ish block silhouette using stacked divs
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: left + "%",
      bottom: bottom + "%",
      width: w + "px",
      height: h + "px",
      opacity
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: -depth * 0.4,
      width: w,
      height: depth * 0.4,
      background: "linear-gradient(135deg, #3a2818 0%, #1a1208 100%)",
      transform: "skewX(-30deg)",
      transformOrigin: "bottom left",
      borderTop: "1px solid #4a3018",
      borderLeft: "1px solid #4a3018"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: w,
      top: -depth * 0.4,
      width: depth * 0.3,
      height: h + depth * 0.4,
      background: "linear-gradient(180deg, #14090a 0%, #08040a 100%)",
      transform: "skewY(-30deg)",
      transformOrigin: "top left",
      borderRight: "1px solid #1a0e05"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #2a1c10 0%, #14090a 100%)",
      borderLeft: "1px solid #1a0e05",
      borderRight: "1px solid #08040a",
      borderTop: "1px solid #3a2818"
    }
  }));
}
window.VoxelBG = VoxelBG;