import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const FaceMatcher = ({ mainImage, imageArray }) => {
  const [matchedImages, setMatchedImages] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
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
    img.crossOrigin = "anonymous"; // Fix CORS issue
    img.src = src;
    await new Promise((resolve) => (img.onload = resolve));
    return img;
  };

  const compareFaces = async () => {
    try {
      const mainImg = await loadImage(mainImage);
      const mainDescriptors = await getFaceDescriptors(mainImg);

      if (!mainDescriptors.length) {
        console.warn("No face found in main image.");
        return;
      }

      const primaryFace = mainDescriptors[0]; // First detected face in the main image
      let bestMatch = { distance: 1.0, imgSrc: null };

      const matches = await Promise.all(
        imageArray.map(async (imgSrc) => {
          const img = await loadImage(imgSrc);
          const descriptors = await getFaceDescriptors(img);
          if (!descriptors.length) return null;

          // Find the closest match to the primary face
          const closest = descriptors.reduce((acc, descriptor) => {
            const distance = faceapi.euclideanDistance(primaryFace, descriptor);
            return distance < acc.distance ? { distance, imgSrc } : acc;
          }, { distance: 1.0, imgSrc: null });

          console.log(`Best match for ${imgSrc}: ${closest.distance}`);

          if (closest.distance < bestMatch.distance) {
            bestMatch = closest;
          }

          return closest.distance < 0.45 ? imgSrc : null; // More strict threshold
        })
      );

      // Ensure at least one good match appears
      if (!matches.some(Boolean) && bestMatch.imgSrc) {
        matches.push(bestMatch.imgSrc);
      }

      setMatchedImages(matches.filter(Boolean));
    } catch (error) {
      console.error("Error comparing faces:", error);
    }
  };

  const getFaceDescriptors = async (img) => {
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
      <img src={mainImage} alt="Main" style={{ width: 300, height: "auto", border: "3px solid black", marginBottom: 20 }} />

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
