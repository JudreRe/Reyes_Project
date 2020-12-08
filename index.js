const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const path = require("path");
const multer = require("multer");
const upload = multer();
const { Pool } = require('pg');

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: {
   rejectUnauthorized: false
 }
});

require('dotenv').config()


app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(3000, () => { {
  console.log("Server started (http://localhost:3000/) !");
}
});


//Test to make sure the application works
//Home
app.get("/", (req, res) => { {
    res.render("index");
  }});



//Manage
app.get("/manage", async (req, res) => {

  const totRecs = await dblib.getTotalRecords();
  
  const customers = {
      cusid: "",
      cusfname: "",
      cuslname: "",
      cusstate: "",
      cussalesytd: "",
      cussalesprev: ""
  };

  res.render("manage", {
      type: "get",
      totRecs: totRecs.totRecords,
      customer: customers
  });

  

});

app.post("/manage", async (req, res) => {

  const totRecs = await dblib.getTotalRecords();
  

  dblib.findCustomer(req.body)
      .then(result => {
          res.render("manage", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: result,
              customer: req.body
          });
      })
      .catch(err => {
          res.render("manage", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: `Unexpected Error: ${err.message}`,
              customer: req.body
          });
      });

});


// GET /create
app.get("/create", (req, res) => {
  
  res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
  // console.log(req.body);
  const sql = "INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)";
  const customer = [req.body.cusid, req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev];
  pool.query(sql, customer, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/manage");
  });
});


// GET /edit
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("edit", { model: result.rows[0] });
  });
});

// POST /edit
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const customer = [req.body.cusfname, req.body.cuslname, req.body.cusstate,req.body.cussalesytd, req.body.cussalesprev, id];
  const sql = "UPDATE customer SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 WHERE (cusid = $6)";
  pool.query(sql, customer, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("index");
  });
});

//GET /delete
app.get("/delete/:id", (req,res) =>{
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid =$1";
  
  pool.query(sql, [id], (err, result) => {
    if(err){
      return console.error(err.message);
    }
    console.log(result.rows[0]);
    res.render("delete", { model: result.rows[0] });
  });
});

//POST /delete
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    if (err){
      return console.error(err.message);
    }
    console.log(result.rows[0]);
    res.render("delete", {model:result.rows[0] });
  });
});


//Get /report
app.get("/reports", async (req, res) => {
  const totRecs = await dblib.getTotalRecords();
  
  const customers = {
      cusid: "",
      cusfname: "",
      cuslname: "",
      cusstate: "",
      cussalesytd: "",
      cussalesprev: ""
  };

  res.render("reports", {
      type: "get",
      totRecs: totRecs.totRecords,
      customer: customers
  });
});

//POST /report
app.post("/reports", async (req, res) => {

  const totRecs = await dblib.getTotalRecords();

  dblib.findCustomer(req.body)
      .then(result => {
          res.render("reports", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: result,
              customer: req.body
          })
      })
      .catch(err => {
          res.render("reports", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: `Unexpected Error: ${err.message}`,
              customer: req.body
          });
      });

});

// GET /import
app.get("/import", async (req, res) => {
  const totRecs = await dblib.getTotalRecords();
  
  const customers = {
      cusid: "",
      cusfname: "",
      cuslname: "",
      cusstate: "",
      cussalesytd: "",
      cussalesprev: ""
  };

  res.render("import", {
      type: "get",
      totRecs: totRecs.totRecords,
      customer: customers
  });
});

// POST /import
app.post("/import", upload.single('filename'), (req, res) => {
   if(!req.files || Object.keys(req.files).length === 0) {
       message = "Error: Import file not uploaded";
       return res.send(message);
   };
   //Read file line by line, inserting records
   const buffer = req.file.buffer;
   const lines = buffer.toString().split(/\r?\n/);

   lines.forEach(line => {
        //console.log(line);
        product = line.split(",");
        //console.log(customer);
        const sql = "INSERT INTO customer(cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)";
        pool.query(sql, customer, (err, result) => {
            if (err) {
                console.log(`Insert Error.  Error message: ${err.message}`);
            } else {
                console.log(`Inserted successfully`);
            }
       });
   });
   message = `Processing Complete - Processed ${lines.length} records`;
   res.send(message);
});   




// GET /export
app.get("/export", async (req, res) => {
  const totRecs = await dblib.getTotalRecords();
  
  const customers = {
      cusid: "",
      cusfname: "",
      cuslname: "",
      cusstate: "",
      cussalesytd: "",
      cussalesprev: ""
  };
  var message= "";
  res.render("export", {
    type: "get",
    message: message,
    totRecs: totRecs.totRecords,
    customer: customers
});

 });
 
 // POST /export
 app.post("/export", async (req, res) => {
     const sql = "SELECT * FROM customer ORDER BY cusid";
     pool.query(sql, [], (err, result) => {
         var message = "";
         if(err) {
             message = `Error - ${err.message}`;
             res.render("output", { message: message })
         } else {
             var output = "";
             result.rows.forEach(customer => {
                 output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd},${customer.cussalesprev}\r\n`;
             });
             res.header("Content-Type", "text/csv");
             res.attachment("export.txt");
             return res.send(output);
         };
         
     });
 });




