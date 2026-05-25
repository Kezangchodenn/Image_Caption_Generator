from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from transformers import (
    BlipProcessor,
    BlipForConditionalGeneration
)

from PIL import Image
import torch
import io

app = FastAPI()

# Allow React frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load fine-tuned model
MODEL_PATH = "./final_blip_model"

processor = BlipProcessor.from_pretrained(MODEL_PATH)

model = BlipForConditionalGeneration.from_pretrained(MODEL_PATH)

model.to(device)

print("BLIP model loaded successfully.")

@app.get("/")
def home():
    return {"message": "BLIP Model Server Running"}

@app.post("/generate-caption")
async def generate_caption(file: UploadFile = File(...)):

    image_bytes = await file.read()

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    inputs = processor(
        images=image,
        return_tensors="pt"
    ).to(device)

    output = model.generate(
        **inputs,
        max_length=50,
        num_beams=5,
        temperature=0.8,
        repetition_penalty=1.2,
        early_stopping=True
    )

    caption = processor.decode(
        output[0],
        skip_special_tokens=True
    )

    return {
        "caption": caption
    }
