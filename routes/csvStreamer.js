const fs = require("fs");
const csv = require("fast-csv");
const csvSplitStream = require("csv-split-stream");
const express = require("express");

let router = express.Router();
let self = this;

router.get("/streaming", async (req, res, next) => {
  self.res = res
  var counter = 0;
  var file = req.query.filepath;
  var f = fs.createReadStream(req.query.filepath);
  f.pipe(csv.parse())
    .on("error", (error) => console.error(error))
    .on(
      "data",
      (row) => {
        if (row[0] == '10' || row[0] == 10) { counter++; }

        if (row[0] == '20' || row[0] == 20) {
          f.pause();
          f.emit("end");
        }
      }
    )
    .on(
      "end",
      (rowCount) => {
        _counterFn(counter, req.query.output, file)
      }
    );
});


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

async function _counterFn(counter,resultname,file) {
  const filepath = './public/data/output';
  return csvSplitStream.split(
    fs.createReadStream(file),
    {
      lineLimit: counter
    },
    //(index) => fs.createWriteStream(`${filepath}/output-${index}.csv`)
    (index) => fs.createWriteStream(`${filepath}/${resultname}-${index}.csv`),
  )
    .then(csvSplitResponse => {
      console.log('csvSplitStream succeeded.'); //, csvSplitResponse);
      sendResponse(csvSplitResponse)
    }).catch(csvSplitError => {
      //console.log('csvSplitStream failed!', csvSplitError);
    });
}

module.exports = router;
