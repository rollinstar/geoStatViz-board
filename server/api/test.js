/**
 * test rest api example
 */
let express = require('express');
let router  = express.Router();

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

router.get('/:test2',
    function(req, res, next){
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

module.exports = router;
