import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const FaceMatcher = ({ mainImage, imageArray }) => {
  const [matchedImages, setMatchedImages] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setModelsLoaded(true);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded && mainImage && imageArray.length > 0) {
      compareFaces();
    }
  }, [modelsLoaded, mainImage, imageArray]);

  const loadImage = async (src) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise((resolve) => (img.onload = resolve));
    return img;
  };

  const compareFaces = async () => {
    if (!modelsLoaded) {
      console.warn("Models not loaded yet, skipping face detection.");
      return;
    }

    try {
      const mainImg = await loadImage(mainImage);
      const mainDescriptors = await getFaceDescriptors(mainImg);

      if (!mainDescriptors.length) {
        console.warn("No face found in main image.");
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(mainDescriptors, 0.5);
      let bestMatch = { distance: 1.0, imgSrc: null };

      const matches = await Promise.all(
        imageArray.map(async (imgSrc) => {
          const img = await loadImage(imgSrc);
          const descriptors = await getFaceDescriptors(img);
          if (!descriptors.length) return null;

          const closest = descriptors
            .map((desc) => faceMatcher.findBestMatch(desc))
            .find((result) => result.label !== "unknown");

          if (closest && closest.distance < bestMatch.distance) {
            bestMatch = { distance: closest.distance, imgSrc };
          }

          return closest && closest.distance < 0.5 ? imgSrc : null;
        })
      );

      if (!matches.some(Boolean) && bestMatch.imgSrc) {
        matches.push(bestMatch.imgSrc);
      }

      setMatchedImages(matches.filter(Boolean));
    } catch (error) {
      console.error("Error comparing faces:", error);
    }
  };

  const getFaceDescriptors = async (img) => {
    if (!modelsLoaded) {
      console.warn("Face models not loaded yet.");
      return [];
    }

    try {
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections.map((d) => d.descriptor);
    } catch (error) {
      console.error("Error processing image:", error);
      return [];
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Main Image</h2>
      <img src={mainImage} alt="Main" style={{ width: 320, height: "auto", border: "3px solid black", marginBottom: 20 }} />

      <h2>All Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {imageArray.map((src, index) => (
          <img key={index} src={src} alt={`img-${index}`} style={{ width: 140, height: "auto", margin: 5, border: "1px solid gray" }} />
        ))}
      </div>

      <h2>Matched Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {matchedImages.length > 0 ? (
          matchedImages.map((src, index) => (
            <img key={index} src={src} alt="Matched" style={{ width: 140, height: "auto", margin: 5, border: "3px solid green" }} />
          ))
        ) : (
          <p>No matching images found.</p>
        )}
      </div>
    </div>
  );
};

const imageData = {
  mainImage: "/imgs/Screenshot 2025-03-30 231705.png",
  imageArray: [
    "/imgs/DSC_8477 - Copy - Copy.jpg",
    "/imgs/DSC01265.JPG",
    "/imgs/DSC01489.JPG",
    "/imgs/DSC01497.JPG",
    "/imgs/DSC01644.JPG",
    "/imgs/DSC01649.JPG",
    "/imgs/DSC01698.JPG",
    "/imgs/IMG-20240506-WA0024.jpg",
    "/imgs/IMG-20241206-WA0063.jpg",
    "/imgs/IMG-20241207-WA0047.jpg",
  ],
};

export default FaceMatcher;
export { imageData };
