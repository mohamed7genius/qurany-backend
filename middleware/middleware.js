const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  const token = req.body.token;

  if (!token) {
    return res.status(403).json({ errorMessage: `noToken` });
  }
  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ errorMessage: `invalidToken` });
  }
  return next();
};

const verifyAPIKey = (req, res, next) => {
  const apiKey = req.header('api-key');

  console.log('apiKey', apiKey);

  if ( !apiKey || apiKey != (process.env.API_KEY || 'CTQ1OTRjYmRhN2EyMmRlMTE4NTc1YTk4NDE')  ) {
    return res.status(401).json({ errorMessage: `unauthorized` });
  }

  return next();
};

module.exports = {verifyToken, verifyAPIKey};
