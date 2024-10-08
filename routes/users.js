
"use strict";
var express = require('express'),
    compress = require('compression'),
    users = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/users');


// async function addusers(req) {
//     console.log('Add model Data:', req.jwt_data);
//     return new Promise(async (resolve, reject) => {
//         var erroraray = [], data = req.body, jwtdata = req.jwt_data;
//         let conn = await poolPromise.getConnection();
//         if (conn) {
//             await conn.beginTransaction();
//             try {
//                 console.log('user Data', data);
//                 let addusers = await conn.query("SELECT count(*) count FROM stock_mgmt.users WHERE loginid = '" + data.loginid + "'  ");
//                 if (addusers[0][0]['count'] == 0) {
//                     data.address = data.address.replace("'", ' ');

//                     let addusers = `INSERT INTO stock_mgmt.users SET 
//                         bid=${data.bid},
//                         urole=${data.urole},
//                        loginid='${data.loginid}',
//                         fname='${data.fname}',                  
//                         pwd=md5('${data.pwd}'),
//                         mobile=${data.mobile},                 
//                         address='${data.address}',
//                         email='${data.email}'
//                         `;

//                     console.log('ADD users Query: ', addusers);
//                     addusers = await conn.query(addusers);
//                     if (addusers[0]['affectedRows'] > 0) {
//                         let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD users',`longtext`='DONE BY'";
//                         sqllog = await conn.query(sqllog);
//                         if (sqllog[0]['affectedRows'] > 0) {
//                             erroraray.push({ msg: " User created Succesfully", err_code: 0 });
//                             await conn.commit();
//                         }

//                     }

//                     else {
//                         erroraray.push({ msg: "Contact Your Admin.", err_code: 236 });
//                         await conn.rollback();
//                     }

//                 } else {
//                     erroraray.push({ msg: " User  Already Exists.", err_code: 241 });

//                     await conn.rollback();
//                 }
//             } catch (e) {
//                 console.log('Error ', e);
//                 erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })

//                 await conn.rollback();
//             }
//             console.log('Success--1');
//             console.log('connection Closed.');
//             conn.release();
//         } else {
//             erroraray.push({ msg: 'Please try after sometimes', err_code: 255 })
//             return;
//         }
//         console.log('success--2');
//         return resolve(erroraray);
//     });
// }

// users.post('/addusers', async (req, res) => {
//     req.setTimeout(864000000);

    // const validation = joiValidate.usersDatachema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
//     let result = await addusers(req);
//     console.log("Process Completed", result);
//     res.end(JSON.stringify(result));
// });

// users.post('/listuser', function (req, res, err) {
//     var sql, sqlquery = 'SELECT * FROM `stock_mgmt`.users LIMIT ?,? ',
//         sqlqueryc = 'SELECT COUNT(*) AS `count` FROM stock_mgmt.`users`', finalresult = [],
//         data = req.body;
//     pool.getConnection(function (err, conn) {
//         if (!err) {
//             sql = conn.query(sqlquery, [data.index, data.limit], function (err, result) {
//                 if (!err) {
//                     finalresult.push(result);
//                     sql = conn.query(sqlqueryc, function (err, result) {
//                         conn.release();
//                         if (!err) {
//                             finalresult.push(result[0]);
//                             res.end(JSON.stringify(finalresult));
//                         }
//                     });
//                 } else {
//                     conn.release();
//                 }
//             });
//         }
//     });
// });
// users.post('/getuser', function (req, res) {
//     console.log('getuser', req.body)
//     var data = req.body, where = [], jwtdata = req.jwt_data,

//         sqlquery = `SELECT * FROM stock_mgmt.users where id=${data.id} `;
   
//     console.log('data', sqlquery)
//     pool.getConnection(function (err, conn) {
//         if (err) {
//             console.log(err);
//         } else {
//             var sql = conn.query(sqlquery, function (err, result) {

//                 conn.release();
//                 if (!err) {
//                     res.end(JSON.stringify(result));
//                 }
//             });
//         }
//     });
// });


// async function editusers(req) {
//     console.log('Edit User Data:', req.jwt_data);
//     return new Promise(async (resolve, reject) => {
//         var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
//         let conn = await poolPromise.getConnection();
//         if (conn) {
//             await conn.beginTransaction();
//             try 
//             {
//                 console.log('User Data', data);
//                 let checkusers = await conn.query(`SELECT * FROM stock_mgmt.users WHERE loginid ='${data.loginid}' and id !=${data.id}`);
//                console.log("length ##########",checkusers[0].length)
//                 if (checkusers[0].length == 0) {

//                     data.address = data.address.replace("'", ' ');
//                     let addusers = `UPDATE  stock_mgmt.users SET  
//                     bid=${data.bid},
//                     loginid='${data.loginid}',
//                     urole=${data.urole},
//                     fname='${data.fname}',                  
//                     mobile=${data.mobile},                 
//                     address='${data.address}',
//                     email='${data.email}'`;


//                     addusers += ' WHERE id =' + data.id
//                     addusers = await conn.query(addusers);


//                     if (addusers[0]['affectedRows'] > 0) {
//                         let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE USER',`longtext`='" + alog + " DONE BY'" ;
//                         sqllog = await conn.query(sqllog);
//                         if (sqllog[0]['affectedRows'] > 0) {
//                             erroraray.push({ msg: " Users Updated Succesfully", err_code: 0 });
//                             await conn.commit();
//                         }
//                     } else {
//                         erroraray.push({ msg: "Please Check User ID", err_code: 504 });
//                         await conn.rollback();
//                     }
//                 } else {
//                     erroraray.push({ msg: " users Already Exists.", err_code: 508 });
//                     await conn.rollback();
//                 }
//             } catch (e) {
//                 console.log('Error ', e);
//                 erroraray.push({ msg: 'Please try after sometimes', err_code: 'ERR' })


//                 await conn.rollback();
//             }
//             console.log('Success--1');
//             console.log('connection Closed.');
//             conn.release();
//         } else {
//             erroraray.push({ msg: 'Please try after sometimes', err_code: 522 })
//             return;
//         }
//         console.log('success--2');
//         return resolve(erroraray);

//     });

// }


// users.post('/editusers', async (req, res) => {
//     req.setTimeout(864000000);
//     let result = await editusers(req);
//     console.log("Process Completed", result);
//     res.end(JSON.stringify(result));
// });


// users.post('/geteditusers', function (req, res) {
//     console.log('Get users');
//     var data = req.body, jwtdata = req.jwt_data, where = [],
//         sql, sqlquery = 'SELECT * FROM stock_mgmt.users where id=' + data.id

//     pool.getConnection(function (err, conn) {
//         if (!err) {
//             sql = conn.query(sqlquery, function (err, result) {
//                 console.log('get users id', sql.sql);
//                 conn.release();
//                 if (!err) {
//                     res.end(JSON.stringify(result[0]));
//                 }
//             });
//         }
//     });
// });


users.post('/listuser', function (req, res, err) {
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT u.id,u.loginid,r.rolename,u.fname,r.role,b.bname FROM stock_mgmt.users u  LEFT JOIN stock_mgmt.urole r ON  r.role=u.urole LEFT JOIN stock_mgmt.business b ON b.id =u.bid',
        sqlqueryc = ' SELECT COUNT(*) AS count  FROM stock_mgmt.users u  LEFT JOIN stock_mgmt.urole r ON  r.role=u.urole LEFT JOIN stock_mgmt.business b ON b.id =u.bid', finalresult = [],
        data = req.body;

if(data.hasOwnProperty('fname')&& data.fname) where.push(` u.fname ='${data.fname}'`)

if(data.hasOwnProperty('id')&& data.id) where.push(` u.id =${data.id}`)       



    if (where.length > 0) {
        where = ' WHERE' + where.join(' AND ');
        sqlquery += where;
        sqlqueryc += where;
    }
    sqlquery += ' LIMIT ?,? ';
    console.log('test',sqlquery);
    console.log(sqlqueryc);
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
                        } else {
                            console.log('err');
                        }
                    });
                } else {
                    conn.release();
                }
            });
        }
    });
});




users.post('/getfullname', function (req, res) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            var sql = conn.query(`select * from stock_mgmt.users  `, function (err, result) {
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                }
            });
        }
    });
});

users.post("/getuser", (req, res) => {
    let jwtdata = req.jwt_data, sqlg, data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, con) => {
        let sqlpr = `select * from stock_mgmt.users  where id =${data.id}`;

        console.log("Query---", sqlpr);
        if (data.id) {
            sqlg = con.query(sqlpr, data.id, (err, result) => {
                con.release();
                if (err) {
                    console.log(err);
                } else {
                    console.log(result)
                    res.send(JSON.stringify(result));
                }
            });
        }
        else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 103 });

        }
    });
});




async function addusers(req) {
    console.log('Add model Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data,insertdata = { menurole: JSON.stringify(data.menurole), };
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('user Data', data);
                let addmenurole = await conn.query("SELECT count(*) count FROM stock_mgmt.users WHERE  loginid = '" + data.loginid + "' ");
              console.log("result in the add menu",addmenurole[0][0]['count']);
              
                if (addmenurole[0][0]['count'] == 0) {
                    data.address = data.address.replace("'", ' ');
                    // let bid = jwtdata.role == 999 ? data.bid : jwtdata.bid;
                  let   urole = data.urole == 999 ? 'Developer' :  data.urole == 888 ? 'Admin' : data.urole == 777 ? 'Bussiness'  : 'Business Employee'
                  console.log("role  @@@@@@@@@@@", urole);
                  let addmenurole = `INSERT INTO stock_mgmt.users SET 
                        bid=${data.bid},
                        urole=${data.urole},
                       loginid='${data.loginid}',
                        fname='${data.fname}',                  
                        pwd=md5('${data.pwd}'),
                        mobile=${data.mobile},                 
                        address='${data.address}',
                        email='${data.email}',
                        rolename='${urole}',
                        umenu='${insertdata.menurole}' ,
                        cby=${jwtdata.id}
                        `;

                    console.log('ADD users Query: ', addmenurole);
                    addmenurole = await conn.query(addmenurole);
                    if (addmenurole[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='Add user',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
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

    const validation = joiValidate.usersDatachema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addusers(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


async function editusers(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, jwtdata = req.jwt_data, conn, erroraray = [], insertdata = { menurole: JSON.stringify(data.menurole), };
        let   urole = data.urole == 999 ? 'Developer' :  data.urole == 888 ? 'Admin' : data.urole == 777 ? 'Bussiness'  : 'Business Employee'
        try {
            conn = await poolPromise.getConnection();
            if (conn) {
                await conn.beginTransaction();
                console.log("update", data);
                let userupdate = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.users WHERE loginid ='"+data.loginid+"' and  id !=" + data.id + "");
                if (userupdate[0][0]['cnt'] == 0)
                 {
                let sqlupdate = `UPDATE  stock_mgmt.users SET  
                bid=${data.bid},
                loginid='${data.loginid}',
                urole=${data.urole},
                fname='${data.fname}',                  
                mobile=${data.mobile},                 
                address='${data.address}',
                email='${data.email}',
                rolename ='${urole}',
                    umenu='${insertdata.menurole}' where id ='${data.id}' `;
                    console.log("update query", sqlupdate);
                    let result = await conn.query(sqlupdate, data);
                    console.log("result", result);
                    if (result[0]["affectedRows"] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT Role',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: "Edit Menu Role Succesfully Updated.", err_code: 0 });
                            await conn.commit();
                        } else {
                            erroraray.push({ msg: "Audit Log Cant Add.", err_code: 1111 });
                            await conn.rollback();
                        }
                    } else {
                        erroraray.push({ msg: "Please Try After Sometimes", err_code: 1111 });
                        await conn.rollback();
                    }
           
            } else {
                erroraray.push({ msg: 'Loginid Already Exited', err_code: 'ERR' })
                await conn.rollback();
            }
        }
        } catch (e) {
            console.log("Catch Block Error", e);
            erroraray.push({ msg: "Please try after sometimes", error_msg: "TRYE" });
            await conn.rollback();
        }
        if (conn) conn.release();
        return resolve(erroraray)
    });
}

users.post("/editusers", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    const validation = joiValidate.editusersDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editusers(req);
    res.end(JSON.stringify(result));
}
);






module.exports = users;






