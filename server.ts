import express from "express";
import path from "path";
import net from "net";
import { createServer as createViteServer } from "vite";

async function checkPortFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort: number, attempts = 10) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = startPort + offset;
    if (await checkPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + attempts - 1}`);
}

async function startServer() {
  const app = express();
  const requestedPort = parseInt(process.env.PORT || "3000", 10);
  const PORT = await findAvailablePort(requestedPort, 20);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/generate-caption", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: "Missing image payload.",
        });
      }

      const tStart = Date.now();

      const response = await fetch("http://127.0.0.1:5000/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      return res.json({
        success: data.success,
        caption: data.caption,
        source: "python-pickle-model",
        execution_time_ms: Date.now() - tStart,
      });
    } catch (error) {
      console.error("Caption generation error:", error);

      return res.status(500).json({
        success: false,
        error: "Caption generation failed. Make sure model_server.py is running on port 5000.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const requestedHmrPort = parseInt(process.env.VITE_HMR_PORT || "24678", 10);
    let hmr: boolean | { port: number } = false;

    if (process.env.DISABLE_HMR !== "true") {
      if (await checkPortFree(requestedHmrPort)) {
        hmr = { port: requestedHmrPort };
      } else {
        console.warn(
          `HMR port ${requestedHmrPort} is already in use; starting without HMR to avoid startup failure.`
        );
      }
    }

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});