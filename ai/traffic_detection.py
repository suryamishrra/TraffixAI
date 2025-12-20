"""
FINAL Traffic Detection AI
Fully Working with FastAPI Dashboard + Vehicles + GREEN BOX + IMAGE OCR
"""

import cv2
import time
import re
import requests
from ultralytics import YOLO
from ai.number_plate_recognition import NumberPlateRecognizer

BACKEND_URL = "http://127.0.0.1:8000"


class TrafficDetector:
    def __init__(self, model_path='yolov8n.pt'):
        print("Loading YOLO model...")
        self.model = YOLO(model_path)

        # COCO class IDs that belong to vehicles
        self.vehicle_classes = {
            2: 'Car',
            3: 'Motorcycle',
            5: 'Bus',
            7: 'Truck'
        }

        self.normal_threshold = 5
        self.moderate_threshold = 15
        self.prev_time = 0

        self.recognizer = NumberPlateRecognizer()

    def get_traffic_status(self, vehicle_count):
        if vehicle_count < self.normal_threshold:
            return "Normal"
        elif vehicle_count <= self.moderate_threshold:
            return "Moderate"
        return "Heavy"

    def calculate_fps(self):
        now = time.time()
        fps = 1 / (now - self.prev_time) if self.prev_time > 0 else 0
        self.prev_time = now
        return fps


    # ========================= VEHICLE DETECTION =========================
    def draw_detections(self, frame, results):
        vehicle_count = 0
        plate_regions = []

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                conf = float(box.conf[0])

                if cls in self.vehicle_classes and conf > 0.25:
                    vehicle_count += 1

                    # GREEN BOX
                    cv2.rectangle(frame, (x1, y1), (x2, y2),
                                  (0, 255, 0), 2)

                    label = f"{self.vehicle_classes[cls]} {conf:.2f}"
                    cv2.putText(frame, label, (x1, y1 - 8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                                (0, 255, 0), 2)

                    # crop region for OCR
                    plate_regions.append(frame[y1:y2, x1:x2])

        return vehicle_count, plate_regions


    # ========================= VIDEO MODE =========================
    def process_video(self, source=0):
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            print("❌ Cannot open video / camera")
            return

        print("🚦 Traffic AI Running… Press Q to quit")

        recent = []
        cooldown = 0
        LIMIT = 40

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            results = self.model(frame, verbose=False)
            vehicle_count, plates = self.draw_detections(frame, results)

            status = self.get_traffic_status(vehicle_count)
            fps = self.calculate_fps()

            # ALWAYS update dashboard
            try:
                requests.post(f"{BACKEND_URL}/update-status", json={
                    "vehicle_count": vehicle_count,
                    "traffic_status": status,
                    "last_plate": "—",
                    "toll_status": "—"
                })
            except:
                pass


            # ================= NUMBER PLATE SECTION =================
            if cooldown == 0:
                for p in plates:
                    plate = self.recognizer.process_image(p)
                    if plate == "":
                        continue

                    plate = plate.upper().replace(" ", "").replace("-", "")

                    match = re.findall(
                        r"[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{3,4}",
                        plate
                    )
                    if not match:
                        continue

                    plate = match[0]

                    if plate in recent:
                        continue

                    recent.append(plate)
                    if len(recent) > 10:
                        recent.pop(0)

                    print("🚗 Detected Plate:", plate)

                    # UPDATE DASHBOARD PLATE
                    try:
                        requests.post(f"{BACKEND_URL}/update-status", json={
                            "vehicle_count": vehicle_count,
                            "traffic_status": status,
                            "last_plate": plate,
                            "toll_status": "Updated"
                        })
                    except:
                        pass

                    # SEND TO BACKEND TOLL
                    try:
                        requests.post(
                            f"{BACKEND_URL}/ai/toll",
                            json={"plate": plate}
                        )
                    except Exception as e:
                        print("Toll Error:", e)

                    cooldown = LIMIT
                    break
            else:
                cooldown -= 1

            cv2.putText(frame, f"Cooldown: {cooldown}",
                        (400, 60),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (255, 255, 0), 2)

            cv2.imshow("TrafficAI", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()



    # ========================= IMAGE MODE =========================
    def process_image(self, path):
        import easyocr

        img = cv2.imread(path)
        if img is None:
            print("❌ Image not found")
            return

        results = self.model(img, verbose=False)
        vehicle_count, _ = self.draw_detections(img, results)

        status = self.get_traffic_status(vehicle_count)

        # UPDATE DASHBOARD COUNT ALSO IN IMAGE MODE 🔥
        try:
            requests.post(f"{BACKEND_URL}/update-status", json={
                "vehicle_count": vehicle_count,
                "traffic_status": status,
                "last_plate": "—",
                "toll_status": "—"
            })
        except:
            pass

        # ======= OCR =======
        reader = easyocr.Reader(['en'])
        result = reader.readtext(img)

        text = "".join([r[1] for r in result]).upper().replace(" ", "").replace("-", "")
        print("OCR Raw:", text)

        match = re.findall(r"[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{3,4}", text)

        if match:
            plate = match[0]
            print("🚗 Detected Plate:", plate)

            try:
                requests.post(
                    f"{BACKEND_URL}/ai/toll",
                    json={"plate": plate}
                )
            except:
                pass

        cv2.imshow("TrafficAI Image", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()



# ========================= MAIN =========================
def main():
    detector = TrafficDetector()

    print("\n1 Live Camera")
    print("2 Video File")
    print("3 Image")

    ch = input("Choose: ")

    if ch == "1":
        detector.process_video(0)

    elif ch == "2":
        p = input("Enter video path: ")
        detector.process_video(p)

    elif ch == "3":
        p = input("Enter image path: ")
        detector.process_image(p)


if __name__ == "__main__":
    main()
