import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Synthetic Data Generation ---
  
  // Simulated metrics storage
  const metricsHistory: any[] = [];
  const MAX_HISTORY = 50;

  setInterval(() => {
    const timestamp = Date.now();
    const cpuValue = 20 + Math.random() * 40 + (Math.sin(timestamp / 10000) * 10);
    const memValue = 60 + Math.random() * 15;
    const reqValue = Math.floor(200 + Math.random() * 300);
    
    metricsHistory.push({
      time: new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp,
      cpu: parseFloat(cpuValue.toFixed(2)),
      memory: parseFloat(memValue.toFixed(2)),
      requests: reqValue
    });

    if (metricsHistory.length > MAX_HISTORY) {
      metricsHistory.shift();
    }
  }, 2000);

  // Simulated logs
  const logLevels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const services = ['auth-svc', 'payment-gateway', 'user-api', 'worker-01', 'ingress-nginx'];
  const messages = [
    'Connection established to database',
    'User login successful',
    'Timeout while waiting for response',
    'HEARTBEAT check passed',
    'Cache miss for key: user_profile_123',
    'Request processed in 45ms',
    'Failed to validate JWT token',
    'Scaling up replica set: monitoring-worker'
  ];

  const generateLog = () => {
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      id: Math.random().toString(36).substring(7)
    };
  };

  // --- API Routes ---

  app.get("/api/metrics", (req, res) => {
    res.json(metricsHistory);
  });

  app.get("/api/logs", (req, res) => {
    const count = parseInt(req.query.count as string) || 10;
    const logs = Array.from({ length: count }, generateLog);
    res.json(logs);
  });

  app.get("/api/status", (req, res) => {
    res.json({
      status: "healthy",
      uptime: process.uptime(),
      version: "1.0.0-PROMETHEUS-SIM"
    });
  });

  // --- Vite / Static Files ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 NetWise Server running at http://localhost:${PORT}`);
  });
}

startServer();
