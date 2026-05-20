// ui/touch.jsx — On-screen joystick + action buttons for touch devices.
// Globals (loaded via <script> tag): React, window.MobileInput.
//
// Detection + input struct are initialised at load time so React's first
// render (which happens BEFORE the deferred js/main.js module runs) already
// sees the correct flag.

if (typeof window !== "undefined" && window.IS_TOUCH === undefined) {
  window.IS_TOUCH = "ontouchstart" in window || typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  window.MobileInput = window.MobileInput || {
    mx: 0,
    mz: 0,
    jump: 0,
    mine: 0,
    placeTick: 0,
    interactTick: 0
  };
}
function Joystick() {
  const baseRef = React.useRef(null);
  const stickRef = React.useRef(null);
  const stateRef = React.useRef({
    activeTouch: null,
    cx: 0,
    cy: 0,
    dx: 0,
    dy: 0
  });
  const [, force] = React.useReducer(x => x + 1, 0);
  const RADIUS = 56;
  const DEAD_ZONE = 0.12;
  function reset() {
    const s = stateRef.current;
    s.activeTouch = null;
    s.dx = 0;
    s.dy = 0;
    window.MobileInput.mx = 0;
    window.MobileInput.mz = 0;
    force();
  }
  function findTouch(touchList, id) {
    for (let i = 0; i < touchList.length; i++) if (touchList[i].identifier === id) return touchList[i];
    return null;
  }
  function onStart(e) {
    e.preventDefault();
    const s = stateRef.current;
    if (s.activeTouch !== null) return;
    const t = e.changedTouches[0];
    s.activeTouch = t.identifier;
    s.cx = t.clientX;
    s.cy = t.clientY;
    s.dx = 0;
    s.dy = 0;
    force();
  }
  function onMove(e) {
    e.preventDefault();
    const s = stateRef.current;
    if (s.activeTouch === null) return;
    const t = findTouch(e.changedTouches, s.activeTouch);
    if (!t) return;
    let dx = t.clientX - s.cx;
    let dy = t.clientY - s.cy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = dx / d * RADIUS;
      dy = dy / d * RADIUS;
    }
    s.dx = dx;
    s.dy = dy;
    let nx = dx / RADIUS,
      ny = dy / RADIUS;
    if (Math.abs(nx) < DEAD_ZONE) nx = 0;
    if (Math.abs(ny) < DEAD_ZONE) ny = 0;
    window.MobileInput.mx = nx;
    window.MobileInput.mz = ny;
    force();
  }
  function onEnd(e) {
    const s = stateRef.current;
    if (s.activeTouch === null) return;
    const t = findTouch(e.changedTouches, s.activeTouch);
    if (!t) return;
    e.preventDefault();
    reset();
  }
  const s = stateRef.current;
  return /*#__PURE__*/React.createElement("div", {
    ref: baseRef,
    onTouchStart: onStart,
    onTouchMove: onMove,
    onTouchEnd: onEnd,
    onTouchCancel: onEnd,
    style: {
      position: "fixed",
      left: 28,
      bottom: 120,
      width: RADIUS * 2 + 24,
      height: RADIUS * 2 + 24,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(20,17,13,0.55) 0%, rgba(10,9,8,0.85) 100%)",
      border: "1px solid var(--steel-2)",
      boxShadow: "inset 0 1px 0 rgba(216,210,196,0.06), 0 4px 16px rgba(0,0,0,0.7)",
      pointerEvents: "auto",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      zIndex: 600
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: stickRef,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 56,
      height: 56,
      marginLeft: -28,
      marginTop: -28,
      transform: `translate(${s.dx}px, ${s.dy}px)`,
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, var(--bone) 0%, var(--bone-dim) 60%, var(--steel) 100%)",
      border: "1px solid var(--ink)",
      boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,255,255, calc(0.3 * var(--cyanlevel)))",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      position: "absolute",
      bottom: -16,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 9,
      letterSpacing: "0.2em",
      pointerEvents: "none"
    }
  }, "MOVE"));
}
function ActionButton({
  label,
  kind,
  color,
  big,
  hold,
  onTick,
  style
}) {
  const activeRef = React.useRef(null);
  const [pressed, setPressed] = React.useState(false);
  function onStart(e) {
    e.preventDefault();
    if (activeRef.current !== null) return;
    const t = e.changedTouches[0];
    activeRef.current = t.identifier;
    setPressed(true);
    if (hold && kind) window.MobileInput[kind] = 1;
    if (!hold && onTick) onTick();
  }
  function onEnd(e) {
    if (activeRef.current === null) return;
    let matched = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeRef.current) {
        matched = true;
        break;
      }
    }
    if (!matched) return;
    e.preventDefault();
    activeRef.current = null;
    setPressed(false);
    if (hold && kind) window.MobileInput[kind] = 0;
  }
  const size = big ? 76 : 60;
  return /*#__PURE__*/React.createElement("button", {
    onTouchStart: onStart,
    onTouchEnd: onEnd,
    onTouchCancel: onEnd,
    onClick: e => {
      e.preventDefault(); /* tap fallback for non-touch */
    },
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      appearance: "none",
      border: `2px solid ${pressed ? "var(--cyan)" : color || "var(--steel-2)"}`,
      background: pressed ? `radial-gradient(circle at 30% 30%, ${color || "var(--olive)"} 0%, ${color || "var(--olive-deep)"} 100%)` : "radial-gradient(circle at 30% 30%, rgba(43,40,35,0.92) 0%, rgba(10,9,8,0.95) 100%)",
      color: "var(--bone)",
      fontFamily: "var(--display)",
      fontSize: big ? 13 : 11,
      fontWeight: 800,
      letterSpacing: "0.12em",
      textShadow: "0 1px 0 rgba(0,0,0,0.8)",
      boxShadow: pressed ? `inset 0 0 0 1px rgba(0,255,255,0.4), 0 0 16px rgba(0,255,255,0.4)` : "inset 0 1px 0 rgba(216,210,196,0.08), 0 4px 12px rgba(0,0,0,0.7)",
      pointerEvents: "auto",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTapHighlightColor: "transparent",
      cursor: "crosshair",
      padding: 0,
      ...style
    }
  }, label);
}
window.Joystick = Joystick;
window.ActionButton = ActionButton;