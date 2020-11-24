//jshint esversion:6
require('dotenv').config();
const express = require("express");
const axios=require("axios")
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


const today = new Date();
 const dateTime = today.getDate()+'-'+(today.getMonth()+1)+'-'+ today.getFullYear();
console.log(dateTime)


app.set('view engine', 'ejs');

var jsonParser = bodyParser.json()

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
secret:process.env.SECRET,
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
  comments:[
  {  username:String,
    name:String,
    comment:String
    },

  ],
  time:String
}
const userSchema=new mongoose.Schema({
  username:String,
  email:String,
  password:String,
  googleId:String,
  timestamp:String,
  likedPost:[String],
  posts:[blogSchema]

})

const publicBlogschema=new mongoose.Schema({
  author:String,
  title:String,
  post:String,
  img:String,
  like:Number,
  timestamp:String,
  comments:[
    { username:String,
      name:String,
      comment:String
      }
    ],
    time:String

})


userSchema.plugin(passportLocalMongoose)

userSchema.plugin(findOrCreate)

const User= new mongoose.model('User',userSchema)
const Blog=mongoose.model("Blog",blogSchema)
const Public=mongoose.model('Public',publicBlogschema)


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

app.get("/auth/google",
  passport.authenticate("google",{ scope: ["profile"] }))

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to home.
    res.redirect("/home");
  });







app.get("/",function(req,res){
  res.render("welcome")
    
})



app.get("/LoginToView",function(req,res){
  if(!req.isAuthenticated())
res.render("LoginToView")
})



app.get("/home",function(req, res){

  if(req.isAuthenticated())
  {  
      if(req.user.googleId==='108161711762081675784')
    {Blog.find({},function(err,article){
        if(err){
          
         console.log(err)
        }
          else
       { 
            res.render("home", {posts:article,username:x,photo:y})
       }
        })
        }
        else{
          User.findById(req.user._id,function(err,foundUser){
            if(err){
              console.log(err)
            }
            else
            {
              res.render("home",{posts:foundUser.posts,username:'',photo:''})
            }
          })
        }
        
        // &&req.user.googleId===ObjectId(108161711762081675784)
    
  }
        else
        {
            res.redirect("/LoginToView")
        }
  

})


app.get("/about", function(req, res){
  let m='';
  axios.get(`http://newsapi.org/v2/everything?q=everything&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=${process.env.API_KEY}`)
  .then(function (response){
   m=response.data.articles
   res.render("about", {aboutContent: m,user:req.isAuthenticated()})
  })
  
  })
  app.get("/sports", function(req, res){
    let m='';
    axios.get(`http://newsapi.org/v2/everything?q=sports&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=${process.env.API_KEY}`)
    .then(function (response){
     m=response.data.articles
     res.render("sports", {aboutContent: m})
    
    }) 
});
app.get("/entertainment", function(req, res){
  let m='';
  axios.get(`http://newsapi.org/v2/everything?q=entertainment&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=${process.env.API_KEY}`)
  .then(function (response){
   m=response.data.articles
   res.render("entertainment", {aboutContent: m})
  
  }) 
});
app.get("/politics", function(req, res){
  let m='';
  axios.get(`http://newsapi.org/v2/everything?q=politics&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=${process.env.API_KEY}`)
  .then(function (response){
   m=response.data.articles
   res.render("politics", {aboutContent: m})
  
  }) 
});
app.get("/coronavirus", function(req, res){
  let m='';
  axios.get(`http://newsapi.org/v2/everything?q=coronavirus&from=2020-10-25&to=2020-10-25&sortBy=popularity&apiKey=${process.env.API_KEY}`)
  .then(function (response){
   m=response.data.articles
   res.render("coronavirus", {aboutContent: m})
  
  }) 
});






app.get("/register",function(req,res){
  res.render("register")
 
})

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
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})
app.get("/login",function(req,res){
  res.render("login")
})

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
  console.log(id);
  Blog.findByIdAndRemove(id,function(err){
    if(!err){
      console.log("success")
      res.redirect("/home");
    }
    
  })
})


app.get("/compose", function(req, res){
  if(req.isAuthenticated())
  res.render("compose");
  else
  res.redirect("/LoginToView")
});

app.post("/compose", function(req, res){
  const bpost=new Public({
    author:req.body.author,
    title:req.body.postTitle,
    post:req.body.postBody,
    timestamp:dateTime
    })
    const post=new Blog({
      title:req.body.postTitle,
      content:req.body.postBody,
      timestamp:dateTime
       })
    if(req.body.hasOwnProperty("public"))
    {
      console.log("yes")      
      bpost.save(function(err){
        if(err){
          console.log(err)
        }
        else{
          res.redirect("/publicBlogs")
        }
      })
    }
    
      else{    
        console.log("no")

    post.save();
    foundUser.posts.push(post);
    console.log(foundUser.posts)

    res.redirect("/home");
  


  }
  })

      
   
   


app.get("/compose-edit/:postId",function(req,res){
  Blog.findOne({_id:req.params.postId},function(err,post){
    res.render("compose-edit",{id:post._id,title:post.title,content:post.content})
  })
})


app.post("/compose-edit/:postId",function(req,res){
  const requestedPostId =req.params.postId;
 
  Blog.findById(requestedPostId,function(err,post){
    if(err){
      console.log(err)
    }
    else
    {
      post.title=req.body.postTitle;
      post.content=req.body.postBody;
        post.save(function(err){
      if(err)
      console.log(err);
      else
      {
      res.redirect("/home");
      console.log(post)}
    })
  }
  })
})






app.get("/posts/:postId", function(req, res){

  const requestedPostId =req.params.postId;
  User.findById(req.user._id,function(err,foundUser){
    Blog.findOne({_id: requestedPostId}, function(err, post)
    {
      if(err){
        console.log(err)
      }
      else{
        Blog.find({_id:{$nin:post._id}},function(err,allarticle){
           
          res.render("post", {
              title: post.title,
              content:post.content,
              id:post._id,
              post:allarticle,
              comment:post.comments,
              date:post.timestamp
             });
            })
      }
          




    })
  })

  })

    
app.post("/do-comment",function(req,res){
  Blog.findOne({_id:req.body.post_id},function(err,post){
    if(err){
      console.log(err)
    }
    else
   { 
     post.comments.push({username:req.user.username,comment:req.body.comment,name:req.body.name});
    post.save(function(err){
      if(err)
      console.log(err)
      else
     { res.send("success")
      console.log(post)}
    })}
   
  })
})

app.get("/publicBlogs",function(req,res){
  Public.find({},function(err,post){
    console.log(post)
    if(err){
      console.log(err)
    }
    else{
      res.render("publicBlogs",{post:post})
    }
  })
})
app.get("/showblog/:postId",function(req,res){
  
  Public.findOne({_id:req.params.postId},function(err,post){
    if(err)
{
  console.log(err)
}
  else
  {
    console.log(req.isAuthenticated())
    res.render("showblog",{title:post.title,date:post.timestamp,content:post.post,author:post.author,image:post.img,
  id:post._id,people:post.like,comment:post.comments,auth:req.isAuthenticated()})
  }


})
})

app.post("/do-commented",function(req,res){
 Public.findOne({_id:req.body.post_id},function(err,post){
    if(err){
      console.log(err)
    }
    else
   { 
     post.comments.push({username:req.user.username,comment:req.body.comment,name:req.body.name});
    post.save(function(err){
      if(err)
      console.log(err)
      else
     { res.send("success")
      console.log(post)}
    })}
   
  })
})







let port=process.env.PORT;
if(port==null||port==""){
  port=3000
}

app.listen(port, function() {
  console.log("Server started");
})
