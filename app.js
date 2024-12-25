const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

const Payment = require('./utils/payment');
const { users, transactions } = require('./dummyData');


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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  // console.log("entered isauthenticated>", req.isAuthenticated());
    if (req.isAuthenticated()) {
      return next(); // Proceed to the next middleware or route handler
    }
    res.status(401).json({ success: false, message: 'Unauthorized: Session is invalid or expired.' });
  }

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
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  // done(null, user.id);
  process.nextTick(function() {
    return done(null, user);
  });
});

passport.deserializeUser((curUser, done) => {
  const user = users.find(u => u.id === curUser.id);
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
      return res.status(201).json({ success: true, message: 'Login successful!', user });
    });
  })(req, res, next); // Pass req, res, next to the authenticate function
}

app.post('/login', loginHandler);

app.post('/register', (req, res, next) => {
  console.log("req body>>", req.body);
  const { username, password, walletAddress } = req.body;
  const user = {
    id: users.length + 1,
    username,
    password,
    isParent: false,
    address: walletAddress,
    familyId: 0
  }
  users.push(user);
  loginHandler(req, res, next);
});


app.get('/isValidSession', isAuthenticated, (req, res) => {
  res.status(200).send({user: req.user});
});

app.post('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to log out the user.', error: err });
    }
    res.status(200).send("Logged out");
  });
});

app.post('/makePayment', isAuthenticated, (req, res) => {
  console.log("req body>>", req.body);
  const { to, amount, purpose } = req.body;
  const from = req.user.id;
  const transaction = {
    id: transactions.length + 1,
    from,
    to,
    amount,
    date: new Date().toLocaleDateString(),
    purpose,
    status: 'pending approval'
  }
  transactions.push(transaction);
  res.status(201).send({transaction});
});

app.post('/addMember', isAuthenticated, (req, res) => {
  console.log("req body>>", req.body);
  const { isParent, walletAddress } = req.body;
  const user = users.find(u => u.address === walletAddress);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  user.familyId = req.user.familyId;
  user.isParent = isParent;
  res.status(201).send({user});
});

app.post('/approveOrRejectTransaction', isAuthenticated, (req, res) => {
  console.log("req body>>", req.body);
  const { transactionId, isApproved } = req.body;

  if(req.user.isParent === false){
    res.status(401).send("Unauthorized");
  }

  const transaction = transactions.find(t => t.id === transactionId);
  if(isApproved){
    transaction.status = 'completed';
  }else{
    transaction.status = 'rejected';
  }
  res.status(201).send({transaction});
});

app.get('/getTransactions', isAuthenticated, (req, res) => {
  if(req.query.status) {
    console.log("status>>", req.query.status);
    //need to get all pending transactions where the given user is the parent -> check for status as pending approval and the user with from address should have the same familiyId as the user/parent
    if(req.user.isParent === false){
      res.status(401).send("Unauthorized");
    }
    const pendingTransactions = transactions.filter(t => t.status.toLowerCase().includes(req.query.status));
    
    const filteredTransactions = pendingTransactions.filter(item =>{
      const fromUser = users.find(u => u.id === item.from);
      if(fromUser.familyId === req.user.familyId){ //They are part of the same family
        return item;
      }
    })

    res.status(200).send({transactions: filteredTransactions});
  }else{
    res.status(200).send({transactions: transactions.filter(t => t.from === req.user.id)});
  }
});

app.get("*", isAuthenticated, (req, res) => {
  console.log("entered get *");
  console.log(path.join(__dirname, "build", "index.html"));
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

