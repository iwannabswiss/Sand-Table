import express from 'express';
import fs from 'fs';
import fileupload from 'express-fileupload';
import sharp from 'sharp';
import { process_gcode_file_to_gcode } from './process_gcode';
import { process_thr_file_to_gcode } from './process_theta_rho';
import { process_gcode_file_to_png } from './create_png_from_gcode';
import { renameTrack, deleteTrack } from "./playlist_manager";

const router = express.Router();

router.use(fileupload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

router.post('/', function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  let thrFile = req.files.file;

  if (!thrFile.name.endsWith(".thr") && !thrFile.name.endsWith(".gcode")) {
    return res.status(400).send("Invalid file type");
  }

  if (thrFile.name.endsWith(".thr")) {
  	var filename = thrFile.name.replace(".thr", "");
  }
  else {
	  var filename = thrFile.name.replace(".gcode", "");
  }

  //check if original file exists
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".thr"))
    fs.unlinkSync(__dirname + "/../../files/org/" + filename + ".thr");
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".gcode"))
    fs.unlinkSync(__dirname + "/../../files/org/" + filename + ".gcode");

  //check if altered file exists (update to only check if org file exists)
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".thr"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".thr");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".gcode"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + "-small.png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + "-small.png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).gcode"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + " (fill).gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + " (fill).png");

  // Use the mv() method to place the file somewhere on your server
  thrFile.mv(__dirname + "/../../files/org/" + thrFile.name, function (err) {
    if (err)
      return res.status(500).send(err);
 
  if (thrFile.name.endsWith(".thr")) {
    process_thr_file_to_gcode(filename, () => {
      process_gcode_file_to_png(filename, () => {
        sharp(__dirname + "/../../files/" + filename + ".png")
          .extract({ left: 73, top: 73, width: 354, height: 354 }) // See https://www.desmos.com/calculator/rbn4tjbjjd for rationale of numbers
          .resize(500) // assuming image ("/../../files/" + filename + ".png") is of width/height 500
          .toFile(__dirname + "/../../files/" + filename + " (fill).png",
            (err, info) => {
              sharp(__dirname + "/../../files/" + filename + ".png")
                .resize(100)
                .toFile(__dirname + "/../../files/" + filename + "-small.png",
                  (err, info) => {
                    res.send('File uploaded!');
                  }
                ); //.toFile
            }); //.toFile
      }); //process_gcode_file_to_png
    }); //process_thr_file_to_gcode
  }
  else {
   process_gcode_file_to_gcode(filename, () => {
      process_gcode_file_to_png(filename, () => {
        sharp(__dirname + "/../../files/" + filename + ".png")
          .extract({ left: 73, top: 73, width: 354, height: 354 }) // See https://www.desmos.com/calculator/rbn4tjbjjd for rationale of numbers
          .resize(500) // assuming image ("/../../files/" + filename + ".png") is of width/height 500
          .toFile(__dirname + "/../../files/" + filename + " (fill).png",
            (err, info) => {
              sharp(__dirname + "/../../files/" + filename + ".png")
                .resize(100)
                .toFile(__dirname + "/../../files/" + filename + "-small.png",
                  (err, info) => {
                    res.send('File uploaded!');
                  }
                ); //.toFile
            }); //.toFile
      }); //process_gcode_file_to_png
   }); //process_gcode_file_to_gcode
  } //EOE
  }); //thrFile.mv
}); //router.post

router.post("/delete", function (req, res) {
  var filename = req.body.filename;
  //check if org files exists
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".thr"))
    fs.unlinkSync(__dirname + "/../../files/org/" + filename + ".thr");
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".gcode"))
    fs.unlinkSync(__dirname + "/../../files/org/" + filename + ".gcode");

  //check if altered files exist (update to only check if org files exists)
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".thr"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".thr");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".gcode"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + ".png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + "-small.png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + "-small.png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).gcode"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + " (fill).gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).png"))
    fs.unlinkSync(__dirname + "/../../files/" + filename + " (fill).png");
  deleteTrack(filename);
  res.sendStatus(200);
});

router.post("/rename", function (req, res) {
  var filename = req.body.filename;
  var newName = req.body.newName;
  //rename org files
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".thr"))
    fs.renameSync(__dirname + "/../../files/org/" + filename + ".thr",
      __dirname + "/../../files/org/" + newName + ".thr");
  if (fs.existsSync(__dirname + "/../../files/org/" + filename + ".gcode"))
    fs.renameSync(__dirname + "/../../files/org/" + filename + ".gcode",
      __dirname + "/../../files/org/" + newName + ".gcode");

  //rename altered files
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".thr"))
    fs.renameSync(__dirname + "/../../files/" + filename + ".thr",
      __dirname + "/../../files/" + newName + ".thr");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".gcode"))
    fs.renameSync(__dirname + "/../../files/" + filename + ".gcode",
      __dirname + "/../../files/" + newName + ".gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + ".png"))
    fs.renameSync(__dirname + "/../../files/" + filename + ".png",
      __dirname + "/../../files/" + newName + ".png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + "-small.png"))
    fs.renameSync(__dirname + "/../../files/" + filename + "-small.png",
      __dirname + "/../../files/" + newName + "-small.png");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).gcode"))
    fs.renameSync(__dirname + "/../../files/" + filename + " (fill).gcode",
      __dirname + "/../../files/" + newName + " (fill).gcode");
  if (fs.existsSync(__dirname + "/../../files/" + filename + " (fill).png"))
    fs.renameSync(__dirname + "/../../files/" + filename + " (fill).png",
      __dirname + "/../../files/" + newName + " (fill).png");
  renameTrack(filename, newName);
  res.sendStatus(200);
});

export default router;
