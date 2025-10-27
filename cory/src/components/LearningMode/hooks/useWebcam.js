import { useEffect, useState, useRef, useCallback } from 'react';

export const useWebcam = () => {
  const webcamMainRef = useRef(null);
  const webcamPipRef = useRef(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Initialize webcam
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false 
        });
        setWebcamStream(stream);
        setIsWebcamActive(true);
      } catch (error) {
        console.error('Error accessing webcam:', error);
        // Continue without webcam if permission denied
      }
    };

    initWebcam();

    // Cleanup webcam stream on unmount
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Assign stream to video elements; re-run when DOM nodes change
  useEffect(() => {
    if (!webcamStream) return;

    if (webcamMainRef.current && webcamMainRef.current.srcObject !== webcamStream) {
      webcamMainRef.current.srcObject = webcamStream;
    }
    if (webcamPipRef.current && webcamPipRef.current.srcObject !== webcamStream) {
      webcamPipRef.current.srcObject = webcamStream;
    }
    // It's intentional to depend on .current so reassignment after remount triggers this effect
  }, [webcamStream, webcamMainRef.current, webcamPipRef.current]);

  return { 
    webcamMainRef, 
    webcamPipRef, 
    isWebcamActive,
    webcamStream,
    attachWebcamMain: useCallback((el) => {
      webcamMainRef.current = el;
      if (el && webcamStream) {
        el.srcObject = webcamStream;
        if (typeof el.play === 'function') {
          el.play().catch(() => {});
        }
      }
    }, [webcamStream]),
    attachWebcamPip: useCallback((el) => {
      webcamPipRef.current = el;
      if (el && webcamStream) {
        el.srcObject = webcamStream;
        if (typeof el.play === 'function') {
          el.play().catch(() => {});
        }
      }
    }, [webcamStream])
  };
};
