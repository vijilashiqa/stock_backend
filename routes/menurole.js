"use strict";
var express = require('express'),
    compress = require('compression'),
    menurole = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;



menurole.post('/listmenurole', function (req, res, err) {
        var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT u.id,u.loginid,r.rolename,u.fname,r.role FROM stock_mgmt.users u LEFT JOIN stock_mgmt.urole r ON  r.role=u.urole ',
            sqlqueryc = ' SELECT COUNT(*) AS count  FROM stock_mgmt.users u LEFT JOIN stock_mgmt.urole r ON  r.role=u.urole', finalresult = [],
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
    

    
   
   menurole.post('/getfullname', function (req, res) {
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

    menurole.post("/getmenurole", (req, res) => {
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
                    let addmenurole = await conn.query("SELECT count(*) count FROM stock_mgmt.users WHERE loginid = '" + data.loginid + "'  ");
                    if (addmenurole[0][0]['count'] == 0) {
                        data.address = data.address.replace("'", ' ');
    
                        let addmenurole = `INSERT INTO stock_mgmt.users SET 
                            bid=${data.bid},
                            urole=${data.urole},
                           loginid='${data.loginid}',
                            fname='${data.fname}',                  
                            pwd=md5('${data.pwd}'),
                            mobile=${data.mobile},                 
                            address='${data.address}',
                            email='${data.email}',
                            umenu='${insertdata.menurole}' 
                            `;
    
                        console.log('ADD users Query: ', addmenurole);
                        addmenurole = await conn.query(addmenurole);
                        if (addmenurole[0]['affectedRows'] > 0) {
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


menurole.post('/addusers', async (req, res) => {
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


    async function editmenurole(req, res) {
        return new Promise(async (resolve, reject) => {
            let data = req.body, jwtdata = req.jwt_data, conn, erroraray = [], insertdata = { menurole: JSON.stringify(data.menurole), };
            try {
                let hdid = '';
                // if (jwtdata.role > 777 && data.hdid != null && data.hdid != '') hdid = data.hdid;
                // if (jwtdata.role <= 777) hdid = jwtdata.hdid;
                conn = await poolPromise.getConnection();
                if (conn) {
                    await conn.beginTransaction();
                    console.log("update", data);
                    let sqlq = `select exists(select * from stock_mgmt.users where id ='${data.id}' `;
                    // if (jwtdata.role > 777 && data.hdid != null && data.hdid != '') sqlq += ` AND hdid=${hdid} `;
                    sqlq += ` ) count `;
                    console.log("project query", sqlq);
                    let resp = await conn.query(sqlq);
                    console.log("result", resp);
                    if (resp[0][0].count == 0) {
                        erroraray.push({ msg: "No Data Found", err_code: 1 });
                        await conn.rollback();
                    } else {
                        let sqlupdate = `UPDATE  stock_mgmt.users SET  
                    bid=${data.bid},
                    loginid='${data.loginid}',
                    urole=${data.urole},
                    fname='${data.fname}',                  
                    mobile=${data.mobile},                 
                    address='${data.address}',
                    email='${data.email}',
                    rolename ='${data.rolename}',
                        umenu='${insertdata.menurole}' where id ='${data.id}' `;
                        // if (jwtdata.role > 777 && data.hdid != null && data.hdid != '') sqlupdate += ` AND hdid=${hdid} `;
                        console.log("update query", sqlupdate);
                        let result = await conn.query(sqlupdate, data);
                        console.log("result", result);
                        if (result[0]["affectedRows"] > 0) {
                            let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT ROLE',`longtext`='DONE BY',cby=" + data.id;
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
                    }
                } else {
                    erroraray.push({ msg: 'Please try after sometimes', err_code: 'ERR' })
                    await conn.rollback();
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
    
    menurole.post("/editmenurole", async (req, res) => {
        console.log(req.body);
        req.setTimeout(864000000);
        let result = await editmenurole(req);
        res.end(JSON.stringify(result));
    }
    );



    
module.exports = menurole;
