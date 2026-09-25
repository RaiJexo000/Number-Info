const axios = require("axios");

// 🔑 Source URL — env variable me rakho (code me hardcode mat karo)
const SOURCE_API_URL = process.env.SOURCE_API_URL;
const SOURCE_PARAM = process.env.SOURCE_PARAM || "Astha";

// 🎯 Sirf ye fields output me jayengi
const ALLOWED_FIELDS = [
  "mobile",
  "name",
  "fname",
  "address",
  "alt",
  "circle",
  "id",
  "email",
];

// 🧱 Blank template
function blankData(mobile = null) {
  const obj = {};
  for (const key of ALLOWED_FIELDS) {
    obj[key] = key === "mobile" ? mobile : null;
  }
  return obj;
}

// 🎨 Branding wrapper — SAME structure har case me
function brandedResponse(status, data, message = null) {
  const out = {
    status: status,
    data: data,
    credit: "@RaiJexo",
    Support: "@editz900s",
  };
  if (message) out.message = message;
  return out;
}

// 🛡️ Safe sender — always returns branded output, kabhi crash nahi
function safeSend(res, payload) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
    return res.status(200).json(payload);
  } catch (e) {
    // Agar res bhi fail ho jaye to bhi branded output
    return res.end(
      JSON.stringify(brandedResponse("error", blankData(), "Request failed"))
    );
  }
}

// 🚀 Main Handler
module.exports = async (req, res) => {
  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  let cleanNumber = null;

  try {
    const { number } = req.query;

    // ❌ Case 1: Number nahi diya
    if (!number) {
      return safeSend(
        res,
        brandedResponse(
          "error",
          blankData(),
          "Please provide a number. Example: ?number=8348725603"
        )
      );
    }

    // 🧹 Clean number
    cleanNumber = String(number).replace(/\D/g, "").slice(-10);

    // ❌ Case 2: Invalid number
    if (cleanNumber.length !== 10) {
      return safeSend(
        res,
        brandedResponse(
          "error",
          blankData(cleanNumber || null),
          "Invalid mobile number. Please provide a 10 digit number."
        )
      );
    }

    // 🛡️ Source URL check (agar env me nahi hai to bhi branded output)
    if (!SOURCE_API_URL) {
      console.error("[CONFIG ERROR] SOURCE_API_URL missing");
      return safeSend(
        res,
        brandedResponse(
          "error",
          blankData(cleanNumber),
          "Service temporarily unavailable. Please try again later."
        )
      );
    }

    // 📡 Source API fetch — sab kuch try/catch me wrapped
    let sourceData = null;
    try {
      const response = await axios.get(SOURCE_API_URL, {
        params: { [SOURCE_PARAM]: cleanNumber },
        timeout: 25000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        // 🛡️ Axios ko bolo ki error throw kare to hum handle karenge
        validateStatus: () => true,
      });
      sourceData = response.data;
    } catch (netErr) {
      // ❌ Case 3: Network error — koi source detail leak nahi
      console.error("[NET ERROR]", netErr.code || netErr.message);
      return safeSend(
        res,
        brandedResponse(
          "error",
          blankData(cleanNumber),
          "Service busy. Please try again in a moment."
        )
      );
    }

    // ❌ Case 4: Source ne galat response diya
    if (
      !sourceData ||
      typeof sourceData !== "object" ||
      sourceData.status !== "success" ||
      !sourceData.data ||
      typeof sourceData.data !== "object"
    ) {
      return safeSend(
        res,
        brandedResponse(
          "error",
          blankData(cleanNumber),
          "Number info not found"
        )
      );
    }

    // 🧹 Sirf allowed fields — source branding strip
    const cleanData = {};
    for (const key of ALLOWED_FIELDS) {
      cleanData[key] = sourceData.data[key] ?? null;
    }

    // ✅ Case 5: Success
    return safeSend(res, brandedResponse("success", cleanData));
  } catch (err) {
    // ❌ Case 6: Koi bhi unexpected error — sirf branded output
    console.error("[UNEXPECTED]", err && err.message ? err.message : "unknown");
    return safeSend(
      res,
      brandedResponse(
        "error",
        blankData(cleanNumber),
        "Something went wrong. Please try again."
      )
    );
  }
};
