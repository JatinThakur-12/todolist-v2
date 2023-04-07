require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose= require("mongoose");
const _ =require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model( "item" , itemSchema );

const Item1= new Item({
  name: "To do list"
});
const Item2 = new Item({
  name: "Hit the + button to add new items."
})

const defaultItems= [Item1,Item2];
// Item1.save();

const listSchema= new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List= new mongoose.model("list",listSchema);


const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function(req, res) {
  // const day = date.getDate();
  Item.find().then((items)=>{
    if(items.length === 0){ 
      Item.insertMany(defaultItems);
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });

});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const listName= req.body.list;
  
  let item = new Item({
    name: newItem
  });

  // items.push(newitem);
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: _.toLower(listName)}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
   
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listTitle = req.body.listName;
    
    if(listTitle==="Today"){
      Item.findByIdAndRemove(checkedItemId).then(()=>{
        console.log("removed");
      });
      res.redirect("/");
    }else{
      List.findOneAndUpdate( {name: _.toLower(listTitle)} ,{$pull : {items : {_id : checkedItemId}}}).then(()=>{
        console.log("Deleted from document "+listTitle+".");
      });
      res.redirect("/"+listTitle);
    }
});


app.get("/:customListName", (req,res)=>{
   
  const customName = req.params.customListName;

  List.findOne({name: _.toLower(customName)}).then((response)=>{
    if(response){
      console.log("exist");
      res.render("list",{listTitle: _.upperFirst(response.name), newListItems: response.items})
    }else{
      console.log("Dont exist");
      const list= new List({
        name: _.toLower(customName),
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customName);
    }
  });
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
