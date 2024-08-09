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
            try {
                let decoded = await jwt.verify(auth, privateKey, {
                    algorithm: ['HS512']
                });
                req.jwt_data = decoded;
                    sqlq = ' SELECT EXISTS(SELECT * FROM  stock_mgmt.users WHERE id =' + decoded.id + ' AND token="' + auth + '")AS count';
                var sql = con.query(sqlq, (err, result) => {
                    con.release();
                    if (err) {
                        console.log(err)
                        return res.json({
                            msg: 'plz try after sometime',
                            status: 0
                        });
                    } else {
                        if (result[0].count != 0) {
                            console.log("Session Success")
                            next();
                        } else {
                            console.log("Session Failed due to another logged In")     // Single Login .................
                            // console.log(req.body)
                            return res.status(401).send({
                                msg: 'User Not Autheticated',
                                status: 401,
                             });
                        }
                    }
                })
                

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

