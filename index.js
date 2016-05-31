/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Steed MONTEIRO @SteedMonteiro
*/
var path = require("path");
var fs = require("fs");
var MemoryFileSystem = require("memory-fs");
var mime = require("mime");
var parseUrl = require('parseurl');

// constructor for the middleware
module.exports = function(root, options) {
	if(!options) options = {};

	// The middleware function
	function devtoolsLiveMiddleware(req, res, next) {

		var originalUrl = parseUrl.original(req)
    	var path = parseUrl(req).pathname;

    	if (path[path.length-1] === '/') {
	      path = path.substr(0, (path.length-1)) +'/index.html';
	    }

	    var filepath = root + path;

	    try{

	    if(process.fs.existsSync(filepath)){
	    	var content = process.fs.readFileSync(filepath);
	    }else{
			var stat = fs.statSync(filepath);

	    	if(stat.isFile()) {
	    		var content = fs.readFileSync(filepath);
	    	}else if (stat.isDirectory()) {
	      		filepath = path +'/index.html';
		      	if(fs.statSync(filepath).isFile()){

		      		var content = fs.readFileSync(filepath);

		      	}
	    	}
	    }

		}catch(e){

		}

		if(content === undefined){
			return next();
		}

		var contentType = mime.lookup(filepath);
		res.setHeader("Access-Control-Allow-Origin", "*"); // To support XHR, etc.
		res.setHeader("Content-Type", contentType);
		if(options.headers) {
			for(var name in options.headers) {
				res.setHeader(name, options.headers[name]);
			}
		}

		if(contentType == 'text/html'){
			content = content.toString();
			for(var name in process.live) {
				var tag  = '<!-- '+name+' -->';
				var start = content.indexOf(tag);
				if(start > 0){
					var end = content.lastIndexOf(tag) +tag.length;
					var content = content.substr(0, start)+ process.live[name] + content.substr(end);
				}
			}
		}


	var stat = fs.statSync(path);
	  var total = stat.size;

	  if (req.headers.range) {   // meaning client (browser) has moved the forward/back slider
	                                         // which has sent this request back to this server logic ... cool
	    var range = req.headers.range;
	    var parts = range.replace(/bytes=/, "").split("-");
	    var partialstart = parts[0];
	    var partialend = parts[1];

	    var start = parseInt(partialstart, 10);
	    var end = partialend ? parseInt(partialend, 10) : total-1;
	    var chunksize = (end-start)+1;

	    var file = fs.createReadStream(path, {start: start, end: end});
	    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': contentType });
	    file.pipe(res);

	  } else {
	  	res.setHeader("Content-Length", content.length);
		res.end(content, 'binary');
	  }
	}

	return devtoolsLiveMiddleware;
}
