FROM python:3.10-slim

WORKDIR /app

# Copy requirements first (better caching)
COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy full project
COPY . .

# Expose HF default port
EXPOSE 7860

# Start FastAPI
CMD ["uvicorn", "backend.traffic_api:app", "--host", "0.0.0.0", "--port", "7860"]

