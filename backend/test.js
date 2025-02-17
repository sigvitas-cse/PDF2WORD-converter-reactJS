const axios = require("axios");
const qs = require("qs");

async function testAdobeTokenURL() {
    const TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token";
    
    const data = qs.stringify({
        client_id: "bf597c6fb56f4fdc9807771b20802dc2",
        client_secret: "p8e-V8IZNLuNg5r_DvZRacRCkfmHWsF5Q-II",
        grant_type: "client_credentials",
        scope: "openid,AdobeID,DCAPI"
    });

    try {
        const response = await axios.post(TOKEN_URL, data, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        console.log("Success! Received Token:", response.data.access_token);
    } catch (error) {
        console.error("Error in token request:", error.response?.data || error.message);
    }
}

testAdobeTokenURL();
