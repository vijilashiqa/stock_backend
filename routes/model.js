
//*******************model NUM***************//

"use strict";
var express = require('express'),
    compress = require('compression'),
    model = express.Router(),
    pool = require('../connection/conn'),
poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/model');

async function addmodel(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.model WHERE modelname ='" + data.modelname + "' and bid="+bid+"");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let status = data.status == true ? 1 : 0;
                    // data.addr = data.addr.replace("'", ' ');
                    let addhd = `INSERT INTO stock_mgmt.model SET 
                                                                   makeid=${data.makeid},
                                                                   bid=${bid},
                                                                   deviceid=${data.deviceid},
                                                                   modelname ='${data.modelname}',
                                                                   cby=${jwtdata.id}
                                                                 `;
                    console.log('ADD model Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD Model',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Model Deatil Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " model Deatil ID Already Exists.", err_code: 56 });
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
model.post('/listmodel', function (req, res, err) {
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT b.bname,m.modelname,mk.makename,d.devicename,m.modelid FROM `stock_mgmt`.model m'
    +' inner join stock_mgmt.business b on m.bid=b.id '
     +' left join  stock_mgmt.make mk on m.makeid=mk.makeid '
     +  ' left join stock_mgmt.device d on m.deviceid=d.deviceid  ',
        sqlqueryc = ' SELECT COUNT(*) AS count FROM `stock_mgmt`.model m '
        +' inner join stock_mgmt.business b on m.bid=b.id'
        +' left join  stock_mgmt.make mk on m.makeid=mk.makeid '
      + ' left join stock_mgmt.device d on m.deviceid=d.deviceid' , finalresult = [],
        data = req.body,jwtdata =req.jwt_data;

        if (data.modelid != '' && data.modelid != null) where.push(` m.modelid = ${data.modelid} `);
        let bid = jwtdata.urole == 999  ? data.busid : jwtdata.bid;
        if (jwtdata.urole > 888 && data.busid != '' && data.busid != null) where.push(`  m.bid = ${bid} `);
        if (jwtdata.urole <= 888) where.push(` m.bid= ${bid} `);
        if (where.length > 0) {
            where = ' WHERE' + where.join(' AND ');
            sqlquery += where;
            sqlqueryc += where;
        }

          sqlquery += ' LIMIT ?,?'
    
    console.log('testmodel',sqlquery);
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

model.post('/selectmodel', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sql, data = req.body
        , sqlquery = 'SELECT * FROM stock_mgmt.model';
        console.log("data",data);
        if (data.bid != '' && data.bid != null) where.push(` bid = ${data.bid} `);
        if (where.length > 0) {
            where = ' WHERE' + where.join(' AND ');
            sqlquery += where;
        }

        if (data.hasOwnProperty('like') && data.like) {
            sqlquery += ' AND modelname LIKE "%' + data.like + '%" '
        }
    console.log('data', data)
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

model.post('/getmodel', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = `SELECT * FROM stock_mgmt.model WHERE modelid =${data.modelid}`;
    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hdid= ${jwtdata.hdid} `);
    if (where.length > 0) {
        where = where.join(' AND ');
        sqlquery += where;
    }
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


async function editmodel(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT *  FROM stock_mgmt.`model` WHERE modelname ='"+data.modelname+"' and  modelid!=" + data.modelid + "");
                if (checkprofile[0].length == 0) {
                    let chs = checkprofile[0][0];
                    let status = data.status == true ? 1 : 0;
                    let addhd = `UPDATE  stock_mgmt.model SET 
                    makeid=${data.makeid},
                    bid=${bid},
                    deviceid=${data.deviceid},
                     modelname='${data.modelname}',
                     mby=${jwtdata.id}`;      
                    addhd += ' WHERE modelid =' + data.modelid
                    console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT Model',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " model Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "model Already exists.", err_code: 243 });
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

model.post('/addmodel', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.modeldataschema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addmodel(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
model.post('/editmodel', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editmodeldataschema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editmodel(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});



module.exports = model;
