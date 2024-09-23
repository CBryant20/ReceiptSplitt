import { useSelector } from "react-redux";
import { selectToken } from "../auth/authSlice.js";
import ReceiptImage from "./ReceiptImage";
import "./Home.less";

export default function Home() {
  const token = useSelector(selectToken);

  const handleLoginClick = () => {
    window.location.href = "/login";
  };

  const handleUploadClick = () => {
    window.location.href = "/upload-receipt";
  };

  return (
    <div className='home-container'>
      <h1>Welcome to the Receipt Splitter App</h1>
      <ReceiptImage />

      {!token ? (
        <div className='login-icon' onClick={handleLoginClick}>
          Log In
        </div>
      ) : (
        <div className='upload-button' onClick={handleUploadClick}>
          Upload Receipt
        </div>
      )}
    </div>
  );
}
