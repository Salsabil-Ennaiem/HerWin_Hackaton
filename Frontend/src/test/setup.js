import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("react-media-recorder", () => ({
  useReactMediaRecorder: () => ({
    status: "idle",
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    mediaBlobUrl: null,
    clearBlobUrl: vi.fn(),
    error: null,
  }),
}));

// Recharts (ResponsiveContainer) a besoin de ResizeObserver, absent de jsdom
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.Worker = class {
  constructor() {}
  postMessage() {}
  terminate() {}
};

beforeEach(() => {
  sessionStorage.clear();
});