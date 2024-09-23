import React, { useState } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;

    setIsProcessing(true);

    // Use Tesseract to scan the receipt
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

  // Improved function to parse the OCR text into items
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

  return (
    <div>
      <h2>Upload Your Receipt</h2>
      <input type='file' onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || isProcessing}>
        {isProcessing ? "Processing..." : "Upload Receipt"}
      </button>

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
