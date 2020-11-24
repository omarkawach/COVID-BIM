const fs = require("fs");
const csv = require("fast-csv");
const csvSplitStream = require("csv-split-stream");
const express = require("express");

let router = express.Router();
let self = this;

/*
  File stream and fast-csv will read your CSV line 
  by line to find the number of cells in each time 
  step. Once the number of cells is discovered, 
  the program moves on to split the CSV. Each CSV
  will be a time step. 
*/
router.get("/streaming", async (req, res, next) => {
  //https://github.com/expressjs/express/issues/2174
  // Don't use this outside of localhost
  req.setTimeout(0) // no timeout
  
  self.res = res

  var cellCount = 0;
  var f = fs.createReadStream(req.query.filepath);

  f.pipe(csv.parse())
    .on("error", (error) => console.error(error))
    .on("data", (line) => {
        // line[0] is the time step 

        // Use any time step except time step 0 to find the 
        // number of cells 
        if (line[0] == '10' || line[0] == 10) { cellCount++; }

        // Once we exit the previous time step, stop parsing
        if (line[0] == '20' || line[0] == 20) {
          f.pause();
          f.emit("end");
        }
      }
    )
    .on("end", (rowCount) => {
        splitCSV(cellCount, req.query.output, req.query.filepath)
      }
    );
});

/*
  File stream and fast-csv will read each line in 
  the split CSV. The data collected will be sent back 
  to the custom Forge Extension.
*/
router.get("/reading", async (req, res, next) => {
  var f = fs.createReadStream(req.query.filepath);
  let data = [];
  f.pipe(csv.parse())
    .on("error", (error) => console.error(error))
    .on("data", (row) => {
      data.push({
        time: parseInt(row[0]),
        x: parseInt(row[1]),
        y: parseInt(row[2]),
        prev_inhaled: parseInt(row[3]),
        curr_inhaled: parseInt(row[4]),
        previous_state: parseInt(row[5]),
        current_state: parseInt(row[6]),
        prev_type: parseInt(row[8]),
        curr_type: parseInt(row[8]),
      });
    })
    .on("end", () => {
      data.shift();
      res.send(data);
    });
});

function sendResponse(chunks){
  self.res.send(chunks)
}

async function splitCSV(counter, output, file) {
  const filepath = './public/data/output';
  return csvSplitStream.split(
    fs.createReadStream(file),
    {
      lineLimit: counter
    },
    // Where the split CSVs will go
    (index) => fs.createWriteStream(`${filepath}/${output}-${index}.csv`),
  )
    .then(csvSplitResponse => {
      console.log('csvSplitStream succeeded.', csvSplitResponse);
      // Send the new CSV file to the custom Forge Extension
      sendResponse(csvSplitResponse)
    }).catch(csvSplitError => {
      console.log('csvSplitStream failed!', csvSplitError);
    });
}

module.exports = router;
