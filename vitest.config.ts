import { defineConfig } from "vitest/config";
import path from "path";

// Vitest runs pure logic and light component tests. jsdom gives us a DOM for
// the component tests we add from phase 5 onward.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
