/**
 * test rest api example
 */
let express = require('express');
let router  = express.Router();
let R = require("r-script");
let fs = require("fs");

router.get('/:test',
    function(req, res, next){
        console.log('req : ', req.params.test);
        let result = {
            success: true,
            data: {
                id: 'test',
                name: 'test name'
            }
        };

        res.json(result);
    }
);

router.get('/rtest/:test2',
    function(req, res, next){
        console.log('req : ', req.params.test2);
        console.log('dir name : ', __dirname);
        let result = {
            success: true,
            data: {
                id: 'test',
                name: 'test name'
            }
        };

        var test = JSON.parse(fs.readFileSync(__dirname + "/test.json", "utf8"));
        
        R("/Users/linkit/Documents/00 Dev/linkit-geo-board/server/rscript/test.R")
        .data({df: test, nGroups: 3, fxn: "mean" })
        .call(function(err, d) {
            if (err) throw err;
            console.log('test : ', d);
        });

        res.json(result);
    }
);

module.exports = router;
