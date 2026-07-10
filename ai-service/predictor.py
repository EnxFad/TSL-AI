import hashlib
import os
from typing import Literal

Result = Literal["LOCK", "UNLOCK"]


class BoxLockPredictor:
    """Predictor for box LOCK/UNLOCK classification."""

    def __init__(self, model_path: str, mock: bool = True):
        self.mock = mock
        self.model = None

        if not mock:
            # Integration point: load your trained model here
            # Example for PyTorch:
            #   import torch
            #   self.model = torch.load(model_path, map_location="cpu")
            #   self.model.eval()
            # Example for ONNX:
            #   import onnxruntime as ort
            #   self.model = ort.InferenceSession(model_path)
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model not found: {model_path}")
            raise NotImplementedError(
                "Real model inference not implemented. "
                "Set AI_MOCK=true or implement predict() with your model."
            )

    def predict(self, image_bytes: bytes) -> Result:
        if self.mock:
            return self._mock_predict(image_bytes)

        # Integration point: real inference
        # 1. Preprocess image (resize, normalize)
        # 2. Run model inference
        # 3. Map output to "LOCK" or "UNLOCK"
        raise NotImplementedError("Implement real model inference in predict()")

    def _mock_predict(self, image_bytes: bytes) -> Result:
        """Deterministic mock based on image hash for testing."""
        digest = hashlib.md5(image_bytes).hexdigest()
        return "LOCK" if int(digest, 16) % 2 == 0 else "UNLOCK"
