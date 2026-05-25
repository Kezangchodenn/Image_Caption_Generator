<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ae2b7e9e-6467-4235-b2e1-ea151a10ddef

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend & Deployment (added guidance)

This project includes a Flask backend (`model_server.py`) that loads a pickled Vision+GPT2 model and serves `/generate-caption`.

Quick backend setup:

1. Create a Python virtualenv and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

2. Place your model pickle in the project root and name it `viy_gpt2_caption_model.pkl` or `vit_gpt2_caption_model.pkl`.

3. Run the backend locally:

```bash
python model_server.py
```

Deploying:

- Backend: deploy the repository or the `model_server.py` service to a Python host (Render, Railway, Fly, Docker). A `Dockerfile` and `requirements.txt` are included.
- Frontend: Deploy to Vercel. Set the environment variable `BACKEND_URL` (Vercel Project Settings → Environment Variables) to the HTTPS URL of your hosted backend (e.g. `https://my-backend.example.com`).

Vercel serverless proxy:
- The project contains `api/generate-caption.js` which proxies `/api/generate-caption` to the `BACKEND_URL` you configure in Vercel. This avoids CORS issues and preserves the same frontend API path.

If you run into issues after deploying, check Vercel function logs and the backend logs. The backend will return JSON-formatted errors and attempts to patch some compatibility issues with pickled GPT2 models.
