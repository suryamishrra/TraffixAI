"""
TrafficAI FastAPI Backend
Run (local): uvicorn backend.traffic_api:app --reload
Run (prod):  uvicorn backend.traffic_api:app --host 0.0.0.0 --port 10000
"""

import io
import os
import cv2
import numpy as np
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO

# ============================================================
# GLOBAL STORAGE
# ============================================================
vehicle_records = {}
toll_history = []

current_status = {
    "vehicle_count": 0,
    "traffic_status": "Normal",
    "last_plate": "—",
    "toll_status": "—"
}

# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(title="TrafficAI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================
class VehicleEntry(BaseModel):
    vehicle_number: str

class VehicleExit(BaseModel):
    vehicle_number: str

# ============================================================
# YOLO TRAFFIC ANALYZER
# ============================================================
class TrafficAnalyzer:
    def __init__(self, model_path=None):
        print("Loading YOLO Model...")

        if model_path is None:
            base_dir = os.path.dirname(__file__)
            model_path = os.path.join(base_dir, "yolov8n.pt")

        self.model = YOLO(model_path)

        self.vehicle_classes = {
            2: 'Car',
            3: 'Bike',
            5: 'Bus',
            7: 'Truck'
        }

    def analyze_image(self, image):
        results = self.model(image, verbose=False)

        counts = {'cars': 0, 'bikes': 0, 'buses': 0, 'trucks': 0}

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])

                if cls in self.vehicle_classes and conf > 0.3:
                    t = self.vehicle_classes[cls].lower()
                    counts[t + 's'] += 1

        total = sum(counts.values())

        if total < 5:
            status = "Normal"
        elif total <= 15:
            status = "Moderate"
        else:
            status = "Heavy"

        current_status["vehicle_count"] = total
        current_status["traffic_status"] = status

        return {
            "total_vehicles": total,
            **counts,
            "traffic_status": status
        }

analyzer = TrafficAnalyzer()

# ============================================================
# ROOT
# ============================================================
@app.get("/")
async def root():
    return {"message": "TrafficAI Backend Running 🚦"}

# ============================================================
# TRAFFIC ANALYZE API
# ============================================================
@app.post("/analyze")
async def analyze_traffic(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        np_img = np.array(image)

        if len(np_img.shape) == 2:
            np_img = cv2.cvtColor(np_img, cv2.COLOR_GRAY2BGR)
        elif np_img.shape[2] == 4:
            np_img = cv2.cvtColor(np_img, cv2.COLOR_RGBA2BGR)
        else:
            np_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

        return analyzer.analyze_image(np_img)

    except Exception as e:
        raise HTTPException(400, f"Image Error: {str(e)}")

# ============================================================
# TOLL FUNCTION
# ============================================================
def handle_toll(vehicle_number):
    current_time = datetime.now()

    if vehicle_number not in vehicle_records:
        vehicle_records[vehicle_number] = current_time

        current_status["last_plate"] = vehicle_number
        current_status["toll_status"] = "Entry Recorded"
        current_status["vehicle_count"] += 1

        toll_history.append({
            "vehicle_number": vehicle_number,
            "entry_time": str(current_time),
            "exit_time": None,
            "status": "Entry"
        })

        return {
            "status": "entry_recorded",
            "vehicle_number": vehicle_number,
            "entry_time": str(current_time)
        }

    entry = vehicle_records[vehicle_number]
    travel = (current_time - entry).total_seconds() / 60

    if travel <= 10:
        toll = 20
    elif travel <= 30:
        toll = 50
    else:
        toll = 100

    del vehicle_records[vehicle_number]

    current_status["last_plate"] = vehicle_number
    current_status["toll_status"] = "Exit Completed"
    current_status["vehicle_count"] -= 1

    data = {
        "status": "exit_completed",
        "vehicle_number": vehicle_number,
        "entry_time": str(entry),
        "exit_time": str(current_time),
        "travel_time_minutes": round(travel, 2),
        "toll_amount": toll
    }

    toll_history.append({
        "vehicle_number": vehicle_number,
        "entry_time": str(entry),
        "exit_time": str(current_time),
        "status": "Exit",
        "toll_amount": toll
    })

    return data

# ============================================================
# AI TOLL API
# ============================================================
@app.post("/ai/toll")
async def ai_toll_update(data: dict = Body(...)):
    vehicle_number = data.get("plate")

    if not vehicle_number:
        raise HTTPException(400, "Plate not provided")

    return handle_toll(vehicle_number)

# ============================================================
# DASHBOARD STATUS
# ============================================================
@app.get("/status")
async def get_status():
    return current_status

@app.get("/toll-history")
async def toll_history_api():
    return toll_history

# ============================================================
# FRONTEND STATUS UPDATE
# ============================================================
@app.post("/update-status")
async def update_status(data: dict = Body(...)):
    global current_status
    current_status["vehicle_count"] = data.get("vehicle_count", current_status["vehicle_count"])
    current_status["traffic_status"] = data.get("traffic_status", current_status["traffic_status"])
    current_status["last_plate"] = data.get("last_plate", current_status["last_plate"])
    current_status["toll_status"] = data.get("toll_status", current_status["toll_status"])
    return {"message": "Status updated", "data": current_status}
