import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setIsProcessing(true);
    Tesseract.recognize(file, "eng")
      .then(({ data: { text } }) => {
        const items = parseReceiptText(text);
        setParsedItems(items);
        setIsProcessing(false);
      })
      .catch((err) => {
        console.error(err);
        setIsProcessing(false);
      });
  };

  const parseReceiptText = (text) => {
    const lines = text.split("\n");
    const parsedItems = lines.map((line) => {
      const match = line.match(/(.*)\s+\$(\d+\.\d{2})$/);
      if (match) {
        return { description: match[1].trim(), price: parseFloat(match[2]) };
      }
      return { description: line.trim(), price: null };
    });
    return parsedItems.filter((item) => item.price !== null);
  };

  const handleItemChange = (index, key, value) => {
    const updatedItems = [...parsedItems];
    updatedItems[index][key] = value;
    setParsedItems(updatedItems);
  };

  const handleSave = () => {
    setSaveStatus("Saving...");
    axios
      .post("/upload-receipt", {
        userId: 1, // Replace with actual user ID
        items: parsedItems,
        subtotal: calculateSubtotal(parsedItems),
        tax: 0.08 * calculateSubtotal(parsedItems),
        total: calculateSubtotal(parsedItems) * 1.08,
      })
      .then((response) => {
        setSaveStatus("Receipt saved successfully!");
        console.log("Receipt saved:", response.data);
      })
      .catch((error) => {
        setSaveStatus("Error saving receipt.");
        console.error("Error saving receipt:", error);
      });
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const handleOpenCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      processFile(blob);
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  return (
    <div>
      <h2>Upload Your Receipt</h2>
      <input type='file' onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || isProcessing}>
        {isProcessing ? "Processing..." : "Upload Receipt"}
      </button>

      <button onClick={handleOpenCamera}>Use Camera</button>

      {showCamera && (
        <div className='camera-container'>
          <video ref={videoRef} style={{ width: "100%", maxHeight: "400px" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button onClick={handleCapture}>Capture Image</button>
          <button onClick={stopCamera}>Close Camera</button>
        </div>
      )}

      {isProcessing && <p>Processing your receipt...</p>}

      {parsedItems.length > 0 && (
        <div>
          <h3>Confirm Items</h3>
          {parsedItems.map((item, index) => (
            <div key={index}>
              <input
                type='text'
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
              />
              <input
                type='number'
                value={item.price || ""}
                onChange={(e) =>
                  handleItemChange(index, "price", parseFloat(e.target.value))
                }
              />
            </div>
          ))}
          <button onClick={handleSave}>Save Receipt</button>
          {saveStatus && <p>{saveStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;
