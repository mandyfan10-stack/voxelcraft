// js/touch.js — Thin ES-module wrapper around the globals set by ui/touch.jsx.
//
// ui/touch.js (compiled from ui/touch.jsx) loads as a classic <script> before
// js/main.js's deferred ES-module imports run, so by the time this module
// evaluates, window.IS_TOUCH and window.MobileInput are already initialised.

export const IS_TOUCH = typeof window !== 'undefined' && !!window.IS_TOUCH;
