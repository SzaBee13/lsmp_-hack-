module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID || "",
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET || "",
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || "",
    OAUTH_SCOPE: process.env.OAUTH_SCOPE || "",
    OAUTH_AUTHORIZE_URL: process.env.OAUTH_AUTHORIZE_URL || "",
    OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL || ""
  });
};
