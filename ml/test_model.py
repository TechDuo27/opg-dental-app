# ml/test_model.py
import torch
import sys

try:
    # Load YOLOv5 model
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=False)
    
    print("Model loaded successfully!")
    print(f"Number of classes: {len(model.names)}")
    print("Class names:")
    for idx, name in enumerate(model.names):
        print(f"  {idx}: {name}")
    
    # Print model info
    print(f"\nModel confidence threshold: {model.conf}")
    print(f"Model IOU threshold: {model.iou}")
    
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)