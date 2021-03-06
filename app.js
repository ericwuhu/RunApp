const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const layouts = require("express-ejs-layouts");
//const auth = require('./config/auth.js');
const axios = require("axios"); // Importing Axios for APIs


const mongoose = require( 'mongoose' );
//mongoose.connect( `mongodb+srv://${auth.atlasAuth.username}:${auth.atlasAuth.password}@cluster0-yjamu.mongodb.net/authdemo?retryWrites=true&w=majority`);
//mongoose.connect( 'mongodb://localhost/authDemo');
mongoose.connect('mongodb+srv://EricHu:erichu@cluster0.rehti.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'); // Connecting to cloud
const mongoDB_URI = process.env.MONGODB_URI
mongoose.connect(mongoDB_URI)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!**********************************************************************")
});

const authRouter = require('./routes/authentication');
const isLoggedIn = authRouter.isLoggedIn
const loggingRouter = require('./routes/logging');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const toDoRouter = require('./routes/todo');
const toDoAjaxRouter = require('./routes/todoAjax');
const runRouter = require('./routes/run'); // Adding the running route


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(layouts);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(authRouter)
app.use(loggingRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/todo',toDoRouter);
app.use('/todoAjax',toDoAjaxRouter);
app.use('/run', runRouter) // running Router for use

const myLogger = (req,res,next) => {
  console.log('inside the thesting route!')
  next()
}

// Render about page
app.get('/about', (req,res) => {
  res.render('about')
})

// Weather search api
app.get("/weather", (req,res) => {
  res.render("weather")
})

app.post("/weather",
  async (req,res,next) => {
    try {
      const location = req.body.location
      const url = "http://api.weatherapi.com/v1/current.json?key=dab7f57ce9c6486e983182326211606&q="+location+"&aqi=no"
      const result = await axios.get(url)
      // res.json(result.data) // this is used to display it in json

      console.dir(result.data)
      console.log('results')
      console.dir(result.data.results)

      // Sending information to response
      res.locals.results = result.data
      console.dir(result.data)
      res.render('showWeather')

    } catch(error){
      next(error)
    }
})

app.get('/testing',
  myLogger,
isLoggedIn, // Middleware where it sends to log in page if not logged in
(req,res) =>{
  res.render('testing')
})

app.get('/profiles',
    isLoggedIn,
    async (req,res,next) => {
      try {
        res.locals.profiles = await User.find({})
        res.render('profiles')
      }
      catch(e){
        next(e)
      }
    }
  )

  // Implementing a leaderboard
  app.get('/leaderboard',
    async (req,res,next) => {
      try {
        res.locals.items = await RunItem.find({}).sort({min: 1, sec: 1})
        res.render('leaderboard')
      }
      catch(e){
        next(e)
      }
    }
  )

app.use('/publicprofile/:userId',
    async (req,res,next) => {
      try {
        let userId = req.params.userId
        res.locals.profile = await User.findOne({_id:userId})
        res.render('publicprofile')
      }
      catch(e){
        console.log("Error in /profile/userId:")
        next(e)
      }
    }
)


app.get('/profile',
    isLoggedIn,
    (req,res) => {
      res.render('profile')
    })

app.get('/editProfile',
    isLoggedIn,
    (req,res) => res.render('editProfile'))

app.post('/editProfile',
    isLoggedIn,
    async (req,res,next) => {
      try {
        let username = req.body.username
        let age = req.body.age
        req.user.username = username
        req.user.age = age
        req.user.imageURL = req.body.imageURL
        await req.user.save()
        res.redirect('/profile')
      } catch (error) {
        next(error)
      }

    })


app.use('/data',(req,res) => {
  res.json([{a:1,b:2},{a:5,b:3}]);
})

const User = require('./models/User');
const RunItem = require('./models/RunItem');

app.get("/test",async (req,res,next) => {
  try{
    const u = await User.find({})
    console.log("found u "+u)
  }catch(e){
    next(e)
  }

})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
