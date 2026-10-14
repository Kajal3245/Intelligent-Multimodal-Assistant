
import base64
from io import BytesIO

from PIL import Image, ImageDraw
from ultralytics import YOLO

_model = None


def get_model():
    global _model

    if _model is None:
        _model = YOLO("yolov8n.pt")

    return _model


def detect_objects(image_bytes: bytes) -> dict:
    """Detect objects and return labels, confidence, coordinates, and annotated image."""

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    model = get_model()

    results = model.predict(image, conf=0.25, verbose=False)
    detections = []
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            label = model.names[class_id]
            score = round(confidence, 3)

            detections.append({
                "label": label,
                "confidence": score,
                "box": {
                    "x1": round(x1, 1),
                    "y1": round(y1, 1),
                    "x2": round(x2, 1),
                    "y2": round(y2, 1),
                },
            })

            # Draw a rectangle and a label on the image.
            draw.rectangle(
                [x1, y1, x2, y2],
                outline="#00E676",
                width=max(3, image.width // 300),
            )

            text = f"{label} {confidence:.0%}"
            left, top, right, bottom = draw.textbbox((x1, y1), text)
            text_height = bottom - top
            label_top = max(0, y1 - text_height - 8)

            draw.rectangle(
                [x1, label_top, right + 6, label_top + text_height + 6],
                fill="#00A85A",
            )
            draw.text(
                (x1 + 3, label_top + 3),
                text,
                fill="white",
            )

    buffer = BytesIO()
    annotated.save(buffer, format="JPEG", quality=90)
    encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "count": len(detections),
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{encoded_image}",
    }
