//jshint esversion:6
require('dotenv').config()
const express = require("express");

const https=require("https")

const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose=require('mongoose');
const bcrypt=require("bcrypt")
const saltRounds=10

 // Connection URL 
 mongoose.connect("mongodb://localhost:27017/blogDB",{useNewUrlParser: true, useUnifiedTopology: true }
);

const blogSchema={
  title:String,
  content:String
}
const userSchema=new mongoose.Schema({
  username:String,
  password:String
})


//AIzaSyD6oJiuEy0e4SuQkuq4mxWwfyfEbmvfhWA

  




//serSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const Blog=mongoose.model("Blog",blogSchema)

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.get("/", function(req, res){
  Blog.find({},function(err,article){
    if(!err){
      res.render("home", {startingContent: homeStartingContent,posts:article})
    }
  });
});
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
  res.render("compose");
  
});


const User= new mongoose.model('User',userSchema)

app.post("/register",function(req,res){
  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    if(!err){
    const newUser=new User({
      username:req.body.email,
      password:hash
     
    })
    
    newUser.save(function(err,data){
      console.log(data)
      if(err)
      console.log(err)
      else
      res.redirect("/")
    })
  }
  else
  console.log(err)
  })
  //after hashing use it in mongoose document

})

app.post('/login',function(req,res){
  let username=req.body.email
  let password=(req.body.password)
  User.findOne({username:username},function(err,foundUser){
    if(err){
      console.log(err)
    } 
    console.log(foundUser)
    if(foundUser){
      bcrypt.compare(password, foundUser.password, function(err, result) {
        // result == true
        if(result===true)
        res.redirect("/")

    });
  }
      else
      {
      res.render("register")
      }
    
  })
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

app.listen(3001, function() {
  console.log("Server started on port 3001");
})
