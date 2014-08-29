var fs = require('fs');
var path = require('path');

// Just export all the maps in the folder
fs.readdirSync(__dirname).forEach(function(file) {
  var extension = path.extname(file);
  var basename = path.basename(file, extension);

  if (extension === '.json') {
    exports[basename] = require('./'+file);
  }
});
