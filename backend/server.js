require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Adobe API credentials (store in .env file)
const API_KEY = process.env.ADOBE_API_KEY;
const ACCESS_TOKEN = process.env.ADOBE_ACCESS_TOKEN;
const BASE_URL = "https://pdf-services.adobe.io";

// Ensure the uploads folder exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// 📌 Upload and Convert PDF to Word
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Step 1: Request an upload URL
    const headers = {
      "x-api-key": API_KEY,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    const uploadResponse = await axios.post(
      `${BASE_URL}/assets`,
      { mediaType: "application/pdf" },
      { headers }
    );

    const uploadUri = uploadResponse.data.uploadUri;
    const assetId = uploadResponse.data.assetID;

    // Step 2: Upload the PDF file
    const fileData = fs.readFileSync(filePath);
    await axios.put(uploadUri, fileData, {
      headers: { "Content-Type": "application/pdf" },
    });

    // Step 3: Request conversion
    const convertResponse = await axios.post(
      `${BASE_URL}/operation/exportpdf`,
      { assetID: assetId, targetFormat: "docx", ocrLang: "en-US" },
      { headers }
    );

    const jobLocation = convertResponse.headers.location;

    res.json({ jobLocation });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Conversion failed" });
  }
});

// 📌 Check Conversion Status
app.get("/status", async (req, res) => {
  try {
    const { jobLocation } = req.query;

    const headers = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "x-api-key": API_KEY,
    };

    const statusResponse = await axios.get(jobLocation, { headers });
    const jobStatus = statusResponse.data;

    if (jobStatus.status === "done") {
      return res.json({ status: "done", downloadUri: jobStatus.asset.downloadUri });
    }

    res.json({ status: jobStatus.status });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch job status" });
  }
});

// 📌 Download Converted Word File
app.get("/download", async (req, res) => {
  try {
    const { downloadUri } = req.query;

    const wordResponse = await axios.get(downloadUri, { responseType: "stream" });
    const outputFile = `./uploads/converted_${Date.now()}.docx`;
    
    const writer = fs.createWriteStream(outputFile);
    wordResponse.data.pipe(writer);

    writer.on("finish", () => res.download(outputFile));
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Download failed" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));