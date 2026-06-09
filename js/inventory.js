// js/inventory.js — Inventory model. Pure logic, no Three.js/React (unit-testable).
import { getItem } from './items.js';

export const HOTBAR_SIZE = 8;
export const INV_SIZE = 40;          // 8 hotbar (0-7) + 32 storage (8-39)

// A slot is null or { id, count, durability? }.

export class Inventory {
  constructor(size = INV_SIZE) {
    this.size = size;
    this.slots = new Array(size).fill(null);
  }

  _maxStack(id) {
    const it = getItem(id);
    return it ? it.stack : 1;
  }

  // Add `count` of `id`. Returns the leftover that did not fit.
  add(id, count = 1) {
    const it = getItem(id);
    if (!it || count <= 0) return count;
    const max = it.stack;
    let rem = count;
    // Top up existing stacks first (stackable items only).
    if (max > 1) {
      for (let i = 0; i < this.size && rem > 0; i++) {
        const s = this.slots[i];
        if (s && s.id === id && s.count < max) {
          const moved = Math.min(max - s.count, rem);
          s.count += moved;
          rem -= moved;
        }
      }
    }
    // Then fill empty slots with new stacks.
    for (let i = 0; i < this.size && rem > 0; i++) {
      if (!this.slots[i]) {
        const moved = Math.min(max, rem);
        const slot = { id, count: moved };
        if (it.durability) slot.durability = it.durability;
        this.slots[i] = slot;
        rem -= moved;
      }
    }
    return rem;
  }

  // Remove up to `count` from slot `idx`. Returns the amount actually removed.
  removeAt(idx, count = 1) {
    const s = this.slots[idx];
    if (!s || count <= 0) return 0;
    const removed = Math.min(s.count, count);
    s.count -= removed;
    if (s.count <= 0) this.slots[idx] = null;
    return removed;
  }

  count(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.count;
    return n;
  }

  findFirst(id) {
    return this.slots.findIndex(s => s && s.id === id);
  }

  firstEmpty() {
    return this.slots.findIndex(s => s === null);
  }

  // Move / merge / swap the stack at `from` into `to`.
  move(from, to) {
    if (from === to) return;
    if (from < 0 || to < 0 || from >= this.size || to >= this.size) return;
    const a = this.slots[from];
    if (!a) return;
    const b = this.slots[to];
    if (!b) { this.slots[to] = a; this.slots[from] = null; return; }
    // Merge into a same-id stackable slot.
    if (b.id === a.id && b.durability === undefined && a.durability === undefined) {
      const max = this._maxStack(a.id);
      const moved = Math.min(max - b.count, a.count);
      b.count += moved;
      a.count -= moved;
      if (a.count <= 0) this.slots[from] = null;
      return;
    }
    // Otherwise swap.
    this.slots[from] = b;
    this.slots[to] = a;
  }

  // Split the stack at `idx`, moving half into the first empty slot.
  splitToEmpty(idx) {
    const s = this.slots[idx];
    if (!s || s.count < 2 || s.durability !== undefined) return;
    const e = this.firstEmpty();
    if (e < 0) return;
    const half = Math.floor(s.count / 2);
    s.count -= half;
    this.slots[e] = { id: s.id, count: half };
  }

  serialize() {
    return this.slots.map(s => (s ? { ...s } : null));
  }

  deserialize(data) {
    this.slots = new Array(this.size).fill(null);
    if (Array.isArray(data)) {
      for (let i = 0; i < Math.min(this.size, data.length); i++) {
        this.slots[i] = data[i] ? { ...data[i] } : null;
      }
    }
  }
}
