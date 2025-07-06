import numpy as np
import cv2
from fastapi import UploadFile

def parse_image(file: UploadFile):
    data = file.file.read()
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    file.file.close()
    return image

def cm_to_inch(cm):
    return round(cm / 2.54, 1)

def distance(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

def elliptical_circumference(width, depth):
    a, b = width / 2, depth / 2
    h = ((a - b)**2) / ((a + b)**2 + 1e-5)
    return np.pi * (a + b) * (1 + (3 * h) / (10 + np.sqrt(4 - 3 * h))) 