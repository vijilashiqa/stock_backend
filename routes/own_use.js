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
                console.log('Data', data);
                if (data.modetype == 0) {
                    let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid =" + data.model_sid + " and sstatus=1 ");
                    if (checkprofile[0][0]['cnt'] == 0) {
                        let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${data.bid},model_sid=${data.model_sid} ,depid=${data.depid},cby=${jwtdata.id}`;
                        console.log('ADD own_use Query:------------------------ ', addhd);
                        addhd = await conn.query(addhd);
                        if (addhd[0]['affectedRows'] > 0) {
                            let addhd1 = `UPDATE  stock_mgmt.model_serial_num SET msnstatus = 2 where model_sid=${data.model_sid} `;
                            console.log('8888888$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ADD own_use Query: ', addhd1);
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
                        if (((data.serial_num.length) - 1) == s)  logststus = true;
                        
                        let seri = data.serial_num[s];
                        console.log('lenghtttt', seri);
                        let checking = await conn.query(`select serial_num,model_sid from stock_mgmt.model_serial_num where serial_num ='${seri.serialno}'`);
                        console.log('itssss', checking);
                        let check = await conn.query(`SELECT COUNT(*) cnt FROM stock_mgmt.own_use WHERE model_sid = ${checking[0][0].model_sid} AND sstatus = 1`);
                        console.log('c', check[0].length);
                        if (check[0][0]['cnt'] == 0) {
                            let addhd = `INSERT INTO stock_mgmt.own_use SET  bid=${data.bid},depid=${data.depid},model_sid=${checking[0][0].model_sid},cby=${jwtdata.id}`;
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
                            
                            else{
                            // throw err log
                            erroraray.push({ msg: "Contact Your Admin.", err_code: 78 });
                            await conn.rollback()

                            }
                        
                        }
                        else{
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
   LEFT JOIN stock_mgmt.hub h ON h.hbid =o.hubid
      LIMIT ?,? `,
        sqlqueryc = `  SELECT o.ownid,o.bid,o.model_sid,b.bname,m.serial_num,o.sstatus,i.itemname,o.depid,d.depname,h.hubname FROM stock_mgmt.own_use o
        INNER JOIN stock_mgmt.business b ON o.bid=b.id AND o.sstatus =1
        INNER JOIN stock_mgmt.model_serial_num m ON o.model_sid=m.model_sid
        LEFT JOIN stock_mgmt.invoice_items i ON m.inv_itemid = i.iiid
       LEFT JOIN stock_mgmt.department d ON o.depid =d.id
       LEFT JOIN stock_mgmt.hub h ON h.hbid =o.hubid `, finalresult = [],
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
          SELECT o.ownid,o.bid,m.serial_num,m.model_sid ,o.sstatus,o.depid,o.hubid,i.iiid,i.itemname  FROM stock_mgmt.own_use o     
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

    var  data = req.body, where = [], jwtdata = req.jwt_data ,sql;

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
    

    var sql, data = req.body, where = [], jwtdata = req.jwt_data;
    console.log('Get users',data);
    var sqlquery = `SELECT n.model_sid, n.serial_num FROM stock_mgmt.model_serial_num n WHERE (n.msnstatus=1 or n.model_sid = ${data.model_sid})  `;

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
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
     console.log('edit own use Data:', data);

        //     let cont1 = 
        //  console.log("edit the count 1 ",cont1);
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                let checkcont= await conn.query("SELECT ou.depid,d.depname,ou.model_sid,mn.serial_num,ou.bid,b.bname,ou.hubid,h.hubname FROM stock_mgmt.own_use ou INNER JOIN stock_mgmt.business b ON ou.bid=b.id INNER JOIN stock_mgmt.department d ON ou.depid=d.id INNER JOIN stock_mgmt.hub h ON h.hbid=ou.hubid  INNER JOIN stock_mgmt.model_serial_num mn ON mn.model_sid =ou.model_sid WHERE ou.ownid =" + data.id)
                // console.log("SELECT ou.depid,d.depname,ou.model_sid,mn.serial_num,ou.bid,b.bname,ou.hubid,h.hubname FROM stock_mgmt.own_use ou INNER JOIN stock_mgmt.business b ON ou.bid=b.id INNER JOIN stock_mgmt.department d ON ou.depid=d.id INNER JOIN stock_mgmt.hub h ON h.hbid=ou.hubid  INNER JOIN stock_mgmt.model_serial_num mn ON mn.model_sid =ou.model_sid WHERE  ou.model_sid !=" + data.model_sid + " and ou.ownid =" + data.id); // old
                // let checkprofile = await conn.query("SELECT ou.depid,d.depname,ou.model_sid,mn.serial_num,ou.bid,b.bname,ou.hubid,h.hubname FROM stock_mgmt.own_use ou INNER JOIN stock_mgmt.business b ON ou.bid=b.id INNER JOIN stock_mgmt.department d ON ou.depid=d.id INNER JOIN stock_mgmt.hub h ON h.hbid=ou.hubid INNER JOIN stock_mgmt.model_serial_num mn ON mn.model_sid =ou.model_sid WHERE  ou.model_sid =" + data.model_sid + " and ou.ownid =" + data.id);
                 console.log("edit the statement for log  ", checkcont[0].length);
                if (checkcont[0].length == 1) {
                    let old = checkcont[0][0];
                    console.log("################ old @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", old);
                    let addhd1 = ` update stock_mgmt.own_use SET model_sid=${data.model_sid},sstatus=${data.sstatus},depid=${data.depid},bid=${data.bid},mby=${jwtdata.id}`;
                   

                    //HUB CHANGE LOG
                   
                    // if (old.hubid != data.hubid) {
                    //     let checkhdid = ` select concat(' From ','${old.hubname} ',' TO ',hubname) newhub from  hub where hbid=${data.hubid} `;
                    //     console.log('Get New Hub Name: ', checkhdid);
                    //     [[checkhdid]] = await conn.query(checkhdid);
                    //     alog += `  Hub Name  Changed ${checkhdid['newhub']}.`

                    // }



                    //BUSINESS CHANGE LOG

                    if (old.bid != data.bid) {
                        let checkhdid = ` select concat(' From ','${old.bname} ',' TO ',bname) bname from  business where id=${data.bid}   `;
                        [[checkhdid]] = await conn.query(checkhdid);
                        alog += `  Business Name  Changed ${checkhdid['bname']}.`
                    }


                    //DEPARTMENT CHANGE LOG


                    if (old.depid != data.depid) {
                        let checkhdid = `select concat(' From ','${old.depname} ',' TO ',depname) depname from  department where id=${data.depid}  `;
                        [[checkhdid]] = await conn.query(checkhdid);
                        alog += `  Department Name  Changed ${checkhdid['depname']}.`


                    }

                        // MODEL SERIAL NO CHANGE LOG

                    if (old.model_sid != data.model_sid) {
                        // console.log("''''''''''''''''''''------",old.model_sid ,"--------------------", data.model_sid);
                        let checkmodel = `select concat(' From ','${old.serial_num} ',' TO ',serial_num) serialno from  model_serial_num where model_sid=${data.model_sid}`;
                        [[checkmodel]] = await conn.query(checkmodel);
                        console.log("mosdel serial no", checkmodel);
                        alog += `Serial model No  Changed ${checkmodel['serialno']}.`
                    }



                    addhd1 += ' WHERE ownid =' + data.id;
                    console.log('ADD own_use Query: ', addhd1);
                    addhd1 = await conn.query(addhd1);




                }
                if (checkcont[0].length == 1 || data.sstatus == 1) {
                    let addhd1 = `UPDATE  stock_mgmt.model_serial_num SET msnstatus = 1 where model_sid=${data.model_sid} `;
                    console.log('ADD own_use Query: ', addhd1);
                    addhd1 = await conn.query(addhd1);
                }

                else {
                    erroraray.push({ msg: " Own_use Deatil  Already Exists.", err_code: 358 });
                    await conn.rollback();
                }
                // }


                let sqllog = "INSERT INTO stock_mgmt.own_use_log SET remarks='" + alog + "DONE BY',ownuseid =" + data.id + ", cby= " + jwtdata.id + ", oustatus= " + data.sstatus
                sqllog = await conn.query(sqllog);
                if (sqllog[0]['affectedRows'] > 0) {
                    erroraray.push({ msg: "own_use Deatil Updated Succesfully", err_code: 0 });
                    await conn.commit();
                }
                else {
                    erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                    await conn.rollback();
                }

            }  //try

            catch (e) {
                console.log('Error ', e);
                console.log(e)
                erroraray.push({ msg: 'Please try after sometimes err', err_code: 'ERR' })
                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } //conn 

        else {
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
    }else{
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