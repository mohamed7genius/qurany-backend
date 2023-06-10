const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middleware/middleware");

const User = require("../model/user");
const userRoutes = express.Router();

userRoutes.post("/register", async (req, res) => {
  try {
    // Get user input
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    // Validate user input
    if (!(email && password && name )) {
      res.status(400).json({ errorMessage: `missingInput` });
    }

    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).json({ errorMessage: `alreadyExists` });
    }

    //Encrypt user password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      name,
      email: email.toLowerCase(), //  convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "1y",
      }
    );
    // save user token
    user.token = token;

    // return new user
    res.status(201).json({ token, name, email });
  } catch (err) {
    console.log(err);
    res.status(500).json({ errorMessage: `serverError` })
  }
});

userRoutes.post("/login", async (req, res) => {
  try {
    // Get user input : not descruting as it will throw different error code
    const email = req.body.email;
    const password = req.body.password;

    // Validate user input
    if (!(email && password)) {
      res.status(400).json({ errorMessage: `missingInput` });
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "1y",
        }
      );

      // save user token
      user.token = token;

      // user
      res.status(200).json({token, name: user.name, email: user.email });
    } else {
      res.status(400).json({ errorMessage: `invalidCredentials` });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ errorMessage: `serverError` });
  }
});

userRoutes.put("/update", verifyToken, async (req, res) => {
  const email = req.body?.email;
  const score = req.body?.score;
  const level = req.body?.level;

  if ( !email ) {
    res.status(400).json({ errorMessage: `missingInput` });
  }

  try {
    await User.findOneAndUpdate({ email }, { score, level });    
  } catch ( err ) {
    console.log(err);
    res.status(500).json({ errorMessage: `serverError` });
  }
  res.status(200).json({});
});

userRoutes.post("/scores", verifyToken, async (req, res) => {
  const email = req.body?.email;
  console.log('req', email);
  if ( !req.body.email ) {
    res.status(400).json({ errorMessage: `unregisteredUser` });
  }

  const users = await User.find({});
  const usersScores = users.map((user) => {
    const userScore = {
      name: user.name,
      score: user.score,
    };
    if ( user.email == email ) {
      userScore.currentUser = true;
    }
    return userScore;
  });
  res.status(200).send(JSON.stringify({ scores: usersScores.sort((p1, p2) => (p1.score < p2.score) ? 1 : (p1.score > p2.score) ? -1 : 0) }));
});

userRoutes.put("/register-guest", verifyToken, async (req, res) => {
  try {
    const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const level = req.body.level || 0;
  const score = req.body.score || 0;

  if (!(email && name && password)) {
    res.status(400).json({ errorMessage: `missingInput` });
  }

  // Validate if user exist in our database
  const oldUser = await User.findOne({ email });

  if (oldUser) {
    return res.status(409).json({ errorMessage: `alreadyExists` });
  }

  //Encrypt user password
  const encryptedPassword = await bcrypt.hash(password, 10);

  // Create user in our database
  const user = await User.create({
    name,
    email: email.toLowerCase(), //  convert email to lowercase
    password: encryptedPassword,
    score,
    level,
  });

  // Create token
  const token = jwt.sign(
    { user_id: user._id, email },
    process.env.TOKEN_KEY,
    {
      expiresIn: "1y",
    }
  );
  // save user token
  user.token = token;

  // return new user
  res.status(201).json({ token, name: user.name, email: user.email });

  } catch (err) {
    console.log(err);
    res.status(500).json({ errorMessage: `serverError` })
  }
})


userRoutes.post("/send-email", async (req, res) => {
  try {
    const email = req.body.email;
    const message = req.body.message;

    if (!(email && message)) {
      res.status(400).json({ errorMessage: `missingInput` });
    }

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USERNAME, // generated ethereal user
        pass: process.env.SMTP_PASSWORD, // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `Qurany app | ${email}`, // sender address
      to: process.env.SMTP_EMAIL, // list of receivers
      subject: "New message from user", // Subject line
      text: message, // plain text body
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: "emailSent" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ errorMessage: `serverError` });
  }
});

// This should be the last route else any after it won't work
userRoutes.use("*", (req, res) => {
  res.status(404).json({ errorMessage: `notFound` });
});

module.exports = userRoutes;