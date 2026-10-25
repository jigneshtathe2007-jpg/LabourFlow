const isLocalPreview =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port !== "3000");

export const API_ORIGIN = isLocalPreview ? "http://localhost:3000" : "";
export const API_BASE = `${API_ORIGIN}/api`;
