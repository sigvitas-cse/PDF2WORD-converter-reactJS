import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import logo from './assets/logo.png';

const BACKEND_URL = process.env.REACT_APP_API_URL;
console.log(BACKEND_URL);


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
      // const response = await axios.post("http://localhost:5000/upload", formData, {
      //   headers: { "Content-Type": "multipart/form-data" },
      // });
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
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
        // const response = await axios.get("http://localhost:5000/status", {
        //   params: { jobLocation },
        // });
        const response = await axios.get(`${BACKEND_URL}/status`, {
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
    <div style={{ padding: "20px", textAlign: "center" }}>
       <div className="logo-container">
        <img src={logo} alt="Triangle IP Logo" className="logo" />
      </div>
      <h2>PDF to Word Converter</h2>
      
      <div {...getRootProps()} style={{ border: "2px dashed yellow", padding: "20px", cursor: "pointer" }}>
        <input {...getInputProps()} />
        {file ? <p>{file.name}</p> : <p>Drag & Drop a PDF or Click to Select</p>}
      </div>

      <button onClick={handleUpload} disabled={!file} style={{ marginTop: "10px" }}>
        Convert PDF to Word
      </button>

      <p>{status}</p>

      {downloadLink && (
        <a href={downloadLink} download="converted.docx">
          <button>Download Word File</button>
        </a>
      )}
    </div>
  );
};

export default App;
