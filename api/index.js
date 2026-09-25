module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.removeHeader("X-Powered-By");

  res.status(200).json({
    status: "success",
    message: "Number Info API is Running ✅",
    endpoints: {
      info: "/api/info?number=XXXXXXXXXX",
    },
    credit: "@RaiJexo",
    Support: "@editz900s",
  });
};
