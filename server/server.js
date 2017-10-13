let express    = require('express'),
    bodyParser = require('body-parser'),
    path       = require('path'),
    app        = express();
    

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');                       //허용되는 url을 route를 제외하고 명시하면 이외의 url로 부터 유입되는 request는 거절된다. (*은 모든 request 허가)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); //허용되는 HTTP methods, 포함되지 않은 method는 거절된다. (* 사용불가)
  res.header('Access-Control-Allow-Headers', 'content-type');           //허용되는 HTTP header 목록 (* 사용불가)
  next();
});

// APIs
app.use('/api/test', require('./api/test')); //*

// Angular
app.use(express.static(path.resolve(__dirname, '../build'))); //1
app.get('*', function (req, res) { //2
  let indexFile = path.resolve(__dirname,'../build/index.html');
  res.sendFile(indexFile);
});

// Server
let port = 8080;
app.listen(port, function(){
  console.log('listening on port:' + port);
});

console.log("App listening on port 8080");