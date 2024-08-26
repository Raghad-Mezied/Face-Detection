import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    // Load face-api.js models
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Ensure you have the models in the public/models directory
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    };

    loadModels();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing the camera", error);
      }
    };

    if (modelsLoaded && !imageSrc) {
      startCamera();
    }
  }, [modelsLoaded, imageSrc]);

  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Wait until the video is ready
      if (video.readyState !== 4) {
        video.addEventListener("loadeddata", () => handleVideoPlay());
        return;
      }

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        // Check if a face is detected
        setFaceDetected(detections.length > 0);

        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }, 100);
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && faceDetected) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setImageSrc(dataUrl);
      }
    } else {
      alert("No face detected! Please ensure your face is in view.");
    }
  };

  const retakeSelfie = () => {
    setImageSrc(null); // Clear the image
    setFaceDetected(false); // Reset face detection state
  };

  return (
    <div className="camera-container relative">
      {!imageSrc ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            onPlay={handleVideoPlay}
            className="w-full h-full"
          />
          <canvas ref={canvasRef} className="absolute top-0 left-0" />
          <button
            onClick={takeSelfie}
            className={`absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white py-2 px-4 rounded ${
              faceDetected ? "" : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!faceDetected}
          >
            Take Selfie
          </button>
        </>
      ) : (
        <>
          <img
            src={imageSrc}
            alt="Selfie"
            className="w-full h-full object-cover"
          />
          <button
            onClick={retakeSelfie}
            className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white py-2 px-4 rounded"
          >
            Retake Selfie
          </button>
        </>
      )}
    </div>
  );
};
