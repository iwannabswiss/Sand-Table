require("dotenv").config();

var fs = require('fs')
    , es = require('event-stream');

const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const fillModeOptions = {
    FILL: 0,
    FIT: 1
}

const SWAPXY = process.env.SWAPXY;
const ROTATE = process.env.ROTATE;
const FLIP = process.env.FLIP;
const FLOP = process.env.FLOP;
const X_SIZE = process.env.X_SIZE;
const Y_SIZE = process.env.Y_SIZE;

var scaleGcode = parseFloat(Math.min(1000 / X_SIZE, 1000 / Y_SIZE));
scaleGcode = scaleGcode.toFixed(2);

var _;

function scale([x, y], r=0, fillMode = fillModeOptions.Fit) {
	//console.log(`Before check, X${x} Y${y}`);
	if (fillMode == fillModeOptions.FILL) {
		x *= parseFloat(scaleGcode);
		y *= parseFloat(scaleGcode);
	}
	//check x/y to make sure within table boundaries
	if (!(x >= 0) || !(x <= X_SIZE)) {
		//console.log('Changing X');
		if (x < 0) {
			x = parseFloat(0);
		}
		else {
			x = parseFloat(X_SIZE);
		}
	}
	if (!(y >= 0) || !(y <= Y_SIZE)) {
		//console.log('Changing Y');
		if (y < 0) {
			y = parseFloat(0);
		}
		else {
			y = parseFloat(Y_SIZE);
		}
	}
	//console.log(`After check, X${x} Y${y}`);
	return [[x, y]];
}

function writeToFile(stream, fillStream, cmd, coord) {
    var [fitCoord, _] = scale(coord, 0, fillModeOptions.FIT);
    stream.write(`${cmd} X${fitCoord[0].toFixed(3)} Y${fitCoord[1].toFixed(3)}\n`);
    	//doesn't check scale
	//stream.write(`${cmd} X${coord[0].toFixed(3)} Y${coord[1].toFixed(3)}\n`);

    var [fillCoord, _] = scale(coord, 0, fillModeOptions.FILL);
    fillStream.write(`${cmd} X${fillCoord[0].toFixed(3)} Y${fillCoord[1].toFixed(3)}\n`);
    	//doesn't check scale
	//fillStream.write(`${cmd} X${coord[0].toFixed(3)} Y${coord[1].toFixed(3)}\n`);
}

function process_file(filename, callback) {

    var prevX, prevY = null;

    var outStream = fs.createWriteStream(__dirname + "/../../files/" + filename + ".gcode");
    var outFillStream = fs.createWriteStream(__dirname + "/../../files/" + filename + " (fill).gcode");

    var inStream = fs.createReadStream(__dirname + "/../../files/org/" + filename + ".gcode")
        .pipe(es.split())
        .pipe(es.mapSync(function (line) {

            // pause the readstream
            inStream.pause();

            // process line here and call s.resume() when ready
            // function below was for logging memory usage
            if (line.length > 0 && !line.startsWith("#") && !line.startsWith("//") && !line.startsWith(";")) {
                // Process line...not a comment
		if (SWAPXY == 'true') {
			//swap coordinates
			var [gValue, yCord, xCord] = line.split(new RegExp("\\s+")).filter((v) => { return v.length > 0 });
		}
		else {
			//use coordinates AS IS
			var [gValue, xCord, yCord] = line.split(new RegExp("\\s+")).filter((v) => { return v.length > 0 });
		}

		xCord = parseFloat(xCord.slice(1));
		yCord = parseFloat(yCord.slice(1));
		writeToFile(outStream, outFillStream, "G0", [xCord, yCord]);
            } //End of if (line.length)

            // resume the readstream, possibly from a callback
            setImmediate(() => inStream.resume());
        })
            .on('error', function (err) {
                console.log('Error while reading file.', err);
            })
            .on('end', function () {
                console.log('Done converting ' + filename + '.gcode to new gcode');
                outStream.end(() => callback());
            })
        );
}

function process_gcode_file_to_gcode(filename, callback) {
    // Use worker thread
    const id = Math.random(); // Random uuid to distinguish this call from others to avoid race conditions
    const worker = new Worker(__filename, {
        workerData: { fn: "process_file", filename: filename, id: id }
    });
    worker.on('message', (val) => {
        if (val == id)
            callback();
    });
}

module.exports.ROTATE = ROTATE;
module.exports.FLIP = FLIP;
module.exports.FLOP = FLOP;

if (isMainThread) {
    module.exports.process_gcode_file_to_gcode = process_gcode_file_to_gcode;
} else {
    // A worker thread has been created, call the requested function
    switch (workerData.fn) {
        case "process_file":
            process_file(workerData.filename, () => parentPort.postMessage(workerData.id));
            break;
    }
}
