var http = require('http');
var child_process = require('child_process');
var PORT = Number(oricess,argv[2]) || 8080;

var RE_BATTERY = /\/battery\/?/;

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
