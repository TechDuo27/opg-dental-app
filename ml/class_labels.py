# ml/class_labels.py
# Map YOLOv5 class indices to meaningful dental condition names
# Update these based on what your model actually detects

CLASS_NAMES = {
    0: "Cavity/Caries",
    1: "Impacted Tooth",
    2: "Periapical Lesion",
    3: "Root Canal Treatment",
    4: "Crown/Bridge",
    5: "Missing Tooth"
}

# You can also define severity levels based on class
SEVERITY_LEVELS = {
    0: "high",      # Cavity - needs immediate attention
    1: "high",      # Impacted tooth - surgical consultation needed
    2: "medium",    # Periapical lesion - needs treatment
    3: "low",       # Root canal already done
    4: "low",       # Crown/Bridge already present
    5: "medium"     # Missing tooth - consider replacement
}