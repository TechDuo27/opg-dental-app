# ml/test_inference.py
import torch
import cv2
import numpy as np
from class_labels import CLASS_NAMES

# Test if we can load and run the model
try:
    print("Loading YOLOv5 model...")
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=False)
    model.conf = 0.25
    
    print("Model loaded successfully!")
    
    # Create a dummy test image (black image)
    test_image = np.zeros((640, 640, 3), dtype=np.uint8)
    
    print("Running inference on test image...")
    results = model(test_image)
    
    print("Inference completed!")
    print(f"Number of detections: {len(results.pandas().xyxy[0])}")
    
    # If you have a real OPG image, uncomment and update the path below:
    # real_image = cv2.imread("path/to/your/test_opg.jpg")
    # results = model(real_image)
    # print(f"Detections on real image: {len(results.pandas().xyxy[0])}")
    
except Exception as e:
    print(f"Error during inference: {e}")
    import traceback
    traceback.print_exc()