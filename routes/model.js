
//*******************model NUM***************//



"use strict";
var express = require('express'),
    compress = require('compression'),
    model = express.Router(),
    pool = require('../connection/conn'),
poolPromise = require('../connection/conn').poolp;
// const joiValidate = require('../schema/hsn');




async function addmodel(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.model WHERE modelname ='" + data.modelname + "' and bid="+data.bid+"");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let status = data.status == true ? 1 : 0;
                    // data.addr = data.addr.replace("'", ' ');
                    let addhd = `INSERT INTO stock_mgmt.model SET 
                                                                   makeid=${data.makeid},
                                                                   bid=${data.bid},
                                                                   deviceid=${data.deviceid},
                                                                   modelname ='${data.modelname}'
                                                                 `;
                    console.log('ADD model Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id=' model detail',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " model Deatil Created Succesfully", err_code: 0 });
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
        data = req.body;

    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` model.hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` model.hdid= ${jwtdata.hdid} `);

    // if (where.length > 0) {
    //     where = ' WHERE' + where.join(' AND ');
    //     sqlquery += where;
    //     sqlqueryc += where;
    // }
    sqlquery += ' LIMIT ?,? ';
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
    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hdid= ${jwtdata.hdid} `);


    // if (data.hasOwnProperty('model_id-') && data.model_id) {
    //     sqlquery += ` AND model_id =${data.model_id}`;
    // }
    // if (data.hasOwnProperty('model_name') && data.model_name) {
    //     sqlquery += ` AND model_name =${data.model_name}`;
    // }
    // if (data.hasOwnProperty('model_num') && data.model_num) {
    //     sqlquery += ` AND model_num =${data.model_num}`;
    // }
    if (where.length > 0) {
        where = ' WHERE' + where.join(' AND ');
        sqlquery += where;
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
                    bid=${data.bid},
                    deviceid=${data.deviceid},
                     modelname='${data.modelname}'`;
                    
                    
                   
                    addhd += ' WHERE modelid =' + data.modelid
                    console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO  stock_mgmt.activitylog SET table_id='UPDATE model Deatil',`longtext`=' " + alog + " DONE BY'";
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
    // const validation = joiValidate.modelDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await addmodel(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
model.post('/editmodel', async (req, res) => {
    req.setTimeout(864000000);
    // const validation = joiValidate.editmodelDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await editmodel(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});



module.exports = model;
