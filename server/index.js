var config = require("./config.js");
var server = new (require("./src/server.js"))(config.ports.python);
