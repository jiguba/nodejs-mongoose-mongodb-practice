//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash");

const app = express();
 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = process.env.MONGO_URI;

main().catch(err => console.log(err));

async function main() {

  await mongoose.connect(uri);

  console.log('Connected');

  const itemsSchema = new mongoose.Schema({
    name: String
  });

  const Item = new mongoose.model("Item", itemsSchema);

  const welcome = new Item({
    name: "Welcome to your todo list!"
  });

  const addItem = new Item({
    name: "Hit the + button to add a new item."
  });

  const deleteItem = new Item({
    name: "Click this to delete your item."
  });

  const defaultItems = [welcome, addItem, deleteItem];

  const listSchema = {
    name: String,
    items: [itemsSchema]
  };

  const List = new mongoose.model("List", listSchema);


  //  try {
  //   await Item.deleteOne({_id:"64b88835936e308d27b454dd"});
  //   console.log("Successfully deleted item.");
  // } catch(err) {
  //   console.log(`An error occured when adding default items.\n ${err}\n The output of the error is above.\n`);
  // }

  app.get("/", function(req, res) {

    Item.find({}).then((docs) => {

      if(docs.length === 0) {
        console.log(docs);
        try {
          Item.insertMany(defaultItems,ordered=false, throwOnValidationError=true)
          console.log("Successfully added default items.");
        } catch(err) {
          console.log(`An error occured when adding default items.\n ${err}\n The output of the error is above.\n`);
        }
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: docs});
      }
      docs.forEach(doc => console.log(doc.name));
    })
  });

  app.get("/:customListName", function(req,res) {
    const customListName = _.capitalize(req.params.customListName);

    let count = 0;
    List.findOne({name: customListName}).then(function(customList, err) {

      console.log("Let's check err first!");
      console.log(err);
      if(!err) {
        console.log(customList);
        console.log("First call");

        if(!customList) {

          if(count < 1) {
            console.log("Doesn't exist");
            const list = new List({
              name: customListName,
              items: defaultItems
            });
            list.save();
  
            res.redirect("/" + _.lowerCase(customListName));
            count++;
          }
        } else {
          console.log("Exists!");
          res.render("list", {listTitle: customList.name, newListItems: customList.items});
        }
      } else {
        console.log("An error occured");
      }
    });
  });


  app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if(listName === "Today") {
      item.save();
      res.redirect("/");    
    } else {
      List.findOne({name: listName}).then(function(resolve, reject){
        resolve.items.push(item);
        resolve.save();
        res.redirect("/" + _.lowerCase(listName));
      });
    }

  });

  app.post("/delete", function(req, res) {

    const checkedItemId = req.body.checkbox;
    // console.log(checkedItemId);

    const listName = req.body.listName;
    console.log(req.body);

    if(listName === "Today") {
      Item.findByIdAndRemove(checkedItemId).exec();
      res.redirect("/");
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(resolve, reject) {
        if(reject) {
          console.log("An error occured when deleting a task from custom list.");
        } else {
          res.redirect("/" + _.lowerCase(listName));
        }
      });
    };


  });

};














// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
