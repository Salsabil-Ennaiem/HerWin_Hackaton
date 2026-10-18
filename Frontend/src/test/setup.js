import "@testing-library/jest-dom/vitest";

// Recharts (ResponsiveContainer) a besoin de ResizeObserver, absent de jsdom
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  sessionStorage.clear();
});