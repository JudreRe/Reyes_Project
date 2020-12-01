

const express = require("express");
const app = express();
const path = require("path");


app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => { {
  console.log("Server started (http://localhost:3000/) !");
}
});


//Test to make sure the application works

app.get("/", (req, res) => { {
    res.render("index");
  }});


app.get("/manage",(req, res) => { {
    res.render("manage", { model: {}});
}})
