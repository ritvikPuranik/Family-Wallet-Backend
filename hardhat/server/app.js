const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const hre = require("hardhat");
const { ethers } = hre;


const Payment = require('./utils/payment');
const { users, transactions } = require('./dummyData');
const deployContract = require('./deploy'); // Import the deployment script

let SMART_CONTRACT, PROVIDER;

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
async function isAuthenticated(req, res, next) {
  // console.log("entered isauthenticated>", req.isAuthenticated(), req.user);
  if (req.isAuthenticated()) {
    const userFound = await SMART_CONTRACT.getUser(req.user.id);
    const [id, usernameSC, passwordSC, isParentSC, familyIdSC] = userFound;
    req.user = {
      id,
      username: usernameSC,
      isParent: isParentSC,
      familyId: Number(familyIdSC)
    };

    return next(); // Proceed to the next middleware or route handler
  }
  res.status(401).json({ success: false, message: 'Unauthorized: Session is invalid or expired.' });
}

// Passport Local Strategy
passport.use(new LocalStrategy(
  // { usernameField: 'account', passwordField: 'password', passReqToCallback: true },
  { usernameField: 'account', passwordField: 'password' },
  async (username, password, done) => {
    // const { account } = req.body;
    console.log("username>>", username);
    try {
      const userFound = await SMART_CONTRACT.getUser(username);
      const [id, usernameSC, passwordSC, isParentSC, familyIdSC] = userFound;

      // const user = users.find(u => u.username === username);
      if (username !== usernameSC.toLowerCase()) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (password !== passwordSC) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      const user = {
        id,
        username: usernameSC,
        isParent: isParentSC,
        familyId: Number(familyIdSC)
      };
      return done(null, user);

    } catch (err) {
      console.log("error while getting user>>", err);
      return done(null, false, { message: 'Incorrect username or password.' });
    }
  }
));

passport.serializeUser((user, done) => {
  // done(null, user.id);
  process.nextTick(function () {
    return done(null, user);
  });
});

passport.deserializeUser(async (curUser, done) => {
  const userFound = await SMART_CONTRACT.getUser(curUser.id);
  const [id, username, isParent, familyId] = userFound;
  const user = {
    id,
    username,
    isParent,
    familyId: Number(familyId)
  };
  // console.log("curUser at deserialize>", curUser);
  process.nextTick(function () {
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

const impersonate = async (address) => {
  await PROVIDER.send('hardhat_impersonateAccount', [address]);
  let parentSigner = await PROVIDER.getSigner(address);
  console.log("parentSigner>>", parentSigner);
  let impersonatedContract = SMART_CONTRACT.connect(parentSigner);
  console.log("impoersonatedContract>>", await impersonatedContract.getAddress());
  return impersonatedContract;
}

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
  console.log("req body at handler>>", req.body);
  // Use passport.authenticate with a callback to handle the responses
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'An error occurred during login.', error: err });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: info.message });
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

app.post('/register', async (req, res, next) => {
  console.log("req body>>", req.body);
  const { account, password } = req.body;
  await SMART_CONTRACT.registerUser(account, password);

  loginHandler(req, res, next);
});


app.get('/isValidSession', isAuthenticated, async (req, res) => {
  res.status(200).send({ user: req.user });
});

app.post('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to log out the user.', error: err });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to destroy the session.', error: err });
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.status(200).send("Logged out");
    });
  });
});

app.post('/makePayment', isAuthenticated, async (req, res) => {
  console.log("req body>>", req.body);
  const { to, amount, purpose } = req.body;

  const impersonatedContract = await impersonate(req.user.id);
  await impersonatedContract.makePayment(to, amount, purpose);
  await PROVIDER.send('hardhat_stopImpersonatingAccount', [req.user.id]);

  res.status(201).send({ status: true });
});

app.post('/addMember', isAuthenticated, async (req, res) => {
  console.log("req body>>", req.body);
  const { isParent, userId } = req.body;

  const impersonatedContract = await impersonate(req.user.id);
  await impersonatedContract.addMember(userId, isParent);
  await PROVIDER.send('hardhat_stopImpersonatingAccount', [req.user.id]);
  req.user.familyId = userId;
  req.user.isParent = isParent;

  res.status(201).send({ success: true });
});

app.post('/approveOrRejectTransaction', isAuthenticated, async(req, res) => {
  console.log("req body>>", req.body);
  const { transactionId, isApproved } = req.body;
  
  if (req.user.isParent === false) {
    res.status(401).send("Unauthorized");
  }
  const impersonatedContract = await impersonate(req.user.id);
  const isSuccessful = await impersonatedContract.approveOrRejectTxn(transactionId, isApproved);
  await PROVIDER.send('hardhat_stopImpersonatingAccount', [req.user.id]);

  isSuccessful ? res.status(201).send({ transactionId }) : res.status(500).send("Internal Server Error");
});

app.get('/getTransactions', isAuthenticated, async (req, res) => {
  const transactions = await SMART_CONTRACT.getTransactions();
  if (req.query.status) {//need to get all pending transactions where the given user is the parent -> check for status as pending approval and the user with from address should have the same familiyId as the user/parent
    console.log("status>>", req.query.status);
    if (req.user.isParent === false) {
      res.status(401).send("Unauthorized");
    }

    const pendingTransactions = [];
    transactions.map(t => {
      let [id, from, to, amount, timestamp, purpose, status] = t;
      if (status.toLowerCase().includes(req.query.status)) {
        pendingTransactions.push({
          id: Number(id),
          from,
          to,
          amount: Number(amount),
          date: new Date(Number(timestamp)).toLocaleDateString(),
          purpose,
          status
        });
      }
    });

    const filteredTransactions = [];
    await Promise.all(pendingTransactions.map(async (item) => {
      if (item) {
        const [, , , , familyId] = await SMART_CONTRACT.getUser(item.from);
        if (Number(familyId) == Number(req.user.familyId)) { //They are part of the same family
          filteredTransactions.push(item);
        }
      }
    }));

    res.status(200).send({ transactions: filteredTransactions });
  } else {
    let filteredTransactions = [];
    transactions.map(t => {
      let [id, from, to, amount, timestamp, purpose, status] = t;
      if (from === req.user.id) {
        filteredTransactions.push({
          id: Number(id),
          from,
          to,
          amount: Number(amount),
          date: new Date(Number(timestamp)).toLocaleDateString(),
          purpose,
          status
        });
      }
    })
    // console.log("filteredTxns>>", filteredTransactions);
    res.status(200).send({ transactions: filteredTransactions });
  }
});

app.get("*", isAuthenticated, (req, res) => {
  console.log("entered get *");
  console.log(path.join(__dirname, "build", "index.html"));
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Deploy the Users contract on server start
deployContract().then((contract) => {
  [SMART_CONTRACT, PROVIDER] = contract;
}).catch((error) => {
  console.error('Failed to deploy contract:', error);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

