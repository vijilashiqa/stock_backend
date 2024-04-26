
"use strict";
var express = require('express'),
    compress = require('compression'),
    users = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
// const joiValidate = require('../schema/users');


async function addusers(req) {
    console.log('Add model Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                // let hdid = '';
                // if (jwtdata.role > 777 && data.hdid != null && data.hdid != '') hdid = data.hdid;
                // if (jwtdata.role <= 777) hdid = jwtdata.hdid;
                // if (hdid == '' || hdid == null) {
                //     erroraray.push({ msg: "Please Select Headend.", err_code: 205 });
                //     await conn.rollback();
                // }
                console.log('user Data', data);

                let addusers = await conn.query("SELECT count(*) count FROM stock_mgmt.users WHERE loginid = '" + data.loginid + "'  ");
                if (addusers[0][0]['count'] == 0) {
                    data.address = data.address.replace("'", ' ');

                    let addusers = `INSERT INTO stock_mgmt.users SET 
                        bid=${data.bid},
                        urole=${data.urole},
                       loginid='${data.loginid}',
                        fname='${data.fname}',                  
                        pwd=md5('${data.pwd}'),
                        mobile=${data.mobile},                 
                        address='${data.address}',
                        email='${data.email}'
                        `;

                    console.log('ADD users Query: ', addusers);
                    addusers = await conn.query(addusers);
                    if (addusers[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD users',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " User created Succesfully", err_code: 0 });
                            await conn.commit();
                        }

                    }

                    else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 236 });
                        await conn.rollback();
                    }

                } else {
                    erroraray.push({ msg: " User  Already Exists.", err_code: 241 });

                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })

                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ msg: 'Please try after sometimes', err_code: 255 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}

users.post('/addusers', async (req, res) => {
    req.setTimeout(864000000);

    // const validation = joiValidate.usersDatachema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await addusers(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

users.post('/listuser', function (req, res, err) {
    var sql, sqlquery = 'SELECT * FROM `stock_mgmt`.users LIMIT ?,? ',
        sqlqueryc = 'SELECT COUNT(*) AS `count` FROM stock_mgmt.`users`', finalresult = [],
        data = req.body;
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, [data.index, data.limit], function (err, result) {
                if (!err) {
                    finalresult.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            finalresult.push(result[0]);
                            res.end(JSON.stringify(finalresult));
                        }
                    });
                } else {
                    conn.release();
                }
            });
        }
    });
});
users.post('/getuser', function (req, res) {
    console.log('getuser', req.body)
    var data = req.body, where = [], jwtdata = req.jwt_data,

        sqlquery = `SELECT * FROM stock_mgmt.users where id=${data.id} `;
   
    console.log('data', sqlquery)
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            var sql = conn.query(sqlquery, function (err, result) {

                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                }
            });
        }
    });
});


async function editusers(req) {
    console.log('Edit User Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try 
            {
                console.log('User Data', data);
                let checkusers = await conn.query(`SELECT * FROM stock_mgmt.users WHERE loginid ='${data.loginid}' and id !=${data.id}`);
               console.log("length ##########",checkusers[0].length)
                if (checkusers[0].length == 0) {

                    data.address = data.address.replace("'", ' ');
                    let addusers = `UPDATE  stock_mgmt.users SET  
                    bid=${data.bid},
                    loginid='${data.loginid}',
                    urole=${data.urole},
                    fname='${data.fname}',                  
                    mobile=${data.mobile},                 
                    address='${data.address}',
                    email='${data.email}'`;


                    addusers += ' WHERE id =' + data.id
                    addusers = await conn.query(addusers);


                    if (addusers[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE USER',`longtext`='" + alog + " DONE BY'" ;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Users Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Please Check User ID", err_code: 504 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " users Already Exists.", err_code: 508 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes', err_code: 'ERR' })


                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ msg: 'Please try after sometimes', err_code: 522 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);

    });

}


users.post('/editusers', async (req, res) => {
    req.setTimeout(864000000);

    // const validation = joiValidate.editusersDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await editusers(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


users.post('/geteditusers', function (req, res) {
    console.log('Get users');
    var data = req.body, jwtdata = req.jwt_data, where = [],
        sql, sqlquery = 'SELECT * FROM stock_mgmt.users where id=' + data.id

    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                console.log('get users id', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result[0]));
                }
            });
        }
    });
});




module.exports = users;






