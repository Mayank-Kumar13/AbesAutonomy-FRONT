import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Resolve proxy target:
  // 1. Explicit VITE_PROXY_TARGET (e.g. http://localhost:5000 if running a local backend)
  // 2. Extracted origin from VITE_API_URL (e.g. https://api.abes.work)
  // 3. Fallback to production API at https://api.abes.work
  let proxyTarget = env.VITE_PROXY_TARGET
  if (!proxyTarget && env.VITE_API_URL && env.VITE_API_URL.startsWith('http')) {
    try {
      proxyTarget = new URL(env.VITE_API_URL).origin
    } catch {
      proxyTarget = 'https://api.abes.work'
    }
  }
  if (!proxyTarget) {
    proxyTarget = 'https://api.abes.work'
  }

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'TURNSTILE_'],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.warn(`[vite proxy error] ${req.method} ${req.url}: ${err.message}`);
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy connection failed', message: err.message }));
              }
            });
          },
        },
      },
    },
  }
})
