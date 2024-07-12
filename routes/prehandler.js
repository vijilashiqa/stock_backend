var jwt = require('jsonwebtoken'),
privateKey  = require('../config/key'),
    pool = require('../connection/conn');


module.exports = async (req, res, next) => {
    var sqlquery;
    pool.getConnection(async (err, con) => {
        if (err) {
            console.log(err);
            return res.json({
                msg: 'Please Try After Sometimes',
                status: 0
            });
        } else {
            const auth = req.headers.authorization || req.headers.Authorization;
            // console.log('token',auth);
            // For Decode
            try {
                let decoded = await jwt.verify(auth, privateKey, {
                    algorithm: ['HS512']
                });
                // console.log('Decoded************************', decoded);
                req.jwt_data = decoded;
                //TODO:logic need to implement.....
                next();
                

            } catch (e) {                  // Token Expiration...........................
                con.release();
                // console.log('Inside prehandler Catch........ Token Expired......',e)
                return res.status(401).send({
                    msg: 'Token is Expired',
                    status: 401,
                    restore: true
                });
            }
        }
    });
}

