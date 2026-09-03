/**
 * faceRecognition.js
 * Utility functions for face-api.js:
 *   - Loading TinyFaceDetector + FaceLandmark68 + FaceRecognitionNet models
 *   - Computing face descriptor from an image/video element
 *   - Matching a live descriptor against the stored student database
 *   - Tuned for high tolerance on partial/angled faces
 */
import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoaded = false;

/**
 * Load all required face-api.js models once.
 */
export async function loadFaceModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  console.log('[QueueSense AI] Face recognition models loaded.');
}

/**
 * Compute face descriptor from HTMLImageElement.
 */
export async function computeDescriptorFromImage(imgElement) {
  try {
    // Tuned detector options with lower threshold and standard input resolution for partial faces
    const detection = await faceapi
      .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    return detection ? detection.descriptor : null;
  } catch (e) {
    console.warn('[FaceAPI] computeDescriptorFromImage error:', e);
    return null;
  }
}

/**
 * Compute a face descriptor directly from a base64 or URL string.
 */
export async function computeDescriptorFromSrc(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const desc = await computeDescriptorFromImage(img);
      resolve(desc);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Build a LabeledFaceDescriptors array from the student database array.
 */
export function buildFaceMatcher(students) {
  const labeled = students
    .filter(s => s.faceDescriptor)
    .map(s => {
      const descriptor = new Float32Array(Object.values(s.faceDescriptor));
      return new faceapi.LabeledFaceDescriptors(
        `${s.name}||${s.id}||${s.queueScore}||${s.registerNumber}||${s.departmentId || ''}`,
        [descriptor]
      );
    });

  if (labeled.length === 0) return null;
  // Increased threshold to 0.60 to accommodate side profiles & partial angles
  return new faceapi.FaceMatcher(labeled, 0.60);
}

/**
 * Detect all faces in a video element and match against known students.
 */
export async function detectAndMatchFaces(videoElement, faceMatcher) {
  if (!videoElement || !faceMatcher) return [];
  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }))
      .withFaceLandmarks(true)
      .withFaceDescriptors();

    return detections.map(d => {
      const match = faceMatcher.findBestMatch(d.descriptor);
      const isUnknown = match.label === 'unknown';
      const parts = match.label.split('||');
      return {
        detection: d.detection,
        label: match.label,
        isUnknown,
        studentName: isUnknown ? 'Unknown Person' : parts[0],
        studentId: isUnknown ? null : parts[1],
        queueScore: isUnknown ? null : parseInt(parts[2], 10),
        registerNumber: isUnknown ? null : parts[3],
        departmentId: isUnknown ? null : parts[4],
        distance: match.distance,
      };
    });
  } catch (e) {
    console.warn('[FaceAPI] detectAndMatchFaces error:', e);
    return [];
  }
}
