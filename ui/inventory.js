// inventory.jsx — Full-screen inventory overlay. Worn metal locker, riveted panels, stencil text.

function Inventory({
  onClose
}) {
  const [selected, setSelected] = React.useState({
    row: 0,
    col: 0
  });
  const [hovered, setHovered] = React.useState(null);

  // 6 rows × 9 columns inventory grid
  const ITEMS = {
    "0-0": {
      kind: "dirt",
      count: 64,
      name: "DIRT BLOCK"
    },
    "0-1": {
      kind: "dirt",
      count: 64,
      name: "DIRT BLOCK"
    },
    "0-2": {
      kind: "stone",
      count: 47,
      name: "STONE BLOCK"
    },
    "0-3": {
      kind: "stone",
      count: 64,
      name: "STONE BLOCK"
    },
    "0-5": {
      kind: "wood",
      count: 32,
      name: "OAK PLANK"
    },
    "0-6": {
      kind: "wood",
      count: 16,
      name: "OAK PLANK"
    },
    "0-8": {
      kind: "metal",
      count: 8,
      name: "SCRAP IRON"
    },
    "1-0": {
      kind: "leaves",
      count: 22,
      name: "WITHERED LEAVES"
    },
    "1-2": {
      kind: "bone",
      count: 4,
      name: "MARROW SHARD"
    },
    "1-4": {
      kind: "glass",
      count: 12,
      name: "SHATTERED GLASS"
    },
    "1-5": {
      kind: "flesh",
      count: 2,
      name: "RAW FLESH",
      cursed: true
    },
    "1-7": {
      kind: "metal",
      count: 3,
      name: "RUSTED NAILS"
    },
    "2-1": {
      kind: "stone",
      count: 9,
      name: "FLINT"
    },
    "2-3": {
      kind: "wood",
      count: 1,
      name: "ROTTEN PLANK"
    },
    "3-0": {
      kind: "bone",
      count: 1,
      name: "FEMUR (HUMAN?)",
      cursed: true
    }
  };
  const sel = ITEMS[`${selected.row}-${selected.col}`];
  const showInfo = hovered ? ITEMS[hovered] : sel;

  // 5 quick-crafting recipes
  const RECIPES = [{
    name: "WOODEN PICKAXE",
    needs: [{
      k: "wood",
      n: 3
    }, {
      k: "stone",
      n: 2
    }],
    craftable: true,
    out: "wood"
  }, {
    name: "STONE AXE",
    needs: [{
      k: "wood",
      n: 2
    }, {
      k: "stone",
      n: 3
    }],
    craftable: true,
    out: "stone"
  }, {
    name: "IRON BLADE",
    needs: [{
      k: "metal",
      n: 4
    }, {
      k: "wood",
      n: 1
    }],
    craftable: true,
    out: "metal"
  }, {
    name: "BONE TOTEM",
    needs: [{
      k: "bone",
      n: 4
    }, {
      k: "flesh",
      n: 1
    }],
    craftable: true,
    out: "bone",
    cursed: true
  }, {
    name: "GLASS LANTERN",
    needs: [{
      k: "glass",
      n: 6
    }, {
      k: "metal",
      n: 2
    }],
    craftable: false,
    out: "glass"
  }];

  // Equipment slots (left)
  const EQUIP = [{
    slot: "HEAD",
    kind: null,
    label: "HELM"
  }, {
    slot: "TORSO",
    kind: "metal",
    label: "RUSTED VEST",
    dura: 0.34
  }, {
    slot: "HAND",
    kind: "wood",
    label: "BONE PICK",
    dura: 0.62
  }, {
    slot: "LEGS",
    kind: null,
    label: "GREAVES"
  }, {
    slot: "FEET",
    kind: "leaves",
    label: "WRAPPED BOOTS",
    dura: 0.18
  }];
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "03 Inventory",
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(5,3,2,0.85)",
      backdropFilter: "blur(3px)",
      display: "grid",
      gridTemplateColumns: "320px 1fr 340px",
      gap: 16,
      padding: 40,
      pointerEvents: "auto"
    },
    onClick: e => {
      if (e.target === e.currentTarget) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel metal",
    style: {
      padding: 28,
      position: "relative",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(Rivets, null), /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 4
    }
  }, "// SURVIVOR"), /*#__PURE__*/React.createElement("div", {
    className: "stencil",
    style: {
      fontSize: 22,
      marginBottom: 2
    }
  }, "UNNAMED SUBJECT"), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.15em",
      marginBottom: 18
    }
  }, "ID #047 \u2591 DAY 06 \u2591 HARDCORE"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)",
      border: "1px dashed var(--steel-2)",
      position: "relative",
      margin: "0 0 18px",
      minHeight: 280,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: "linear-gradient(to right, rgba(0,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,255,0.06) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      opacity: 0.6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      background: "linear-gradient(180deg, #6b665a 0%, #3a3630 100%)",
      border: "1px solid #1a1814"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 110,
      background: "linear-gradient(180deg, #4a4640 0%, #1c1814 100%)",
      border: "1px solid #0a0908",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: "20% 30%",
      background: "rgba(0,0,0,0.6)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "splatter",
    style: {
      inset: 0,
      opacity: 0.4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 90,
      background: "linear-gradient(180deg, #3a3630 0%, #14110d 100%)",
      border: "1px solid #0a0908"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 90,
      background: "linear-gradient(180deg, #3a3630 0%, #14110d 100%)",
      border: "1px solid #0a0908"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      position: "absolute",
      left: 8,
      bottom: 8,
      fontSize: 9,
      letterSpacing: "0.15em"
    }
  }, "CAM_03 / VITALS_OK"), /*#__PURE__*/React.createElement("div", {
    className: "mono cyan",
    style: {
      position: "absolute",
      right: 8,
      top: 8,
      fontSize: 9,
      letterSpacing: "0.15em"
    }
  }, "\u25B2 REC")), /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      marginBottom: 8
    }
  }, "// EQUIPMENT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, EQUIP.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.slot,
    style: {
      display: "grid",
      gridTemplateColumns: "44px 60px 1fr",
      alignItems: "center",
      gap: 10,
      padding: "6px 8px",
      background: "rgba(10,9,8,0.6)",
      border: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid var(--steel-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, e.kind ? /*#__PURE__*/React.createElement(VoxelBlock, {
    kind: e.kind,
    size: 26
  }) : /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 9
    }
  }, "\u2014")), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.15em"
    }
  }, e.slot), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      color: e.kind ? "var(--bone)" : "var(--bone-dim)",
      letterSpacing: "0.05em"
    }
  }, e.label), e.dura !== undefined && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: "#0a0908",
      marginTop: 3,
      border: "1px solid var(--steel-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: e.dura * 100 + "%",
      background: e.dura < 0.25 ? "var(--blood)" : e.dura < 0.5 ? "#cc8800" : "var(--olive)"
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "panel metal",
    style: {
      padding: 24,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(Rivets, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      color: "var(--blood)",
      marginBottom: 2
    }
  }, "// CACHE"), /*#__PURE__*/React.createElement("div", {
    className: "stencil",
    style: {
      fontSize: 28
    }
  }, "INVENTORY")), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.15em",
      textAlign: "right"
    }
  }, "15 / 54 SLOTS", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "cyan"
  }, "WEIGHT 12.4 / 30 KG"))), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em",
      marginBottom: 6
    }
  }, "\u2591 HOTBAR (KEYS 1-8) \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(9, 1fr)",
      gap: 4,
      padding: 6,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid var(--steel-2)",
      marginBottom: 14
    }
  }, Array.from({
    length: 9
  }).map((_, i) => {
    const item = ITEMS["0-" + i];
    const isSel = selected.row === 0 && selected.col === i;
    return /*#__PURE__*/React.createElement(InvSlot, {
      key: i,
      item: item,
      slotId: `0-${i}`,
      isSel: isSel,
      onClick: () => setSelected({
        row: 0,
        col: i
      }),
      onHover: setHovered,
      hotbarLabel: i + 1
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.2em",
      marginBottom: 6
    }
  }, "\u2591 STORAGE \u2591"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(9, 1fr)",
      gap: 4,
      padding: 6,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid var(--steel-2)"
    }
  }, Array.from({
    length: 45
  }).map((_, idx) => {
    const row = Math.floor(idx / 9) + 1;
    const col = idx % 9;
    const item = ITEMS[`${row}-${col}`];
    const isSel = selected.row === row && selected.col === col;
    return /*#__PURE__*/React.createElement(InvSlot, {
      key: idx,
      item: item,
      slotId: `${row}-${col}`,
      isSel: isSel,
      onClick: () => setSelected({
        row,
        col
      }),
      onHover: setHovered
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.18em",
      marginTop: 14,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "DRAG"), " MOVE   ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "SHIFT+CLICK"), " SPLIT   ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "RMB"), " DROP"), /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, "// HOLD ", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "Q"), " TO TRASH"))), /*#__PURE__*/React.createElement("div", {
    className: "panel metal",
    style: {
      padding: 24,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Rivets, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      marginBottom: 6
    }
  }, "// ITEM"), showInfo ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid var(--steel-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(VoxelBlock, {
    kind: showInfo.kind,
    size: 48
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 18,
      color: showInfo.cursed ? "var(--blood)" : "var(--bone)",
      letterSpacing: "0.08em"
    }
  }, showInfo.name), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      marginTop: 2
    }
  }, "\xD7", showInfo.count, showInfo.cursed && /*#__PURE__*/React.createElement("span", {
    className: "blood",
    style: {
      marginLeft: 8
    }
  }, "\u25B2 CURSED")))), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      lineHeight: 1.5,
      letterSpacing: "0.02em"
    }
  }, showInfo.cursed ? "// Decayed organic matter. Slowly drains hunger. Required for ritual crafting." : "// Stable building material. Mineable with bare hands or pickaxe.")) : /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 11,
      padding: "20px 0",
      letterSpacing: "0.05em"
    }
  }, "[ NO ITEM SELECTED ]", /*#__PURE__*/React.createElement("br", null), "[ HOVER OR CLICK A SLOT ]")), /*#__PURE__*/React.createElement("div", {
    className: "div-ascii"
  }, "\u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tag",
    style: {
      marginBottom: 8,
      color: "var(--cyan)"
    }
  }, "// QUICK CRAFT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, RECIPES.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "44px 1fr auto",
      gap: 10,
      alignItems: "center",
      padding: 8,
      background: "rgba(10,9,8,0.6)",
      border: "1px solid " + (r.craftable ? "var(--steel-2)" : "rgba(60,60,60,0.4)"),
      opacity: r.craftable ? 1 : 0.45,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid var(--steel-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(VoxelBlock, {
    kind: r.out,
    size: 26
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      color: r.cursed ? "var(--blood)" : "var(--bone)",
      letterSpacing: "0.08em",
      fontWeight: 600
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    className: "mono dim",
    style: {
      fontSize: 10,
      letterSpacing: "0.1em",
      marginTop: 2
    }
  }, r.needs.map((n, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      marginRight: 8
    }
  }, n.k.toUpperCase(), "\xD7", n.n)))), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    style: {
      padding: "6px 10px",
      fontSize: 10,
      cursor: r.craftable ? "crosshair" : "not-allowed",
      ...(r.craftable ? {} : {
        color: "var(--bone-dim)"
      })
    }
  }, r.craftable ? "CRAFT" : "LOCKED"))))), /*#__PURE__*/React.createElement("button", {
    className: "btn danger",
    onClick: onClose,
    style: {
      padding: "12px",
      fontSize: 12
    }
  }, "\u25B6 CLOSE [ I ]")));
}
function InvSlot({
  item,
  isSel,
  slotId,
  onClick,
  onHover,
  hotbarLabel
}) {
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => onHover(slotId),
    onMouseLeave: () => onHover(null),
    onClick: onClick,
    style: {
      width: "100%",
      aspectRatio: "1 / 1",
      background: "rgba(20,17,13,0.85)",
      border: isSel ? "2px solid var(--cyan)" : "1px solid var(--steel-2)",
      boxShadow: isSel ? "inset 0 0 0 1px rgba(0,255,255,0.3), 0 0 16px rgba(0,255,255, calc(0.5 * var(--cyanlevel)))" : "inset 0 1px 0 rgba(216,210,196,0.04)",
      position: "relative",
      cursor: "crosshair",
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, item ? /*#__PURE__*/React.createElement(VoxelBlock, {
    kind: item.kind,
    size: 38
  }) : null, item && /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      position: "absolute",
      right: 3,
      bottom: 1,
      fontSize: 10,
      color: "var(--bone)",
      textShadow: "1px 1px 0 #000, -1px -1px 0 #000"
    }
  }, item.count), item?.cursed && /*#__PURE__*/React.createElement("div", {
    className: "mono blood",
    style: {
      position: "absolute",
      left: 3,
      bottom: 1,
      fontSize: 8
    }
  }, "\u25B2"), hotbarLabel && /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      position: "absolute",
      left: 3,
      top: 1,
      fontSize: 9,
      color: isSel ? "var(--cyan)" : "var(--bone-dim)"
    }
  }, hotbarLabel));
}
function Rivets() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "rivet",
    style: {
      left: 8,
      top: 8
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "rivet",
    style: {
      right: 8,
      top: 8
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "rivet",
    style: {
      left: 8,
      bottom: 8
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "rivet",
    style: {
      right: 8,
      bottom: 8
    }
  }));
}
window.Inventory = Inventory;