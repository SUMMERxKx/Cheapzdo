import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { handleBoardLogin } from "./server/board-login";

function boardLogin(password: string | undefined): Plugin {
  const middleware = (server: { middlewares: import('vite').Connect.Server }) => {
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0] !== '/api/board-login') return next();
      void handleBoardLogin(request, response, password);
    });
  };
  return {
    name: 'private-board-login',
    configureServer: middleware,
    configurePreviewServer: middleware,
  };
}

export default defineConfig(({ mode }) => {
  const password = process.env.BOARD_PASSWORD ?? loadEnv(mode, process.cwd(), 'BOARD_PASSWORD').BOARD_PASSWORD;
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), boardLogin(password), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
