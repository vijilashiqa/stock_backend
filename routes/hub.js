
"use strict";
var express = require('express'),
    compress = require('compression'),
    hub = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;

async function addhub(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.hub WHERE hubname ='" + data.hubname + "'");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let status = data.status == true ? 1 : 0;
                    // data.addr = data.addr.replace("'", ' ');
                    let addhd = `INSERT INTO stock_mgmt.hub SET   
                                                                       hubname ='${data.hubname}',
                                                                       descs='${data.desc}'
                                                                     `;
                    console.log('ADD hub Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id=' hub detail',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " HUB Deatil Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " HUB Deatil  Already Exists.", err_code: 56 });
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
            erroraray.push({ msg: 'Please try after sometimes', err_code: 68 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}


hub.post('/listhub', function (req, res, err) {
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT * FROM `stock_mgmt`.hub  LIMIT ?,? ',
        sqlqueryc = ' SELECT COUNT(*) AS count FROM `stock_mgmt`. hub ', finalresult = [],
        data = req.body;

    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hsn.hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hsn.hdid= ${jwtdata.hdid} `);

    // if (where.length > 0) {
    //     where = ' WHERE' + where.join(' AND ');
    //     sqlquery += where;
    //     sqlqueryc += where;
    // }
    // sqlquery += ' LIMIT ?,? ';
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

hub.post('/gethub', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = `SELECT * FROM stock_mgmt.hub WHERE hbid =${data.id}`;
    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hdid= ${jwtdata.hdid} `);
    // if (where.length > 0) {
    //     where = where.join(' AND ');
    //     sqlquery += where;
    // }
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                // console.log(id,"++++++++++");
                console.log('get channel', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result[0]));
                    console.log(result[0], "--------");
                }
            });
        }
    });
});

async function edithub(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT *  FROM stock_mgmt.`hub` WHERE hubname ='" + data.hubname + "' and  hbid!=" + data.id + "");
                if (checkprofile[0].length == 0) {
                    let chs = checkprofile[0][0];
                    let status = data.status == true ? 1 : 0;
                    let addhd = `UPDATE  stock_mgmt.hub SET  
                    hubname ='${data.hubname}',
                    descs='${data.desc}'`;



                    addhd += ' WHERE hbid =' + data.id
                    console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO  stock_mgmt.activitylog SET table_id='UPDATE hub Deatil',`longtext`=' " + alog + " DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " hub Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "hub Already exists.", err_code: 243 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                console.log(e)
                erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })
                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ msg: 'Please try after sometimes', err_code: 256 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}


hub.post('/addhub', async (req, res) => {
    req.setTimeout(864000000);
    // const validation = joiValidate.hubDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await addhub(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


hub.post('/edithub', async (req, res) => {
    req.setTimeout(864000000);
    // const validation = joiValidate.edithubDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await edithub(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});

module.exports = hub;