# Traffic Detection AI Module

A Python-based traffic detection system using YOLOv8 and OpenCV for real-time vehicle detection and traffic density analysis.

## Features

- Detects Cars, Bikes, Trucks, and Buses
- Real-time vehicle counting
- Traffic density classification (Normal, Moderate, Heavy Congestion)
- FPS display
- Visual bounding boxes with labels
- Easy-to-use interface

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. The YOLOv8 model will be downloaded automatically on first run.

## Usage

### Using Webcam
```bash
python traffic_detection.py
```

### Using Video File
Edit the `main()` function in `traffic_detection.py`:
```python
detector.process_video('path/to/your/video.mp4')
```

## Controls

- Press **'q'** to exit the video window

## Traffic Status Logic

- **Normal**: Less than 5 vehicles
- **Moderate**: 5-15 vehicles
- **Heavy Congestion**: More than 15 vehicles

## Output Display

The video window shows:
- Vehicle count in real-time
- Traffic status (color-coded)
- Current FPS
- Bounding boxes around detected vehicles
- Vehicle type and confidence score

## Customization

You can modify thresholds in the `TrafficDetector` class:
```python
self.normal_threshold = 5      # Change for Normal status
self.moderate_threshold = 15   # Change for Moderate status
```

## Requirements

- Python 3.8 or higher
- Webcam or video file
- Sufficient CPU/GPU for real-time processing
