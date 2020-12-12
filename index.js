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


app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//Test to make sure the application works
//Home
app.get("/", (req, res) => {
  {
    res.render("index");
  }
});



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

  res.render("create", { model: {},
  type: "get" });
});



// POST /create
app.post("/create", async (req, res) => {
  // console.log(req.body);
  const sql = "INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)";
  const customer = [req.body.cusid, req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev];
  const show = req.body;

  try {

    const resultNew = await pool.query(sql, customer);

    res.render("create", {
      model: show,
      resultNew: resultNew.rowCount,
      type: "POST"
    });

  } catch (err) {

    res.render("create", {
      model: show,
      resultNew: err.message,
      type:"POST"
    });
  }
});



// GET /edit
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("edit", {
      model: result.rows[0],
      type: "get"
    });
  });
});

// POST /edit
app.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const model = [req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev, id];
  const show = req.body;
  console.log("The show is", show);
 
  const sql = "UPDATE customer SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 WHERE (cusid = $6)";
    
  try {
 
    const resultEdit = await pool.query(sql, model);

    res.render("edit", {
      model: show,
      resultEdit: resultEdit.rowCount,
      type: "POST"
    });

  } catch (err) {

    res.render("edit", {
      model: show,
      resultEdit: err.message,
      type: "POST"
    })
  };
});


//GET /delete
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusid =$1";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(result.rows[0]);
    res.render("delete", {
      model: result.rows[0],
      type: "get"
    });
  });
});

//POST /delete
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const model = req.body;
  console.log("the model is", model);
  const sql = "DELETE FROM customer WHERE cusid = $1";

  try {
    const resultDel = await pool.query(sql, [id]);

    res.render("delete", {
      model: model,
      resultDel: resultDel.rowCount,
      type: "POST"
    });

  } catch (err) {
    res.render("delete", {
      model: model,
      resultDel: err.message,
      type: "POST"
    });
    console.log(err.message);
  }



});


//Get /reports
app.get("/reports", async (req, res) => {

  const reports = req.body;

  res.render("reports", {
    type: "get",
    model: reports
  });
});

//POST /reports
app.post("/reports", async (req, res) => {
console.log(req.body);
var report;
var trans;

try {

  if (req.body.reports === "1"){

    const cusReport = await dblib.reportCustomer();
    report = cusReport.repCus;
    trans = cusReport.trans;

  } else if (req.body.reports === "2") {

    const cusSales = await dblib.reportSales();

    if (cusSales.trans === "success") {
      report = cusSales.repSal;
      trans = cusSales.trans;

    } else {

      report = cusSales.msg;
      trans = cusSales.trans;
      console.log("Error!", report);

    }
  } else {

    const cusRandom= await dblib.reportRandom();
    report = cusRandom.repRan;
    trans = cusRandom.trans;
  }
  
 
  res.render("reports", {
    type: "POST",
    report: report,
    trans: trans,
    value: req.body.reports
  });
 } catch (err) {

  res.render("reports", {
    type: "POST",
    trans: "fail",
    report: err.message,
    value: req.body.reports
  
  });
 
  console.log(err.message);

 }
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
  if (!req.file || Object.keys(req.file).length === 0) {
    message = "Error: Import file not uploaded";
    return res.send(message);
  };
  //Read file line by line, inserting records
  const buffer = req.file.buffer;
  const lines = buffer.toString().split(/\r?\n/);

  lines.forEach(line => {
    console.log(line);
    const customer = line.split(",");
    
    console.log(customer);
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
  var message = "";
  res.render("export", {
    type: "get",
    message: message,
    totRecs: totRecs.totRecords,
    customer: customers
  });

});

// POST /export
app.post("/export", async (req, res) => {
  const sql = "SELECT cusid, cusfname, cuslname, cusstate, cussalesytd::numeric, cussalesprev::numeric FROM customer";
  pool.query(sql, [], (err, result) => {
    var message = "";
    if (err) {
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




