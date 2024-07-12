
//*******************department NUM***************//
"use strict";
var express = require('express'),
    compress = require('compression'),
    department = express.Router(),
    pool = require('../connection/conn'),
poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/department');

async function adddepartment(req) {
    console.log('Add department  Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.department WHERE depname ='" + data.depname + "' and busid ="+data.busid+"");
                if (checkprofile[0][0]['cnt'] == 0) {
                    let adddep = `INSERT INTO stock_mgmt.department SET depname ='${data.depname}' ,busid =${data.busid}`;
                    console.log('ADD Department Query: ', adddep);
                    adddep = await conn.query(adddep);
                    if (adddep[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD Department',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Department Deatil Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " Department Deatil ID Already Exists.", err_code: 56 });
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


department.post('/listdepartment', function (req, res, err) {
    var  sql, sqlquery = '  SELECT d.id,d.depname,d.busid,b.bname FROM stock_mgmt.department d LEFT JOIN stock_mgmt.business b ON b.id =d.busid   LIMIT ?,? ',
        sqlqueryc = ' SELECT COUNT(*) AS count FROM stock_mgmt.department d LEFT JOIN stock_mgmt.business b ON b.id =d.busid ', finalresult = [],
        data = req.body;
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

department.post('/selectdepartment', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sql, data = req.body
        , sqlquery = 'SELECT id,depname FROM stock_mgmt.department';
    if (data.busid != '' && data.busid != null) where.push(` busid = ${data.busid} `);
    if (where.length > 0) {
        where = ' WHERE' + where.join(' AND ');
        sqlquery += where;
    }
    if (data.hasOwnProperty('like') && data.like) {
        sqlquery += ' AND depname LIKE "%' + data.like + '%" '
    }
    console.log("depart like cmt",sqlquery);
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

department.post('/getdepartment', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = `SELECT * FROM stock_mgmt.department WHERE id =${data.id}`;
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


async function editdepartment(req) {
    console.log('Add Broadcaster Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = '';
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT *  FROM stock_mgmt.department WHERE depname ='"+data.depname+"' and  busid=" + data.busid + "");
               console.log("---------department edit------------", checkprofile[0].length  , "===========", checkprofile.sql)
                if (checkprofile[0].length == 0) {
                    let chs = checkprofile[0][0];
                    let status = data.status == true ? 1 : 0;
                    let adddep = `UPDATE  stock_mgmt.department SET  depname='${data.depname}' ,busid =${data.busid}`;
                    adddep += ' WHERE id =' + data.id
                    console.log('Edit Broadcast Query: ', adddep);
                    adddep = await conn.query(adddep);
                    if (adddep[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT Depatrment',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Department Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 239 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "department Already exists.", err_code: 243 });
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

department.post('/adddepartment', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.departmentDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await adddepartment(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
department.post('/editdepartment', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editdepartmentDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editdepartment(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});



module.exports = department;
