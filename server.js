var http = require('http');
var child_process = require('child_process');
var PORT = Number(oricess,argv[2]) || 8080;

var RE_BATTERY = /\/battery\/?/;

// Template method design for getting battery status

function getBatteryStatus(response, onSuccess, onError) {
	child_process.exec(CONFIG.command, function execBatteryCommand(err, stdout, stderr) {
		var battery;

		if (err) {
			console.log('child_process failed with error code: ' + err.code);
			onError(response, BATTERY_ERROR_MESSAGE);
		} else {
			try {
				battery = CONFIG.processFunction(stdout);
				onSuccess(response, JSON.stringify(battery));
			} catch (e) {
				console.log(e);
				onError(response, BATTERY_ERROR_MESSAGE);
			}
		}
	});
}

// function to check for OS

function switchConfigForCurrentOS () {
	switch(process.platform) {
		case 'linux':
			return {
        		command: 'upower -i /org/freedesktop/UPower/devices/battery_BAT0 | grep -E "state|time to empty|to full|percentage"',
        		processFunction: processBatteryStdoutForLinux
        	};
		case 'darwin': //MAC
			return {
            	command: 'pmset -g batt | egrep "([0-9]+\%).*" -o',
            	processFunction: processBatteryStdoutForMac
	        };
		case 'win32':
            return {
                command: 'WMIC Path Win32_Battery',
                processFunction: processBatteryStdoutForWindows
            };
		default:
            return {
                command: '',
                processFunction: function () {}
            };
    }
}

// Helper methods to process bash outputs for various OS systems

function processLineForLinux(battery, line) {
	var key;
	var val;

	line = line.trim();
	if (line.length > 0) {
		line = line.split(':');
		if (line.length === 2) {
			line = line.map(trimParam);
			key = line[0];
			val = line[1];
			battery[key] = val;
		}
	}
	return battery;
}

function mapKeysForLinux(battery) {
	var mappedBattery = {};
	mappedBattery.percentage = battery.percentage;
	mappedBattery.state = battery.state;
	mappedBatterytimeToEmpty = battery['time to empty'];
}

function mapKeysForMac(battery) {
    var mappedBattery = {};
    mappedBattery.percentage = battery[0];
    mappedBattery.state = battery[1];
    mappedBattery.timeToEmpty = battery[2];
    return mappedBattery;
}

function processBatteryStdoutForLinux(stdout) {
    var battery = {},
    processLine = processLineForLinux.bind(null, battery);
    stdout.split('\n').forEach(processLine);
    return mapKeysForLinux(battery);
}

function processBatteryStdoutForMac(stdout) {
    var battery = stdout.split(';').map(trimParam);
    return mapKeysForMac(battery);
}


var server = http.createServer(function (request, response) {
	var requestUrl = request.url;

	if (requestUrl === '/' || requestUrl === '') {
		response.writeHead(301, {
			Location: BASE_URL + 'public/demo.html'
		});
		response.end();
	} else if (RE_BATTERY.test(requestUrl)) {
		getBatteryStatus(response, onBatteryInfo, onError);
	} else {
		var filePath = request.url
		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(error, content){
					if (error) {
						response.writeHead(500);
						response.end();
					} else {
						response.writeHead(200);
						response.end(content, 'utf-8');
					}
				})
			} else {
				response.writeHead(404, {'Content-Type': 'text/plain'});
				response.write('404 - Resource Not Found');
				response.end();
			}
		});
	}
}).listen(PORT);
