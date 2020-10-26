//jshint esversion:6
require('dotenv').config();
const express = require("express");
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
 // Connection URL 

//serSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const homeStartingContent = "Home to thousands of stories";
const aboutContent = "Share your amazing experiences";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.use(session({
secret:"Our little secret.",
resave:false,
saveUninitialised:false
}))
app.use(passport.initialize());
app.use(passport.session())


mongoose.connect("mongodb://localhost:27017/blogDB",{useNewUrlParser: true, useUnifiedTopology: true }
);
mongoose.set("useCreateIndex",true)

const blogSchema={
  title:String,
  content:String
}
const userSchema=new mongoose.Schema({
  username:String,
  password:String
})
userSchema.plugin(passportLocalMongoose)

userSchema.plugin(findOrCreate)

const Blog=mongoose.model("Blog",blogSchema)






const User= new mongoose.model('User',userSchema)
passport.use(User.createStrategy())
passport.serializeUser(function(user,done){
  done(null,user.id)
})
passport.deserializeUser(User.deserializeUser(function(id,done){
User.findById(id,function(err,user){
done(err,user)
})
}))

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




// app.get("/home",function(req,res){
//   if(req.isAuthenticated()){
//     res.render("/")
//   }
//   else
//   res.render("home")
// })

app.get("/home", function(req, res){
  
  Blog.find({},function(err,article){
    if(err){
      
     console.log(err)
    }
      else
      if(req.isAuthenticated()){
        res.render("/")
      }
      else
      {
        if(article)
      res.render("home", {posts:article,username:x,photo:y})
    }
  })


});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})
app.get("/login",function(req,res){
  res.render("login")
})

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){

  url=`https://www.googleapis.com/blogger/v3/blogs/3213900?key=AIzaSyD6oJiuEy0e4SuQkuq4mxWwfyfEbmvfhWA`

https.get(url,function(response){
  console.log(response.statusCode)
 response.on("data",function(data){
  console.log(JSON.parse(data));
  console.log(data['description'])
  res.render("contact",{news:data.name})
 })
 
})
});



app.get("/register",function(req,res){
  res.render("register")
 
})
app.get("/compose", function(req, res){
  if(req.isAuthenticated())
  res.redirect("/");
  else
  res.render("compose")
});




app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err)
      res.redirect("/register")
    }
    else
    passport.authenticate("local")(req,res,function(){
      res.render("home")
    })
  })



})

app.post('/login',function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.render("home");
      });
    }
  });
})


app.post("/compose", function(req, res){

    const post=new Blog({
   title:req.body.postTitle,
   content:req.body.postBody
    })

  post.save(function(err){
    if(!err){
      res.redirect("/")
 
    }
  });
});

app.get("/posts/:postName", function(req, res){
  const requestedTitle = (req.params.postName);
  Blog.findOne({_id:requestedTitle},function(err,article){
 
    const storedTitle = (article._id);
    console.log(storedTitle)
        if (!err)
         {
          res.render("post", {title: article.title,content: article.content});
           }  
  })
 
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
})
