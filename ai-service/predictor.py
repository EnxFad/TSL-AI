import base64
import hashlib
import io
import os
from typing import Literal

from PIL import Image, ImageDraw, ImageFont, ImageOps

Result = Literal["LOCK", "UNLOCK", "NO_DETECTION"]

CLASS_TO_RESULT: dict[str, Result] = {
    "locked": "LOCK",
    "unlocked": "UNLOCK",
}

# RGB colors for UI/annotation
COLOR_LOCK = (34, 197, 94)       # green
COLOR_UNLOCK = (239, 68, 68)     # red
COLOR_NO_DETECTION = (234, 179, 8)  # yellow


class BoxLockPredictor:
    """Predictor for box LOCK/UNLOCK classification via YOLO detection."""

    def __init__(self, model_path: str, mock: bool = True):
        self.mock = mock
        self.model = None
        self.conf = float(os.getenv("AI_CONF_THRESHOLD", "0.25"))

        if not mock:
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model not found: {model_path}")

            from ultralytics import YOLO

            self.model = YOLO(model_path)
            self._validate_model_classes()

    def _validate_model_classes(self) -> None:
        names = {str(name).lower() for name in self.model.names.values()}
        missing = set(CLASS_TO_RESULT) - names
        if missing:
            raise ValueError(
                f"Model classes {sorted(names)} missing expected labels: {sorted(missing)}"
            )

    def predict(self, image_bytes: bytes) -> tuple[Result, str | None]:
        if self.mock:
            return self._mock_predict(image_bytes), None

        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
        results = self.model.predict(source=image, conf=self.conf, verbose=False)
        result = results[0]
        label = self._result_from_detections(result)
        annotated = self._encode_annotated(image, result, label)
        return label, annotated

    def _encode_annotated(self, image: Image.Image, result, label: Result) -> str:
        canvas = image.copy()
        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("arial.ttf", 28)
        except OSError:
            font = ImageFont.load_default()

        if label == "NO_DETECTION":
            color = COLOR_NO_DETECTION
            w, h = canvas.size
            thickness = max(4, min(w, h) // 80)
            for i in range(thickness):
                draw.rectangle([i, i, w - 1 - i, h - 1 - i], outline=color)
            text = "ไม่พบ — ถ่ายใหม่"
            draw.rectangle([8, 8, 8 + 260, 48], fill=color)
            draw.text((16, 14), text, fill=(0, 0, 0), font=font)
        else:
            boxes = result.boxes
            if boxes is not None:
                for class_id, conf, xyxy in zip(
                    boxes.cls.tolist(),
                    boxes.conf.tolist(),
                    boxes.xyxy.tolist(),
                ):
                    name = str(result.names[int(class_id)]).lower()
                    color = COLOR_UNLOCK if name == "unlocked" else COLOR_LOCK
                    x1, y1, x2, y2 = [int(v) for v in xyxy]
                    thickness = max(3, (x2 - x1) // 40)
                    for i in range(thickness):
                        draw.rectangle(
                            [x1 - i, y1 - i, x2 + i, y2 + i],
                            outline=color,
                        )
                    caption = f"{name} {conf:.2f}"
                    text_bbox = draw.textbbox((x1, y1), caption, font=font)
                    pad = 4
                    label_box = [
                        text_bbox[0] - pad,
                        text_bbox[1] - pad - 4,
                        text_bbox[2] + pad,
                        text_bbox[3] + pad - 4,
                    ]
                    # Keep label inside image
                    if label_box[1] < 0:
                        shift = -label_box[1] + 2
                        label_box = [
                            label_box[0],
                            label_box[1] + shift,
                            label_box[2],
                            label_box[3] + shift,
                        ]
                    draw.rectangle(label_box, fill=color)
                    draw.text(
                        (label_box[0] + pad, label_box[1] + pad),
                        caption,
                        fill=(255, 255, 255),
                        font=font,
                    )

        buffer = io.BytesIO()
        canvas.save(buffer, format="JPEG", quality=85)
        return base64.b64encode(buffer.getvalue()).decode("ascii")

    def _result_from_detections(self, result) -> Result:
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return "NO_DETECTION"

        detected: set[str] = set()
        for class_id in boxes.cls.tolist():
            name = str(result.names[int(class_id)]).lower()
            detected.add(name)

        if "unlocked" in detected:
            return "UNLOCK"
        if "locked" in detected:
            return "LOCK"
        return "NO_DETECTION"

    def _mock_predict(self, image_bytes: bytes) -> Result:
        """Deterministic mock based on image hash for testing."""
        digest = hashlib.md5(image_bytes).hexdigest()
        return "LOCK" if int(digest, 16) % 2 == 0 else "UNLOCK"
