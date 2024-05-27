"use strict";
var express = require('express'),
    compress = require('compression'),
    own_use = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
    const joiValidate = require('../schema/ownuse');
async function addown_use(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                if (data.modetype == 0) {
                    let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid =" + data.model_sid + " and sstatus=1");
                    if (checkprofile[0][0]['cnt'] == 0) {
                        let status = data.status == true ? 1 : 0;
                        // data.addr = data.addr.replace("'", ' ');
                        let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${data.bid},model_sid=${data.model_sid}`;
                        console.log('ADD own_use Query: ', addhd);
                        addhd = await conn.query(addhd);
                    } else {
                        erroraray.push({ msg: " Own_use Deatil  Already Exists.", err_code: 56 });
                        await conn.rollback();
                    }
                }


                if (data.modetype == 1) {
                    console.log("data", data.serial_num.length);
                    for (var s= 0; s < data.serial_num.length; s++) {
                        let seri = data.serial_num[s];
                        console.log('lenghtttt', seri);
                        let checking = await conn.query(`select serial_num,model_sid from stock_mgmt.model_serial_num where serial_num ='${seri.serialno}'`);
                        console.log('itssss', checking);
                       
                            let check = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid = ${checking[0][0].model_sid} AND sstatus = 1`);
                            console.log('c',check[0].length);
                            if (check[0][0]['cnt'] == 0) {

                                let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${data.bid},model_sid=${checking[0][0].model_sid}`;
                                console.log(' own_use Query: ', addhd);
                                addhd = await conn.query(addhd);
                            } else {
                                erroraray.push({ msg: " Own_use Deatil  Already Exists.", err_code: 56 });
                                await conn.rollback();
                            }

                        // } else {
                        //     erroraray.push({ msg: " serial not exits.", err_code: 56 });
                        //     await conn.rollback();
                        //     // Handle the case where serial number is not found
                        // }

                    }

                }

                let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id=' own_use detail',`longtext`='DONE BY'";
                sqllog = await conn.query(sqllog);
                if (sqllog[0]['affectedRows'] > 0) {
                    erroraray.push({ msg: " Own_use Deatil Created Succesfully", err_code: 0 });
                    await conn.commit();
                }
                else {
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


own_use.post('/listown_use', function (req, res, err) {
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = `SELECT o.ownid,o.bid,o.model_sid,b.bname,m.serial_num,o.sstatus,i.itemname FROM stock_mgmt.own_use o 
    INNER JOIN stock_mgmt.business b ON o.bid=b.id
    INNER JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
    LEFT JOIN stock_mgmt.invoice_items i ON m.inv_itemid = i.iiid 
      LIMIT ?,? `,
        sqlqueryc = ` SELECT COUNT(*) AS count FROM stock_mgmt. own_use o
        INNER JOIN stock_mgmt.business b ON o.bid=b.id
        INNER JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
        LEFT JOIN stock_mgmt.invoice_items i ON m.inv_itemid = i.iiid  `, finalresult = [],
        data = req.body;

    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hsn.hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hsn.hdid= ${jwtdata.hdid} `);

    // if (where.length > 0) {
    //     where = ' WHERE' + where.join(' AND ');
    //     sqlquery += where;
    //     sqlqueryc += where;
    // }
    // sqlquery += ' LIMIT ?,? ';
    console.log('ddddddd', sqlquery);
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

own_use.post('/getown_use', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = ` 
        SELECT o.ownid,o.bid,m.serial_num,o.model_sid,o.sstatus,m.modelid FROM stock_mgmt.own_use o     
        LEFT JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
         WHERE   o.ownid =${data.id}`;
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



own_use.post('/selectmodel_serial', function (req, res) {
    console.log('Get users');

    var sql, data = req.body, where = [], jwtdata = req.jwt_data;

    var sqlquery = `
    SELECT n.model_sid, n.serial_num 
    FROM stock_mgmt.model_serial_num n
    WHERE n.modelid = ${data.modelid}  
    AND n.model_sid NOT IN (
        SELECT o.model_sid
        FROM stock_mgmt.own_use o
        WHERE o.sstatus = 1       
    )
    `;

    sqlquery += where.join('');

    console.log('data', sqlquery);

    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                }
            });
        }
    });
});
own_use.post('/selectmodel_serialedit', function (req, res) {
    console.log('Get users');

    var sql, data = req.body, where = [], jwtdata = req.jwt_data;

    var sqlquery = `SELECT n.model_sid, n.serial_num FROM stock_mgmt.model_serial_num n WHERE n.modelid = ${data.modelid}  
    AND n.model_sid  IN (SELECT o.model_sid FROM stock_mgmt.own_use o WHERE o.sstatus = 1) `;

    sqlquery += where.join('');

    console.log('data', sqlquery);

    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                }
            });
        }
    });
});

async function editown_use(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                if (data.serail_num) {
                    console.log("data", data.serail_num.length);
                    for (i = 0; i < data.serail_num.length; i++) {
                        let ser = data.serail_num
                        console.log(ser);
                        let check = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid =" + ser.serial_num + " and sstatus=1");
                        if (check[0].length == 0) {
                            let addhd = `INSERT INTO stock_mgmt.own_use SET bid=${data.bid},model_sid=${ser.serial_num}`;
                            console.log('ADD own_use Query: ', addhd);
                            addhd = await conn.query(addhd);
                        } else {
                            erroraray.push({ msg: " Own_use Deatil  Already Exists.", err_code: 56 });
                            await conn.rollback();
                        }
                    }
                } else {
                    let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid =" + data.model_sid + " and sstatus=1 and ownid!="+data.id);
                    if (checkprofile[0][0]['cnt'] == 0) {
                        let status = data.status == true ? 1 : 0;
                        // data.addr = data.addr.replace("'", ' ');
                        let addhd = ` update stock_mgmt.own_use SET model_sid=${data.model_sid},sstatus=${data.sstatus} where ownid=${data.id} `;
                        console.log('ADD own_use Query: ', addhd);
                        addhd = await conn.query(addhd);
                    } else {
                        erroraray.push({ msg: " Own_use Deatil  Already Exists.", err_code: 56 });
                        await conn.rollback();
                    }
                }

                let sqllog = "INSERT INTO  stock_mgmt.activitylog SET table_id='UPDATE own_use Deatil',`longtext`=' " + alog + " DONE BY'";
                sqllog = await conn.query(sqllog);
                if (sqllog[0]['affectedRows'] > 0) {
                    erroraray.push({ msg: " own_use Deatil Updated Succesfully", err_code: 0 });
                    await conn.commit();
                }
                else {
                    erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
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


own_use.post('/addown_use', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.own_useDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addown_use(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


own_use.post('/editown_use', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editown_useDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editown_use(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});

///////////////////////////////////////////Own_use_location ?????????????????????????????????

async function addown_location(req) {
    console.log('Add location :', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('data', data);
                let checkloc = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use_location where model_sid=${data.model_sid} and hbid=${data.hbid}`);
                if (checkloc[0][0]['cnt'] == 0) {
                    addloc = ` Insert into stock_mgmt.own_use_location set
                  model_sid=${data.model_sid},
                  hbid=${data.hbid},
                  stateid=${data.stateid},
                  districtid=${data.districtid},
                  locname=${data.locname},
                  locaddress=${data.locaddress},
                  oulstatus=${data.oulstatus},
                  removedreson='${data.removedreson}'  
                    `;
                    console.log('adddddddddddd', addloc);
                    addloc = await conn.query(addloc);


                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id=' own_use detail',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Location  Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }

                }
                else {
                    erroraray.push({ msg: "Location  Already exists.", err_code: 243 });
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

own_use.post('/addown_location', async (req, res) => {
    req.setTimeout(864000000);
    // const validation = joiValidate.own_useDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await addown_location(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

async function editown_use_location(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use_location where model_sid=${data.model_sid} and hbid=${data.hbid} and oulid!=${data.id}`);
                if (checkprofile[0].length == 0) {
                    let chs = checkprofile[0][0];
                    let status = data.status == true ? 1 : 0;
                    let addhd = `UPDATE  stock_mgmt.own_use SET  
                   `;



                    addhd += ' WHERE oulid =' + data.id
                    console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO  stock_mgmt.activitylog SET table_id='UPDATE own_use Deatil',`longtext`=' " + alog + " DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " own_use Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "own_use Already exists.", err_code: 243 });
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
own_use.post('/editown_use_location', async (req, res) => {
    req.setTimeout(864000000);
    // const validation = joiValidate.editown_useDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await editown_use_location(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});
module.exports = own_use;