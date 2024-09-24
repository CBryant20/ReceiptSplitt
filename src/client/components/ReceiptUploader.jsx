import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";
import { FaUpload, FaCamera, FaFileUpload, FaSpinner } from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectUserId } from "../features/auth/authSlice";

import "./ReceiptUploader.css";

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const userId = useSelector(selectUserId);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = "grayscale(100%) contrast(150%)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        Tesseract.recognize(blob, "eng", {
          logger: (m) => console.log(m),
        })
          .then(({ data: { text } }) => {
            const items = parseReceiptText(text);
            setParsedItems(items);
            setIsProcessing(false);
          })
          .catch((err) => {
            console.error(err);
            setIsProcessing(false);
          });
      }, "image/png");
    };
  };

  const parseReceiptText = (text) => {
    const lines = text.split("\n");
    return lines
      .map((line, index) => {
        const match = line.match(/(.*?)(\s+[\$]?\d+[\.,]?\d{2})\s*$/);
        if (match) {
          const description = match[1].trim();
          const price = parseFloat(match[2].replace(/[^0-9.-]+/g, ""));
          return { id: index + 1, description, price, selected: false };
        }
        return null;
      })
      .filter((item) => item !== null);
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
        userId,
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

  const calculateSelectedTotal = () => {
    return parsedItems
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + (item.price || 0), 0)
      .toFixed(2);
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

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleGroupSelection = () => {
    const selectedItems = parsedItems.filter((item) => item.selected);
    if (selectedItems.length > 0) {
      setSelectedGroups([...selectedGroups, selectedItems]);
      setParsedItems(parsedItems.filter((item) => !item.selected));
    }
  };

  return (
    <div className='app-container'>
      <h2>Upload Your Receipt</h2>

      <div className='bottom-icons'>
        <button
          className='icon-button'
          onClick={triggerFileInput}
          aria-label='Choose File'
        >
          <FaFileUpload />
          <span>File</span>
        </button>
        <input
          type='file'
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept='image/*'
        />
        <button
          className='icon-button'
          onClick={handleUpload}
          aria-label='Upload Receipt'
        >
          <FaUpload />
          <span>Upload</span>
        </button>
        <button
          className='icon-button'
          onClick={handleOpenCamera}
          aria-label='Use Camera'
        >
          <FaCamera />
          <span>Camera</span>
        </button>
      </div>

      <div className='phone-container'>
        {isProcessing && (
          <div className='processing-container'>
            <FaSpinner className='spinner' />
            <p>Processing your receipt...</p>
          </div>
        )}
        <div className='receipt-content'>
          {parsedItems.length > 0 && (
            <table className='receipt-table'>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Description</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type='checkbox'
                        checked={item.selected || false}
                        onChange={() =>
                          handleItemChange(index, "selected", !item.selected)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        className='description-input'
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        value={item.price || ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                        placeholder={
                          item.price === null ? "No price detected" : ""
                        }
                        className='price-input'
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className='phone-footer'>
          <p className='total-display'>
            Selected Total: ${calculateSelectedTotal()}
          </p>
          <button className='save-button' onClick={handleSave}>
            Save Receipt
          </button>
          <button className='save-button' onClick={handleGroupSelection}>
            Group Selected
          </button>
          {saveStatus && <p>{saveStatus}</p>}
        </div>
      </div>

      <div className='selected-groups-container'>
        {selectedGroups.map((group, groupIndex) => (
          <div key={groupIndex} className='group-breakdown'>
            <h4>Group {groupIndex + 1}</h4>
            <ul>
              {group.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.description} - ${item.price.toFixed(2)}
                </li>
              ))}
            </ul>
            <p>
              Total: $
              {group.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {showCamera && (
        <div className='camera-container'>
          <video ref={videoRef} className='camera-video' />
          <div className='camera-buttons'>
            <button className='capture-button' onClick={handleCapture}>
              Capture Image
            </button>
            <button className='close-button' onClick={stopCamera}>
              Close Camera
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;
