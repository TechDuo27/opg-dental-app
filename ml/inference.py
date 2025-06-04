# ml/inference.py
import argparse
import json
import sys
from pathlib import Path
import torch
import cv2
import numpy as np
import os

# Add the ml directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from class_labels import CLASS_NAMES

def run_inference(input_path, output_path, weights_path, conf_threshold=0.25):
    """
    Run YOLOv5 inference on OPG image
    """
    try:
        # Suppress YOLOv5 logging
        import logging
        logging.getLogger('ultralytics').setLevel(logging.WARNING)
        
        # Load YOLOv5 model
        model = torch.hub.load('ultralytics/yolov5', 'custom', 
                              path=str(weights_path), 
                              force_reload=False,
                              verbose=False)
        model.conf = conf_threshold  # Set confidence threshold
        
        # Load image
        image = cv2.imread(str(input_path))
        if image is None:
            raise ValueError(f"Could not load image from {input_path}")
        
        # Get original dimensions
        orig_height, orig_width = image.shape[:2]
        
        # Run inference
        results = model(image)
        
        # Process results
        detections = []
        
        # Get predictions as pandas dataframe
        predictions = results.pandas().xyxy[0]
        
        for idx, row in predictions.iterrows():
            # Extract detection information
            x1, y1, x2, y2 = row['xmin'], row['ymin'], row['xmax'], row['ymax']
            conf = row['confidence']
            class_id = int(row['class'])
            
            # Get meaningful class name
            class_name = CLASS_NAMES.get(class_id, f"Class_{class_id}")
            
            # Add to detections
            detections.append({
                'label': class_name,
                'confidence': float(conf),
                'bbox': [float(x1), float(y1), float(x2-x1), float(y2-y1)]
            })
        
        # Create annotated image manually to avoid API issues
        annotated_image = image.copy()
        
        for _, row in predictions.iterrows():
            x1, y1, x2, y2 = int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])
            conf = row['confidence']
            class_id = int(row['class'])
            label = CLASS_NAMES.get(class_id, f"Class_{class_id}")
            
            # Draw bounding box
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label background
            label_text = f"{label} {conf:.2f}"
            (label_width, label_height), _ = cv2.getTextSize(label_text, 
                                                            cv2.FONT_HERSHEY_SIMPLEX, 
                                                            0.5, 2)
            cv2.rectangle(annotated_image, 
                         (x1, y1 - label_height - 4), 
                         (x1 + label_width, y1), 
                         (0, 255, 0), -1)
            
            # Draw label text
            cv2.putText(annotated_image, label_text, (x1, y1 - 2), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # Save annotated image
        cv2.imwrite(str(output_path), annotated_image)
        
        # Verify output was created
        if not Path(output_path).exists():
            raise ValueError(f"Failed to save output image to {output_path}")
        
        # Return results as JSON
        output = {
            'detections': detections,
            'image_shape': [orig_height, orig_width, 3],
            'num_detections': len(detections)
        }
        
        # Print JSON to stdout for the Node.js process to capture
        print(json.dumps(output))
        
    except Exception as e:
        # Print error to stderr
        error_output = {'error': str(e)}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Input image path')
    parser.add_argument('--output', required=True, help='Output image path')
    parser.add_argument('--weights', required=True, help='YOLOv5 weights path')
    parser.add_argument('--conf', type=float, default=0.25, help='Confidence threshold')
    
    args = parser.parse_args()
    
    run_inference(
        Path(args.input),
        Path(args.output),
        Path(args.weights),
        args.conf
    )