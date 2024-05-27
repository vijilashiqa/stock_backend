"use strict";
var express = require('express'),
    compress = require('compression'),
    location = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/location');

//state//
async function addstate(req) {
    // console.log('Add State', req.body);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('state', data);
                let checksate = await conn.query(`SELECT COUNT(*)cnt FROM stock_mgmt.state WHERE state_name='${data.state_name}' `);
                if (checksate[0][0]['cnt'] == 0) {
                    let addstate = `INSERT INTO stock_mgmt.state SET
                    state_name='${data.state_name}'                  
                    `;
                    addstate = await conn.query(addstate)
                    if (addstate[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD STATE',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " State has Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    }
                    else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 38 });
                        await conn.rollback();
                    }
                }
                else {

                    erroraray.push({ msg: "State Name Already Available.", err_code: 43 });
                    await conn.rollback();
                }
            }
            catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes Error', err_code: 'ERR' })

                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        }
        else {
            erroraray.push({ msg: 'Please try after sometimes', err_code: 56 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}
location.post('/addstate', async (req, res) => {
    req.setTimeout(864000000);
      const validation = joiValidate.stateDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addstate(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


location.post('/liststate', function (req, res, err) {
    var sql, sqlquery = 'SELECT state_pk,state_name FROM `stock_mgmt`.state LIMIT ?,? ',
        sqlqueryc = 'SELECT COUNT(`state_pk`) AS `count` FROM stock_mgmt.`state`', finalresult = [],
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
                        }
                    });
                } else {
                    conn.release();
                }
            });
        }
    });
});


location.post('/getstateedit', function (req, res) {
    var data = req.body,
        sql, sqlquery = `SELECT state_pk,state_name  FROM stock_mgmt.state where  state_pk=${data.state_pk}`;
    console.log('data', data);
    console.log('-----------', sqlquery);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                // console.log(id,"++++++++++");
                console.log('get pincode', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result[0]));
                    console.log(result[0], "--------");
                }
            });
        }
    });
});

location.post('/getstate', function (req, res, err) {
    pool.getConnection(function (err, conn) {
        let data = req.body, sqlquery = 'SELECT state_pk ,state_name  FROM stock_mgmt.state'
        if (data.hasOwnProperty('like') && data.like) {
            sqlquery += 'WHERE state_name LIKE "%' + data.like + '%" '
        }
        console.log('state',sqlquery);
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
async function editstate(req) {
    console.log('Add State Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = "";
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {

                console.log('Data', data);
                let checkprofile = await conn.query("SELECT * FROM stock_mgmt.state WHERE state_name='" + data.state_name + "' and state_pk!=" + data.state_pk + " ");
                console.log(checkprofile[0].length);
                if (checkprofile[0].length == 0) {
                    let status = data.status == true ? 1 : 0;
                    let editstate = `UPDATE  stock_mgmt.state SET state_name='${data.state_name}'`;

                    editstate += ' WHERE state_pk =' + data.state_pk
                    console.log('Edit Broadcast Query: ', editstate);
                    editstate = await conn.query(editstate);
                    if (editstate[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE STATE',`longtext`=' " + alog + " DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " State Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "State Not Updated.", err_code: 244 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " State Already Exists.", err_code: 248 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes err', err_code: '253' })
                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ msg: 'Contact Your Admin.', err_code: 260 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}

location.post('/editstate', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editsateDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editstate(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
//Dist???//////////////////////////////////////
async function adddist(req) {
    console.log('Add State', req.body);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('state', data);
                let checksate = await conn.query(`SELECT COUNT(*)cnt FROM stock_mgmt.district WHERE district_name='${data.district_name}' `);

                if (checksate[0][0]['cnt'] == 0) {
                    let adddist = `INSERT INTO stock_mgmt.district SET
                    district_name='${data.district_name}',
                    state_fk=${data.state_fk}                  
                    `;
                    adddist = await conn.query(adddist)
                    if (adddist[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD DISTRICT',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " District has Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    }
                    else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 38 });
                        await conn.rollback();
                    }

                }
                else {

                    erroraray.push({ msg: "District Name Already Exists.", err_code: 43 });
                    await conn.rollback();
                }
            }
            catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes Error', err_code: 'ERR' })

                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        }
        else {
            erroraray.push({ msg: 'Please try after sometimes', err_code: 56 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}
location.post('/adddist', async (req, res) => {
    req.setTimeout(864000000);
       const validation = joiValidate.distDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await adddist(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});



location.post('/listdistrict', function (req, res, err) {
    var sql, sqlquery = 'SELECT s.state_name,d.district_pk,d.district_name FROM `stock_mgmt`.district d left join stock_mgmt.state s on d.state_fk=s.state_pk LIMIT ?,? ',
        sqlqueryc = 'SELECT COUNT(`district_pk`) AS `count` FROM stock_mgmt.`district` d left join stock_mgmt.state s on d.state_fk=s.state_pk', finalresult = [],
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
                        }
                    });
                } else {
                    conn.release();
                }
            });
        }
    });
});


location.post('/getdistrictedit', function (req, res) {
    var data = req.body,
        sql, sqlquery = `SELECT  s.state_name,s.state_pk,d.district_pk,d.district_name FROM stock_mgmt.district
        d left join stock_mgmt.state s on d.state_fk=s.state_pk where  d.district_pk=${data.district_pk}`;
    console.log('data', data);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                // console.log(id,"++++++++++");
                console.log('get pincode', sql.sql);
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result[0]));
                    console.log(result[0], "--------");
                }
            });
        }
    });
});

location.post('/getdistrict', function (req, res, err) {
    pool.getConnection(function (err, conn) {
        var where = [], data = req.body, sqlquery = `SELECT district_pk,district_name,state_fk FROM stock_mgmt.district 
        `
        if (data.hasOwnProperty('state_fk') && data.state_fk) {
            where.push(' state_fk =' + data.state_fk)
        }
        if (data.hasOwnProperty('like') && data.like) {
            sqlquery += ' district_name LIKE "%' + data.like + '%" '
        }
        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ');
            sqlquery += where;
        }
        console.log(']]]]]]]',sqlquery)
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
async function editdistrict(req) {
    console.log('Add State Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, alog = "";
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query(`SELECT * FROM stock_mgmt.district WHERE district_name='${data.district_name}' and district_pk!=${data.district_pk}`);
                console.log(checkprofile[0].length);
                if (checkprofile[0].length == 0) {
                    let editdistrict = `UPDATE  stock_mgmt.district SET district_name='${data.district_name}',
                    state_fk=${data.state_fk}`;

                    editdistrict += ' WHERE district_pk =' + data.district_pk
                    console.log('Edit Broadcast Query: ', editdistrict);
                    editdistrict = await conn.query(editdistrict);
                    if (editdistrict[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE district',`longtext`=' " + alog + " DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " district Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "district Not Updated.", err_code: 244 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " District Already Exists.", err_code: 248 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes err', err_code: '253' })
                await conn.rollback();
            }
            console.log('Success--1');
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ msg: 'Contact Your Admin.', err_code: 260 })
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}

location.post('/editdistrict', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editdistDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editdistrict(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

module.exports = location;
