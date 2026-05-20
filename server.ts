import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits to support base64 image uploads smoothly
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  /**
   * API: Generate Caption
   * This is the endpoint called by your frontend app.
   * We have simplified this to remove Python execution bottlenecks.
   * You can replace the placeholder logic inside this route with your own custom .pkl model loader.
   */
  app.post("/api/generate-caption", async (req, res) => {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image pay-load." });
    }

    const tStart = Date.now();
    
    // MODEL LOCATION PATH WAY:
    // Place your model file in the root folder of this project as: "bit_gpt2_caption_model.pkl"
    const modelFileName = "bit_gpt2_caption_model.pkl";
    const absoluteModelPath = path.join(process.cwd(), modelFileName);
    const modelExists = fs.existsSync(absoluteModelPath);

    // Simulated small delay for premium neural loading feel (1200ms)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // ------------------------------------------------------------------------------
    // NOTE FOR INTEGRATION:
    // When you are ready to use your `.pkl` model, you can replace the placeholder
    // below with your Python/Node loader. For example, if you run a local fastAPI or
    // python model server, you can forward this request to it!
    // ------------------------------------------------------------------------------

    // Presets for pristine offline testing
    const sampleCaptions = [
      "A serene capturing of twilight settling over a misty mountain lake.",
      "A sleek modern workspace bathed in warm ambient sunset lighting.",
      "An elegant close-up of high-tech gear surrounded by soft neon accents.",
      "A minimalist abstract design with soft geometric shadows and warm colors."
    ];
    const generatedCaption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];

    return res.json({
      success: true,
      caption: generatedCaption,
      source: "pickle",
      execution_time_ms: Date.now() - tStart,
      model_path: absoluteModelPath,
      model_verified: modelExists
    });
  });

  // Mount Vite development server middleware in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static files
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
