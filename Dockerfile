FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 5000

# Use a production-ready server if desired; default to flask for simplicity
CMD ["python", "model_server.py"]
