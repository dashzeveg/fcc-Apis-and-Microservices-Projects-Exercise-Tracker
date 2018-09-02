const express = require('express')
const app = express()
const url = require('url');  
const bodyParser = require('body-parser')
const shortid = require('shortid');

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: {
    'type': String,
    'default': shortid.generate
  },
  username: String
});
const Users = mongoose.model('exercise_users', userSchema);

/*
log: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: { type: Date, default: Date.now }
  }],
*/

const exerciseSchema = new Schema({
  _id: {
    'type': String,
    'default': shortid.generate
  },
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: { type: Date, default: Date.now }
});
//date: { type: Date, default: Date.now }
const Exercises = mongoose.model('exercise_exercises', exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.route('/api/exercise/new-user')
  .post(function (req, res) {
    
    let newUser = new Users({ username: req.body.username });
    newUser.save(function (err, doc) {
      if (err) return err;
      // saved!
      res.json({"username": doc.username, "_id": doc._id});
    });
  
  });

app.route('/api/exercise/add')
  .post(function (req, res) {
  
    if (req.body.userId === '')
      res.json({"error": "userId is empty!"});
  
    if (req.body.description == '')
      res.json({"error": "description is empty!"});
        
    if (req.body.duration == '')
      res.json({"error": "duration is empty!"});
  
    
    Users.findOne({ '_id': req.body.userId }, function (err, doc) {
      if (err) 
        console.err( err );
      if (!doc)
        res.json({"error": "userId not found! The user may not register!"});
      
      if (doc) {
        
        let query;
        
        if(req.body.date == '') {
          query = { userId: req.body.userId, description: req.body.description, duration: req.body.duration };
        } else {
          query = { userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: req.body.date };
        }
        
        Exercises.create(query, function (err1, doc1) {
          if (err1) console.log(err1);
          // saved!
          console.log(doc1);
          res.json({"_id": doc._id, "username": doc.username, "description": doc1.description, "duration": doc1.duration, "date": doc1.date});
        });
      }
    });
    
  });

app.route('/api/exercise/log')
  .get(function (req, res) {
  
    if(!req.query.userId)
      res.json({"error": "userId is required!"});
  
    Users.findOne({ '_id': req.query.userId }, function (err, doc) {
      if (err) 
        console.err( err );
      if (!doc)
        res.json({"error": "userId not found! The user may not register!"});
      
      if (doc) {
        //.where('date').gte('2018-08-25').lte('2018-09-02').limit(req.query.limit)
        
        let q;
        let query;
        
        if(req.query.from && req.query.to)
          q = { userId: req.query.userId, "date": {"$gte": new Date(req.query.from), "$lte": new Date(req.query.to)} };
        else 
          q = { userId: req.query.userId };
        
        query=Exercises.find(q);
        
        //query.where('date').gte(new Date(req.query.from)).lte(new Date(req.query.to));
        
        if(req.query.limit)
          query.limit(Number(req.query.limit));
        
        query.select('-_id description duration date');
        query.exec(function (err1, doc1) {
          if (err1) 
            console.err( err1 );
          console.log(doc1);
          res.json({"_id": doc._id, "username": doc.username, "count": doc1.length, "log": doc1});
        });
      }
    });

  });


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
