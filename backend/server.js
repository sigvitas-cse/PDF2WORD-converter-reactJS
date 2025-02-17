require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const qs = require("qs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Adobe API credentials (store in .env file)
const CLIENT_ID = process.env.ADOBE_CLIENT_ID;
const CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET;
// const TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const BASE_URL = "https://pdf-services.adobe.io";

let accessToken = null; // Cache the access token
let tokenExpiry = 0; // Store token expiry timestamp

// Function to fetch new Adobe access token
async function getAccessToken() {
  const TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token";

  const data = qs.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "openid,AdobeID,DCAPI"
  });

  try {
    const response = await axios.post(TOKEN_URL, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    console.log("Success! Received Token:", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error("Error in token request:", error.response?.data || error.message);
  }

}

// Ensure the uploads folder exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// 📌 Upload and Convert PDF to Word
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    console.log("Now inside Upload Section");
    const filePath = req.file.path;
    const token = await getAccessToken();

    // Step 1: Request an upload URL
    const headers = {
      "x-api-key": CLIENT_ID,
      Authorization: `Bearer ${token}`,
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
    console.log("Now inside Status Section");
    const { jobLocation } = req.query;
    const token = await getAccessToken();

    const headers = {
      Authorization: `Bearer ${token}`,
      "x-api-key": CLIENT_ID,
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
    const { downloadUri, filename } = req.query;
    const wordResponse = await axios.get(downloadUri, { responseType: "stream" });

    // Set headers for proper download with dynamic filename
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    // Stream the converted file directly to the client
    wordResponse.data.pipe(res);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Download failed" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
