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
    
        // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` device.hdid= ${data.hdid} `);
        // if (jwtdata.role <= 777) where.push(` device.hdid= ${jwtdata.hdid} `);
    
        // if (where.length > 0) {
        //     where = ' WHERE' + where.join(' AND ');
        //     sqlquery += where;
        //     sqlqueryc += where;
        // }
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
    

    menurole.post("/getmenurole", (req, res) => {
        let jwtdata = req.jwt_data, sqlg, data = req.body;
        console.log("Data--", data);
        pool.getConnection((err, con) => {
            let sqlpr = `select id,loginid,rolename,urole,umenu from stock_mgmt.users  where id =${data.id}`;

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
                        let sqlupdate = `update stock_mgmt.users set umenu='${insertdata.menurole}' where id ='${data.id}' `;
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
