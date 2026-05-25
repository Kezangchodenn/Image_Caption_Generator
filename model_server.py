from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import os
import pickle
import base64
import io
import traceback
import time
from PIL import Image
import numpy as np
import torch
from transformers.models.gpt2.modeling_gpt2 import GPT2Attention

app = Flask(__name__)
CORS(app)

preferred_model_name = os.getenv("MODEL_PICKLE_FILE", "viy_gpt2_caption_model.pkl")
search_candidates = [preferred_model_name]
if preferred_model_name not in ["viy_gpt2_caption_model.pkl", "vit_gpt2_caption_model.pkl", "bit_gpt2_caption_model.pkl"]:
    search_candidates.extend(["viy_gpt2_caption_model.pkl", "vit_gpt2_caption_model.pkl", "bit_gpt2_caption_model.pkl"])
else:
    search_candidates.extend([name for name in ["viy_gpt2_caption_model.pkl", "vit_gpt2_caption_model.pkl", "bit_gpt2_caption_model.pkl"] if name != preferred_model_name])

model_file = None
for candidate in search_candidates:
    if os.path.exists(candidate):
        model_file = candidate
        break

if model_file is None:
    raise FileNotFoundError(
        f"Could not find a compatible pickle model. Tried: {', '.join(search_candidates)}. "
        "Place your model pickle at the project root and name it viy_gpt2_caption_model.pkl or vit_gpt2_caption_model.pkl."
    )

print(f"Loading pickle model from {model_file}...")

with open(model_file, "rb") as f:
    saved_objects = pickle.load(f)

model = saved_objects["model"]
tokenizer = saved_objects["tokenizer"]
image_processor = saved_objects["image_processor"]

def patch_gpt2_attention_scaling(module):
    for submodule in module.modules():
        if isinstance(submodule, GPT2Attention) and not hasattr(submodule, "scaling"):
            submodule.scaling = 1.0
            if getattr(submodule, "scale_attn_weights", False):
                submodule.scaling = submodule.head_dim ** -0.5
            if getattr(submodule, "scale_attn_by_inverse_layer_idx", False) and getattr(submodule, "layer_idx", None) is not None:
                submodule.scaling /= float(submodule.layer_idx + 1)

patch_gpt2_attention_scaling(model)

pad_id = getattr(tokenizer, "pad_token_id", None) or getattr(tokenizer, "eos_token_id", None)
if pad_id is not None:
    model.config.pad_token_id = pad_id
    if getattr(model.config, "eos_token_id", None) is None:
        model.config.eos_token_id = pad_id
    if getattr(model.config, "decoder_start_token_id", None) is None:
        model.config.decoder_start_token_id = getattr(tokenizer, "bos_token_id", getattr(tokenizer, "eos_token_id", None))

def prepare_pixel_values(image: Image.Image, processor, device: str):
    # Manual preprocessing fallback for transformers compatibility issues.
    size = processor.size if hasattr(processor, "size") else {"height": 224, "width": 224}
    height = size["height"] if isinstance(size, dict) else size
    width = size["width"] if isinstance(size, dict) else size

    image = image.convert("RGB")
    image = image.resize((width, height), resample=Image.BICUBIC)

    array = np.array(image).astype(np.float32)
    rescale_factor = getattr(processor, "rescale_factor", 1/255)
    array = array * rescale_factor

    if getattr(processor, "do_normalize", False):
        mean = np.array(getattr(processor, "image_mean", [0.5, 0.5, 0.5]), dtype=np.float32)
        std = np.array(getattr(processor, "image_std", [0.5, 0.5, 0.5]), dtype=np.float32)
        array = (array - mean) / std

    pixel_values = torch.from_numpy(array).permute(2, 0, 1).unsqueeze(0).to(device)
    return pixel_values


device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

print("Model loaded successfully!")
print("Running on device:", device)
print("Using model file:", model_file)

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"success": True, "message": "Caption backend running."})

@app.route("/favicon.ico", methods=["GET"])
def favicon():
    return "", 204

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

        pixel_values = prepare_pixel_values(image, image_processor, device)
        start_time = time.time()

        with torch.no_grad():
            output_ids = model.generate(
                pixel_values,
                max_length=40,
                num_beams=4,
                no_repeat_ngram_size=2,
                pad_token_id=getattr(tokenizer, "pad_token_id", None),
                eos_token_id=getattr(tokenizer, "eos_token_id", None),
                decoder_start_token_id=getattr(tokenizer, "bos_token_id", getattr(tokenizer, "eos_token_id", None)),
            )

        execution_time_ms = int((time.time() - start_time) * 1000)

        caption = tokenizer.batch_decode(
            output_ids,
            skip_special_tokens=True
        )[0].strip()

        return jsonify({
            "success": True,
            "caption": caption,
            "source": "pickle",
            "model_file": model_file,
            "execution_time_ms": execution_time_ms,
        })

    except Exception as e:
        print("ERROR DURING CAPTION GENERATION:")
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    # Return JSON for HTTP exceptions (avoids HTML error pages)
    response = {
        "success": False,
        "error": getattr(e, "description", str(e)),
        "code": getattr(e, "code", 500)
    }
    return jsonify(response), getattr(e, "code", 500)


@app.errorhandler(Exception)
def handle_generic_exception(e: Exception):
    # Catch-all for unexpected exceptions and return JSON instead of HTML
    print("UNHANDLED EXCEPTION:")
    traceback.print_exc()
    return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)