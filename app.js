const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const Payment = require('./utils/payment');


const app = express();
const port = 3000;

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// User data (for demonstration purposes)
const users = [{ id: 1, username: 'user', password: 'password', first_name: 'User' }];

// Passport Local Strategy
passport.use(new LocalStrategy(
  (username, password, done) => {
    console.log("username>>", username);
    const user = users.find(u => u.username === username);
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    console.log("Authenticated user>>", user);
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  // done(null, user.id);
  process.nextTick(function() {
    return done(null, user.id);
  });
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  process.nextTick(function() {
    return done(null, user);
  });
  // done(null, user);
});


// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true, // Allow credentials (cookies) to be sent
}));


// Handle POST requests to the '/upload' endpoint
app.post('/upload', upload.single('documentFile'), async (req, res) => {
  try {
    const buffer = req.file.buffer;

    let code = await Payment.decodeQRCode(buffer);
    if (!code) {
      res.send(null).status(401);
    }
    code = JSON.parse(code);
    console.log("code json>", code);

    res.send(code).status(201);

  } catch (err) {
    console.log("error while handling file>>", err);
    res.status(500).send("Internal Server Error");
  }
});


const loginHandler = async (req, res, next) => {
  console.log("req body>>", req.body);
  // Use passport.authenticate with a callback to handle the responses
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'An error occurred during login.', error: err });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // If authentication succeeds, log the user in
    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ success: false, message: 'Failed to log in the user.', error: loginErr });
      }

      // Successful login response
      return res.status(201).json({ success: true, message: 'Login successful!', user: { id: user.id, firstName: user.first_name } });
    });
  })(req, res, next); // Pass req, res, next to the authenticate function
}

app.post('/login', loginHandler);

app.get('/login', (req, res) => {
  res.status(200).send("Login page");
});

app.get('/isValidSession', (req, res) => {
  console.log("user>>", req.user, req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).send({user: req.user});
  }
  else {
    res.status(401).send("Unauthorized");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

