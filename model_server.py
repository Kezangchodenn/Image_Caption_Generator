from flask import Flask, request, jsonify
import pickle
import base64
import io
import traceback
from PIL import Image
import torch

app = Flask(__name__)

print("Loading pickle model...")

with open("bit_gpt2_caption_model.pkl", "rb") as f:
    saved_objects = pickle.load(f)

model = saved_objects["model"]
tokenizer = saved_objects["tokenizer"]
image_processor = saved_objects["image_processor"]

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

print("Model loaded successfully!")
print("Running on device:", device)

@app.route("/generate-caption", methods=["POST"])
def generate_caption():
    try:
        data = request.json

        if not data or "image" not in data:
            return jsonify({
                "success": False,
                "error": "No image received"
            }), 400

        image_base64 = data["image"]

        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        pixel_values = image_processor(
            images=image,
            return_tensors="pt"
        ).pixel_values.to(device)

        with torch.no_grad():
            output_ids = model.generate(
                pixel_values,
                max_length=40,
                num_beams=4,
                no_repeat_ngram_size=2
            )

        caption = tokenizer.batch_decode(
            output_ids,
            skip_special_tokens=True
        )[0].strip()

        return jsonify({
            "success": True,
            "caption": caption
        })

    except Exception as e:
        print("ERROR DURING CAPTION GENERATION:")
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)