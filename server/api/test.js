/**
 * test rest api example
 */
let express = require('express');
let router  = express.Router();

router.get('/:test',
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
