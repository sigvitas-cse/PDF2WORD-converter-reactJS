import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./App.css"; // Import CSS file
import logo from './assets/logo.png';


const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const App = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [downloadLink, setDownloadLink] = useState("");

  const { getRootProps, getInputProps } = useDropzone({
    accept: "application/pdf",
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
  });

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");

    setStatus("Uploading file...");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await axios.post(API_BASE_URL+"/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus("Processing file...");
      checkStatus(response.data.jobLocation);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("Upload failed. Try again.");
    }
  };

  const checkStatus = async (jobLocation) => {
    let polling = setInterval(async () => {
      try {
        const response = await axios.get(API_BASE_URL+"/status", {
          params: { jobLocation },
        });

        if (response.data.status === "done") {
          clearInterval(polling);
          setDownloadLink(response.data.downloadUri);
          setStatus("Conversion complete! Click to download.");
        }
      } catch (error) {
        console.error("Status check failed:", error);
        setStatus("Error checking status.");
      }
    }, 5000);
  };

  return (
    <div className="container">
    <div className="logo-container">
        <img src={logo} alt="Triangle IP Logo" className="logo" />
      </div>

      <h1>PDF to Word Converter</h1>

      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        {file ? <p>{file.name}</p> : <p>Drag & Drop a PDF or Click to Select</p>}
      </div>

      <button className="upload-btn" onClick={handleUpload} disabled={!file}>
        Convert PDF to Word
      </button>

      <p className="status">{status}</p>

      {downloadLink && (
        <a href={downloadLink} download="converted.docx">
          <button className="download-btn">Download Word File</button>
        </a>
      )}
    </div>
  );
};

export default App;
