"use strict";
var express = require('express'),
    compress = require('compression'),
    own_use = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/ownuse');
async function addown_use(req) {
    console.log('Add own use Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, logststus = false;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
                console.log('Data', data);
                if (data.modetype == 0) {
                    let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid =" + data.model_sid + " and sstatus=1 ");
                    if (checkprofile[0][0]['cnt'] == 0) {
                        let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${bid},model_sid=${data.model_sid} ,depid=${data.depid},cby=${jwtdata.id}`;
                        // console.log('ADD own_use Query:------------------------ ', addhd);
                        addhd = await conn.query(addhd);
                        if (addhd[0]['affectedRows'] > 0) {
                            let addhd1 = `UPDATE  stock_mgmt.model_serial_num SET msnstatus = 2 where model_sid=${data.model_sid} `;
                            // console.log('8888888$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ADD own_use Query: ', addhd1);
                            [addhd1] = await conn.query(addhd1);
                            if (addhd1['affectedRows'] == 1) {
                                // Sucess message
                                logststus = true;
                                erroraray.push({ msg: " Own_use Deatil Created Succesfully", err_code: 0 });
                                await conn.commit();
                            } else {
                                erroraray.push({ msg: "Contact Your Admin.", err_code: 35 });
                                await conn.rollback();
                                // throw error message
                            }
                        } else {
                            erroraray.push({ msg: "Own_use Deatil Already .", err_code: 41 });
                            await conn.rollback();
                            //throw error message
                        }
                    }
                }

                if (data.modetype == 1) {
                    console.log("data", data.serial_num.length);
                    for (var s = 0; s < data.serial_num.length; s++) {
                        if (((data.serial_num.length) - 1) == s) logststus = true;
                        let bid = jwtdata.role == 999 ? data.bid : jwtdata.bid;
                        let seri = data.serial_num[s];
                        console.log('lenghtttt', seri);
                        let checking = await conn.query(`select serial_num,model_sid from stock_mgmt.model_serial_num where serial_num ='${seri.serialno}'`);
                        console.log('itssss', checking);
                        let check = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid = ${checking[0][0].model_sid} AND sstatus = 1`);
                        console.log('c', check[0].length);
                        if (check[0][0]['cnt'] == 0) {
                            let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${bid},depid=${data.depid},model_sid=${checking[0][0].model_sid},cby=${jwtdata.id}`;
                            console.log(' own_use Query: ', addhd);
                            addhd = await conn.query(addhd);
                            if (addhd[0]['affectedRows'] > 0) {
                                let addhd1 = `UPDATE  stock_mgmt.model_serial_num SET msnstatus = 2 where model_sid=${checking[0][0].model_sid} `;
                                console.log('ADD own_use Query: ', addhd1);
                                [addhd1] = await conn.query(addhd1);
                                if (addhd1['affectedRows'] == 1) {
                                    // Sucess message
                                    erroraray.push({ msg: "Own_use Deatil Created Succesfully", err_code: 0 });
                                    await conn.commit();
                                } else {
                                    // throw error message
                                    erroraray.push({ msg: "Own_use Deatil Already .", err_code: 41 });
                                    await conn.rollback();
                                }
                            }
                            else {
                                // throw err log
                                erroraray.push({ msg: "Contact Your Admin.", err_code: 78 });
                                await conn.rollback()

                            }

                        }
                        else {
                            // throw err log

                            erroraray.push({ msg: "Already exits.", err_code: 87 });
                            await conn.rollback()
                        }
                    }

                }
                if (logststus) {
                    let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD OWN USE',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                    sqllog = await conn.query(sqllog);
                    if (sqllog[0]['affectedRows'] > 0) {
                        erroraray.push({ msg: " Own_use Deatil LOG Created Succesfully", err_code: 0 });
                        await conn.commit();
                    }
                    else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
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
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = ` SELECT o.ownid,o.bid,o.model_sid,b.bname,m.serial_num,o.sstatus,i.itemname,o.depid,d.depname,h.hubname FROM stock_mgmt.own_use o
    INNER JOIN stock_mgmt.business b ON o.bid=b.id AND o.sstatus =1
    INNER JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
    LEFT JOIN stock_mgmt.invoice_items i ON m.inv_itemid = i.iiid
   LEFT JOIN stock_mgmt.department d ON o.depid =d.id
   LEFT JOIN stock_mgmt.hub h ON h.hbid =o.hubid`,
        sqlqueryc = ` SELECT COUNT(*) AS count FROM stock_mgmt.own_use o
        INNER JOIN stock_mgmt.business b ON o.bid=b.id AND o.sstatus =1
        INNER JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
        LEFT JOIN stock_mgmt.invoice_items i ON m.inv_itemid = i.iiid
       LEFT JOIN stock_mgmt.department d ON o.depid =d.id
       LEFT JOIN stock_mgmt.hub h ON h.hbid =o.hubid `, finalresult = [],
        data = req.body, jwtdata = req.jwt_data;
    if (data.depid != '' && data.depid != null) where.push(` o.depid = ${data.depid} `);
    if (data.model_sid != '' && data.model_sid != null) where.push(` o.model_sid = ${data.model_sid} `);
    let bid = jwtdata.urole == 999 ? data.busid : jwtdata.bid;
    if (jwtdata.urole > 888 && data.busid != '' && data.busid != null) where.push(`  o.bid= ${bid} `);
    if (jwtdata.urole <= 888) where.push(` o.bid= ${bid} `);
    if (where.length > 0) {
        where = ' WHERE' + where.join(' AND ');
        sqlquery += where;
        sqlqueryc += where;
    }
    sqlquery += ' LIMIT ?,?'
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
          SELECT o.ownid,o.bid,m.serial_num,m.model_sid ,o.sstatus,o.depid,m.modelid,o.hubid,i.iiid,i.itemname  FROM stock_mgmt.own_use o     
        LEFT JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
        LEFT JOIN stock_mgmt.invoice_items i ON i.iiid =m.inv_itemid
         WHERE  o.ownid =${data.id}`;
    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hdid= ${jwtdata.hdid} `);
    // if (where.length > 0) {
    //     where = where.join(' AND ');
    //     sqlquery += where;
    // }

    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                console.log("own use get", sqlquery);
                // console.log('get channel', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result[0]));
                    console.log("+=================+++++=", result[0], "--------");
                }
            });
        }
    });
});



own_use.post('/selectmodel_serial', function (req, res) {
    console.log('Get users');
    var data = req.body, where = [], jwtdata = req.jwt_data, sql;
    console.log('Get users', data);
    var sqlquery = `
    SELECT n.model_sid, n.serial_num 
    FROM stock_mgmt.model_serial_num n
    WHERE .n.inv_itemid = ${data.inv_itemid}  
    AND n.model_sid NOT IN (
        SELECT o.model_sid
        FROM stock_mgmt.own_use o
        WHERE o.sstatus = 1       
    )`;
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
    var sql, data = req.body, where = [], jwtdata = req.jwt_data;
    console.log('Get users', data);
    var sqlquery = `SELECT n.model_sid, n.serial_num FROM stock_mgmt.model_serial_num n  WHERE modelid=${data.modelid} AND  (n.msnstatus=1 or n.model_sid = ${data.model_sid}) `;
    sqlquery += where.join('');
    console.log('data', sqlquery);
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                console.log("result in serial edit", result);

                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));

                }
            });
        }
    });
});

async function editown_use(req) {
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '', logststus = false;
        let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
        console.log('edit own use Data:', data);
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                let osncs = '', osncs1 = '', checkcont = await conn.query("  SELECT ou.depid,d.depname,ou.model_sid,mn.serial_num,ou.bid,b.bname,ou.sstatus FROM stock_mgmt.own_use ou INNER JOIN stock_mgmt.business b ON ou.bid=b.id INNER JOIN stock_mgmt.department d ON ou.depid=d.id INNER JOIN stock_mgmt.model_serial_num mn ON mn.model_sid =ou.model_sid WHERE ou.ownid =" + data.id)
                console.log("edit the statement for log  ", checkcont[0].length);
                if (checkcont[0].length == 1) {
                    let old = checkcont[0][0];
                    console.log("checkcont ", old);
                    let addhd1 = ` update stock_mgmt.own_use SET mby=${jwtdata.id},mdate=now()`;
                    //DEPARTMENT CHANGE LOG
                    if (old.depid != data.depid) {
                        console.log("department");
                        let checkhdid = `select concat(' From ','${old.depname} ',' TO ',depname) depname from  department where id=${data.depid}  `;
                        [[checkhdid]] = await conn.query(checkhdid);
                        alog += `  Department Name  Changed ${checkhdid['depname']}.`;
                        addhd1 += `,depid=${data.depid}`;
                    }
                    //BUSINESS CHANGE LOG
                    if (old.bid != bid) {
                        let checkhdid = ` select concat(' From ','${old.bname} ',' TO ',bname) bname from  business where id=${bid}   `;
                        [[checkhdid]] = await conn.query(checkhdid);
                        alog += ` Business Name Changed ${checkhdid['bname']}.`;
                        addhd1 += `,bid=${bid}`;
                    }

                    // MODEL SERIAL NO CHANGE LOG
                    if (old.model_sid != data.model_sid) {
                        let cnsn = `SELECT model_sid,modelid,serial_num,msnstatus FROM model_serial_num WHERE model_sid =${data.model_sid}`;
                        [cnsn] = await conn.query(cnsn);
                        console.log("model sid #######", cnsn.length, "data", cnsn);
                        if (cnsn.length) {
                            if (cnsn[0]['msnstatus'] != 1) {
                                // Throw Error
                                erroraray.push({ msg: 'Remove selected serial no from HUB', err_code: 'ERR' })
                                await conn.rollback();
                            } else {
                                osncs += `update model_serial_num set msnstatus=1,mby=${jwtdata.id},mdate=now() where model_sid =${old.model_sid}`;
                                addhd1 += `,model_sid =${data.model_sid}`;
                                alog += ` Serial Number Changed From ${old.serial_num} To ${cnsn[0]['serial_num']}.`;
                                console.log("serial no log", alog);
                                if (cnsn[0]['msnstatus'] = 1) {
                                    osncs1 += `update model_serial_num set msnstatus=2,mby=${jwtdata.id},mdate=now() where model_sid =${data.model_sid}`;
                                    // alog += ` Serial Number Changed From ${old.serial_num} To ${cnsn[0]['serial_num']}.`;
                                    // console.log("serial no log", alog);
                                }
                            }
                        }
                        else {
                            // throw error
                            erroraray.push({ msg: 'Please try after sometimes err', err_code: '307' })
                            await conn.rollback();
                        }
                    }
                    // Status CHANGE LOG
                    if (old.sstatus != data.sstatus) {
                        addhd1 += `,sstatus=${data.sstatus}`;
                        alog += ` Status Changed TO ${old.sstatus == 0 ? 'Delete From Own Stock' : 'Added To The Own Assets'}.`;
                    }
                    if (addhd1 != '') {
                        addhd1 += ` WHERE ownid =${data.id} `;
                        console.log('addhd1 Query :', addhd1);
                        [addhd1] = await conn.query(addhd1);
                        console.log('addhd1 :', addhd1);
                        if (addhd1['affectedRows'] == 1) {
                            if (osncs != '') {
                                [osncs] = await conn.query(osncs);
                                if (osncs['affectedRows'] == 1) {
                                    [osncs1] = await conn.query(osncs1);
                                    if (osncs1['affectedRows'] == 1) {
                                        logststus = true;
                                    } else {
                                        // throw error
                                        erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })
                                        await conn.rollback();
                                    }
                                } else {
                                    // throw error
                                    erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })
                                    await conn.rollback();
                                }
                            }
                            else {
                                // commit and sucess
                                logststus = true;

                            }
                        }
                        if (logststus) { //log start
                            let sqllog = "INSERT INTO stock_mgmt.own_use_log SET `remarks`='" + alog + " DONE BY', ownuseid=" + data.id + ", oustatus=" + data.sstatus + ",cby=" + jwtdata.id;
                            sqllog = await conn.query(sqllog);
                            if (sqllog[0]['affectedRows'] > 0) {
                                erroraray.push({ msg: "Own use Deatil Edited Succesfully", err_code: 0 });
                                await conn.commit();
                            }
                            else {
                                erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                                await conn.rollback();
                            }
                        }   //log 
                    }
                }
            }
            catch (e) {
                console.log('Try Catch Error ', e);
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
    } else {
        let result = await addown_use(req);
        console.log("Process Completed", result);
        res.end(JSON.stringify(result));
    }
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
                let checkloc = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use_location where stateid=${data.stateid} and districtid=${data.districtid} and ownid ='${data.ownid}'`);
                console.log("check the log", checkloc);
                if (checkloc[0][0]['cnt'] == 0) {
                    var addloc = ` Insert into stock_mgmt.own_use_location set
                  stateid=${data.stateid},
                  districtid=${data.districtid},
                  locname='${data.locname}',
                  locaddress='${data.locaddress}',
                  hubid=${data.hubid},
                  ownid=${data.ownid}
                  `;
                    console.log('adddddddddddd', addloc);
                    addloc = await conn.query(addloc);
                    if (addloc[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id=' own_use Location Detail',`longtext`='DONE BY'";
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
    const validation = joiValidate.own_useDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
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
                    let addhd = `UPDATE  stock_mgmt.own_use SET`;
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