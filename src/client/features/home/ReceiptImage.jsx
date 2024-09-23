import React from "react";
import receiptImage from "../../images/Receipt_Split_Home.webp";
import "./ReceiptImage.css";

const ReceiptImage = () => {
  return (
    <div className='receipt-image-container'>
      <img src={receiptImage} alt='Receipt Split' className='receipt-image' />
    </div>
  );
};

export default ReceiptImage;
