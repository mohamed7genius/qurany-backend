const express = require('express');
require("dotenv").config();
const userRoutes = require('./routes/user');
const PORT = process.env.PORT || process.env.API_PORT || 5000;
const cors = require('cors')
const { verifyAPIKey } = require("./middleware/middleware");
const { connectToDB } = require("./config/database");

const app = express();
app.use(express.json());
app.use(cors({
  origin: function(origin, callback){
    // When testing there's no origin so when need to allow it in development
    /* if( origin != 'http://localhost' ) {
      return callback(`The CORS policy for this site is not allowed`, false);
    } */
    return callback(null, true);
  },
  credentials: true,
}));

app.use(verifyAPIKey);

app.use('/user', userRoutes);

connectToDB(() => {
  app.listen(PORT, function () {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});
