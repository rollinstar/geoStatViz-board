var express = require('express')
    app     = express();


//configuration
app.configure(function(){
    // app.use("/index.html",express.static(__dirname+"/index.html"));
    app.use("/index.html",express.static("../app/index.html"));
});