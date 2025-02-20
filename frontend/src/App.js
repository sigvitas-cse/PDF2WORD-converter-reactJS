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
    onDrop: (acceptedFiles) => {setFile(acceptedFiles[0]); 
    setStatus("")
    }
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
      setStatus("Processing file.It takes 1-2 minutes please wait...");
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

        // Inside the checkStatus function when conversion is done
        if (response.data.status === "done") {
          clearInterval(polling);

          // Generate the new filename
          const newFilename = file.name.replace(/\.pdf$/i, '.docx');

          // Encode parameters for the download URL
          const encodedDownloadUri = encodeURIComponent(response.data.downloadUri);
          const encodedFilename = encodeURIComponent(newFilename);

          // Construct the download link pointing to your server's /download endpoint
          const downloadLink = `${BACKEND_URL}/download?downloadUri=${encodedDownloadUri}&filename=${encodedFilename}`;

          setDownloadLink(downloadLink);
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

      <div {...getRootProps()} style={{ border: "2px dashed blue", padding: "20px", cursor: "pointer" }}>
        <input {...getInputProps()} />
        {file ? <p>{file.name}</p> : <p>Drag & Drop a PDF or Click to Select</p>}
      </div>

      {status === "Conversion complete! Click to download." || status === "Processing file.It takes 1-2 minutes please wait..." ? null : (<button onClick={handleUpload} disabled={!file} style={{
        marginTop: "10px",
        padding: "10px 20px",
        fontSize: "16px",
        fontWeight: "bold",
        backgroundColor: file ? "#4CAF50" : "#ccc",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: file ? "pointer" : "not-allowed",
        transition: "background-color 0.3s ease",
      }}>
        Convert PDF to Word
      </button>)}

      <p>{status}</p>
      {downloadLink && file && status === "Conversion complete! Click to download." ? (
        <a
          href={downloadLink}
          download={file.name.replace(/\.pdf$/i, ".docx")}
        >
          <button
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#007BFF")}
            onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
          >
            Download Word File
          </button>

        </a>
      ) : null}
      <footer style={{ textAlign: "center", padding: "5px", marginTop: "350px", background: "#f1f1f1", fontSize: "15px" }}>
        <p>&copy; 2025 TriangleIP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;