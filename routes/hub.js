
"use strict";
var express = require('express'),
    compress = require('compression'),
    hub = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
    const joiValidate = require('../schema/hub');


async function addhub(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.hub WHERE hubname ='" + data.hubname + "'");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let addhd = `INSERT INTO stock_mgmt.hub SET   
                                                                       hubname ='${data.hubname}',
                                                                       bid=${bid},
                                                                       descs='${data.desc}',
                                                                       depid =${data.depid},
                                                                       hubincname='${data.hubincname}',
                                                                       hubmobile=${data.hubmobile},
                                                                       hubaddr ='${data.hubaddr}',
                                                                       stateid=${data.stateid},
                                                                       destid=${data.destid},
                                                                       cby=${jwtdata.id}`;
                    console.log('ADD hub Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD HUB DETAILS',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
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
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT h.hbid,h.depid,h.bid,h.hubname,h.hubincname,h.hubmobile,h.hubaddr,d.depname,b.bname,h.descs FROM stock_mgmt.hub h INNER JOIN stock_mgmt.business b ON b.id = h.bid INNER JOIN stock_mgmt.department d ON d.id = h.depid',
        sqlqueryc = ' SELECT COUNT(*) AS count FROM stock_mgmt.hub h INNER JOIN stock_mgmt.business b ON b.id = h.bid INNER JOIN stock_mgmt.department d ON d.id = h.depid ', finalresult = [],
        data = req.body;
        data = req.body,jwtdata = req.jwt_data, where=[];
        if (data.depid != '' && data.depid != null) where.push(` h.depid = ${data.depid} `);
        if (data.hubid != '' && data.hubid != null) where.push(` h.hbid = ${data.hubid} `);
        let bid = jwtdata.urole == 999  ? data.bid : jwtdata.bid;
        if (jwtdata.urole > 888 && data.bid != '' && data.bid != null) where.push(`  h.bid = ${bid} `);
        if (jwtdata.urole <= 888) where.push(` h.bid= ${bid} `);
        if (where.length > 0) {
            where = ' WHERE' + where.join(' AND ');
            sqlquery += where;
        }

          sqlquery += ' LIMIT ?,?'
        console.log("listt hub",sqlquery);
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

hub.post('/getserialno', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql,sqlqueryc, sqlquery = `SELECT ms.serial_num,ms.model_sid FROM stock_mgmt.model_serial_num ms 
    INNER JOIN stock_mgmt.own_use o ON  o.model_sid =ms.model_sid WHERE  o.hubid =0`;
// sqlqueryc = ' SELECT COUNT(*)  FROM stock_mgmt.model_serial_num ms INNER JOIN stock_mgmt.own_use o ON  o.model_sid =ms.model_sid WHERE  o.hubid =0'
    if (data.depid != '' && data.depid != null) where.push(` depid = ${data.depid} `);
    if (where.length > 0) {
        where = ' AND  ' + where.join(' AND ');
        sqlquery += where;
         sqlqueryc += where

    }
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                console.log('get serial no', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                    console.log(result, "--------");
                }
            });
        }
    });
});



hub.post('/gethub', function (req, res, err) {
    pool.getConnection(function (err, conn) {
        var where = [], data = req.body, sqlquery = `SELECT * FROM stock_mgmt.hub`
        if (data.id != '' && data.id != null) where.push(` hbid = ${data.id} `);
        if (data.bid != '' && data.bid != null) where.push(` bid = ${data.bid} `);
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ');
            sqlquery += where;
        }
        if (data.hasOwnProperty('like') && data.like) {
            sqlquery += ' AND hubname LIKE "%' + data.like + '%" '
        }

        console.log('get hub',sqlquery)
        if (!err) {
            var sql = conn.query(sqlquery, function (err, result) {
                conn.release();
                if (!err) {
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});



async function edithub(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT *  FROM stock_mgmt.`hub` WHERE hubname ='" + data.hubname + "' and  hbid!=" + data.id + "");
                if (checkprofile[0].length == 0) {
                    // let chs = checkprofile[0][0];
                    // let status = data.status == true ? 1 : 0;
                    let addhd = `UPDATE  stock_mgmt.hub SET  
                   hubname ='${data.hubname}',
                                                                       bid=${bid},
                                                                       descs='${data.desc}',
                                                                       depid =${data.depid},
                                                                       hubincname='${data.hubincname}',
                                                                       hubmobile=${data.hubmobile},
                                                                       hubaddr ='${data.hubaddr}',
                                                                       stateid=${data.stateid},
                                                                       destid=${data.destid},
                                                                       mby=${jwtdata.id}`;


                    addhd += ' WHERE hbid =' + data.id
                    console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT HUB Details',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
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




async function updateownuse(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                    let updatestock = ` update stock_mgmt.own_use SET hubid =${data.hubid} where model_sid=${data.model_sid}`;
                    console.log('update stock: ', updatestock);
                    updatestock = await conn.query(updatestock);
                    if (updatestock[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='update stock',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Serial No Added Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
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




hub.post('/updateownuse', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.hubDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await updateownuse(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});



hub.post('/addhub', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.hubDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addhub(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


hub.post('/edithub', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.edithubDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await edithub(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});

module.exports = hub;