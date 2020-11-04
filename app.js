//jshint esversion:6
require('dotenv').config();
const express = require("express");
const axios=require("axios")
const https=require("https")
const  findOrCreate = require('mongoose-findorcreate')
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose=require('mongoose');
const session = require('express-session')
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const ObjectId=require("mongodb").ObjectID

const app = express();


const aboutContent = "Share your amazing experiences";
const today = new Date();
            const dateTime = today.getDate()+'-'+(today.getMonth()+1)+'-'+ today.getFullYear()+ ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
console.log(dateTime)


app.set('view engine', 'ejs');



app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
secret:"Our little secret.",

resave:false,
saveUninitialised:false,

}))

app.use(passport.initialize());
app.use(passport.session())



mongoose.connect("mongodb+srv://admin:rinka@cluster0.4p2qd.mongodb.net/blogDB?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set("useCreateIndex",true)

const blogSchema={
  title:String,
  content:String,
  timestamp:String,
  likes:Number,
}
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  timestamp:String,
  likedPost:String,

})

const commentSchema={
  reply:String
}


userSchema.plugin(passportLocalMongoose)

userSchema.plugin(findOrCreate)
const User= new mongoose.model('User',userSchema)
const Blog=mongoose.model("Blog",blogSchema)
const Comment=mongoose.model("Comment",commentSchema)


passport.use(User.createStrategy())



passport.serializeUser(function(user,done){
  done(null,user.id)
})
passport.deserializeUser(function(id,done){
User.findById(id,function(err,user){
done(err,user)
})
})

let x="" ;let y="";

passport.use(new GoogleStrategy({
  clientID:process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/home",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile)
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    console.log(profile.photos.value)
    x=profile.name.givenName;y=profile.photos[0].value
    console.log(y)
    return cb(err, user);
  });
}
));





app.get("/",function(req,res){
  res.render("welcome")
    
})

app.get("/auth/google",
  passport.authenticate("google",{ scope: ["profile"] }))

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/home");
  });





app.get("/home",function(req, res){
  if(req.isAuthenticated())
  {  Blog.find({},function(err,article){
      if(err){
        
       console.log(err)
      }
        else
     {
      article.sort((a,b)=>{  return new Date(b.timestamp) - new Date(a.timestamp);})
          res.render("home", {posts:article,username:x,photo:y})
        }})
      }
        else
        {
            res.redirect("/login")
        }
  

})
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})
app.get("/login",function(req,res){
  res.render("login")
})

app.get("/about", function(req, res){
  let m='';
  axios.get("http://newsapi.org/v2/everything?q=everything&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=e3f497d14748461f9353b8a6fd22bdfd")
  .then(function (response){
   m=response.data.articles
    console.log(m)
   
  })

   res.render("about", {aboutContent: m})
 
  
});




app.get("/register",function(req,res){
  res.render("register")
 
})
app.get("/compose", function(req, res){
  if(req.isAuthenticated())
  res.render("compose");
  else
  res.redirect("/login")
});




app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err)
      res.redirect("/register")
    }
    else
    passport.authenticate("local")(req,res,function(){
      res.redirect("/home")
    })
  })



})

// app.post('/login',function(req,res){


//   req.login(user, function(err){
//     req.session.messages = "Login successfull";
//     req.session.authenticated = true;
//     req.authenticated = true;
    
//     if (err) {
//       console.log(err);
//       res.send("Incorrect email or password")
      
//     } else {

//     passport.authenticate("local")(req, res, function(){
        
//         res.redirect("/home");
//       });
//     }
//   });
// })



app.post('/login', (req, res, next) => {
  const user = new User({
    email: req.body.username,
    password: req.body.password,
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
});
})





app.post("/delete",function(req,res){
  const id=(req.body.checkbox)
  console.log(id)
  Blog.findByIdAndRemove(id,function(err){
    if(!err){
      console.log("success")
      res.redirect("/home");
    }
    
  })
})


app.post("/compose", function(req, res){

    const post=new Blog({
   title:req.body.postTitle,
   content:req.body.postBody,
   timestamp:dateTime
    })

  post.save(function(err){
    if(!err){
      res.redirect("/home")
 
    }
  });
});

app.get("/posts/:postId", function(req, res){

  const requestedPostId =req.params.postId;

    Blog.findOne({_id: requestedPostId}, function(err, post)
    {
      if(err){
        console.log(err)
      }
    else
     {
      User.find({},function(err,comment){
        if(err){
          console.log(err)
        }

        else
     
          { res.render("post", {
            title: post.title,
            post:post._id,
            content: post.content,
            date:post.timestamp,
           comment:comment});
          }})
    
      
       
     }

         
        })
     
    })

app.post("/do-comment",function(req,res){
 var myId=`${req.body.post_id}`
  Blog.update({"_id":ObjectId(myId)},{
    $push:{
      "comments":{username:req.body.username,comment:req.body.comment}
    }
  },function(err,post){
    if(err){
      console.log(err);
    }
    else
    res.send("comment successfull");
  } )
})
  
  


app.listen(3000, function() {
  console.log("Server started on port 3000");
})
