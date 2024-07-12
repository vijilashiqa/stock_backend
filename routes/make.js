
//*******************make NUM***************//



"use strict";
var express = require('express'),
    compress = require('compression'),
    make = express.Router(),
    pool = require('../connection/conn'),
poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/make');




async function addmake(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        // console.log("request daat",data);
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.make WHERE makename ='" + data.makename + "' and bid="+data.bid+"");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let status = data.status == true ? 1 : 0;
                    // data.addr = data.addr.replace("'", ' ');
                    let addhd = `INSERT INTO stock_mgmt.make SET 
                                                                   bid=${data.bid},
                                                                   makename ='${data.makename}',
                                                                   cby=${jwtdata.id}
                                                                 `;
                    // console.log('ADD Hsn Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD MAKE',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Make Deatil Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " Make Deatil ID Already Exists.", err_code: 56 });
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
make.post('/listmake', function (req, res, err) {
    var where = [], jwtdata = req.jwt_data, sql, sqlquery = 'SELECT m.makeid,m.makename,b.bname FROM `stock_mgmt`.make m ' 
    +'inner join business b on m.bid=b.id '
     +'LIMIT ?,? ',
        sqlqueryc = ' SELECT COUNT(*) AS count FROM `stock_mgmt`. make m  '
        +'inner join business b on m.bid=b.id ', finalresult = [],
        data = req.body;

    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` make.hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` make.hdid= ${jwtdata.hdid} `);

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

make.post('/selectmake', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sql, data = req.body
        , sqlquery = 'SELECT * FROM stock_mgmt.make ';
    // if (jwtdata.role > 777 && data.hdid != '' && data.hdid != null) where.push(` hdid= ${data.hdid} `);
    // if (jwtdata.role <= 777) where.push(` hdid= ${jwtdata.hdid} `);


    if (data.bid != '' && data.bid != null) where.push(` bid = ${data.bid} `);
    if (where.length > 0) {
        where = ' WHERE' + where.join(' AND ');
        sqlquery += where;
    }


    if (data.hasOwnProperty('like') && data.like) {
        sqlquery += ' AND makename LIKE "%' + data.like + '%" '
    }


    

    // if (data.hasOwnProperty('make_id-') && data.make_id) {
    //     sqlquery += ` AND make_id =${data.make_id}`;
    // }
    // if (data.hasOwnProperty('make_name') && data.make_name) {
    //     sqlquery += ` AND make_name =${data.make_name}`;
    // }
    
    
    // if (where.length > 0) {
    //     where = ' WHERE' + where.join(' AND ');
    //     sqlquery += where;
    // }
    console.log('data ###########', sqlquery)
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

make.post('/getmake', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = `SELECT * FROM stock_mgmt.make WHERE makeid =${data.makeid}`;
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


async function editmake(req) {
    // console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';

        
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT *  FROM stock_mgmt.`make` WHERE makename ='"+data.makename+"' and  makeid!=" + data.makeid + "");
                if (checkprofile[0].length == 0) {
                    let chs = checkprofile[0][0];
                    let status = data.status == true ? 1 : 0;
                    let addhd = `UPDATE  stock_mgmt.make SET bid=${data.bid}, makename='${data.makename}', mby=${jwtdata.id}`;
                    addhd += ' WHERE makeid =' + data.makeid
                    // console.log('Edit Broadcast Query: ', addhd);
                    addhd = await conn.query(addhd);
                    if (addhd[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT make',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Make Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "Make Already exists.", err_code: 243 });
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

make.post('/addmake', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.makeDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addmake(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
make.post('/editmake', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editmakeDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editmake(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});



module.exports = make;
