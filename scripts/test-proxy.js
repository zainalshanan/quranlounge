const axios = require('axios');

const CLIENT_ID = "02b6a41f-d00a-475d-beae-82d5185d6907";
const CLIENT_SECRET = "QaYhiKIibWpADvYztiAt.ebmIY";
const AUTH_ENDPOINT = "https://oauth2.quran.foundation";
const API_BASE = "https://apis.quran.foundation";

async function testAuthAndApi() {
  console.log("1. Testing Token Acquisition...");
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const authRes = await axios.post(`${AUTH_ENDPOINT}/oauth2/token`, 
      "grant_type=client_credentials&scope=content", 
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    
    const token = authRes.data.access_token;
    console.log("Token Acquired Successfully.");

    console.log("\n2. Testing API Call with Token...");
    // Target: /content/api/v4/verses/by_chapter/1
    const apiPath = "/content/api/v4/verses/by_chapter/1";
    const targetUrl = `${API_BASE}${apiPath}?language=ar&words=true&translations=131&per_page=300&word_fields=text_uthmani`;
    
    console.log(`Fetching: ${targetUrl}`);
    
    const apiRes = await axios.get(targetUrl, {
      headers: {
        "x-auth-token": token,
        "x-client-id": CLIENT_ID,
        "Accept": "application/json"
      }
    });

    console.log("API Response Status:", apiRes.status);
    console.log("First Verse Data:", JSON.stringify(apiRes.data.verses?.[0], null, 2).substring(0, 200));

  } catch (error) {
    console.error("ERROR:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Body:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testAuthAndApi();
