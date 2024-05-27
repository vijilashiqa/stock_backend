
//*******************model_serial_no NUM***************//



"use strict";
var express = require('express'),
    compress = require('compression'),
    model_serial_no = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/model_serialno');



async function addmodel_serial_no(req) {
    console.log('Edit User Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var errorArray = [], data = req.body, jwtData = req.jwt_data;
        let conn;

        conn = await poolPromise.getConnection();
        if (!conn) {
            errorArray.push({ msg: 'Unable to establish a database connection.', err_code: 500 });
            return resolve(errorArray);
        }

        console.log('Add file', data.serial_num.length);
        for (let i = 0; i < data.serial_num.length; i++) {
            await conn.beginTransaction();
            try {
                let msno = data.serial_num[i];

                let addmdsno = await conn.query(`
                        SELECT (SELECT itemqty FROM stock_mgmt.invoice_items WHERE iiid=${data.itemname})
                        - COUNT(model_sid) cnt FROM stock_mgmt.model_serial_num WHERE inv_itemid = ${data.itemname}
                    `);

                if (addmdsno[0][0].cnt >= 1) {
                    // Check if the combination of modelid and serial_num is unique
                    let uniqueCheck = await conn.query(`
                            SELECT *
                            FROM stock_mgmt.model_serial_num
                            WHERE modelid = (SELECT modelid FROM stock_mgmt.invoice_items WHERE iiid=${data.itemname})
                            AND serial_num = '${msno.serialno}'
                        `);

                    if (uniqueCheck[0].length > 0) {
                        errorArray.push({ msg: "Serial Number already exists for this Model ID.", err_code: 63 });
                        await conn.rollback();
                        if(msno.serialno==null||msno.serialno==''){
                            errorArray.push({ msg: "Serial Number is required.", err_code: 63 });
                            await conn.rollback();
                        }
                    } else {
                       
                        let addsno = `
                                INSERT INTO stock_mgmt.model_serial_num
                                SET bid=${data.bid},
                                    inv_itemid=${data.itemname},
                                    modelid=(SELECT modelid FROM stock_mgmt.invoice_items WHERE iiid=${data.itemname}),
                                    serial_num='${msno.serialno}'
                            `;
                         
                        console.log('ADD operator Query: ', addsno);
                        let addsnoResult = await conn.query(addsno);

                        if (addsnoResult[0].affectedRows > 0) {
                            let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='Added Serail_Num',`longtext`='DONE BY'";


                            let sqllogResult = await conn.query(sqllog);

                            if (sqllogResult[0].affectedRows > 0) {
                                errorArray.push({ msg: "Serial Number Added Successfully", err_code: 0 });
                                await conn.commit();
                            } else {
                                errorArray.push({ msg: "Contact Your Admin.", err_code: 199 });
                                await conn.rollback();
                            }
                        } else {
                            errorArray.push({ msg: "Serial Number Not Added.", err_code: 212 });
                            await conn.rollback();
                        }
                    }
                } else {
                    errorArray.push({ msg: " Quantity is Empty.", err_code: 212 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error: ', e);
                errorArray.push({ msg: 'Please try after some time.', err_code: 'ERR' });
                await conn.rollback();
            }
        }
        console.log('Success--1');
        console.log('Connection Closed.');
        conn.release();
        console.log('Success--2');
        return resolve(errorArray);

    });
}



model_serial_no.post('/listmodel_serial_no', function (req, res) {
    console.log(req.body)
    var sqlquery = `SELECT ms.model_sid,ms.bid,b.bname,ms.inv_itemid,i.itemname,ii.invno FROM stock_mgmt.model_serial_num ms
        LEFT JOIN stock_mgmt.invoice_items i ON ms.inv_itemid=i.iiid
         LEFT JOIN stock_mgmt.invoice ii ON i.invid= ii.id
         LEFT JOIN stock_mgmt.business b ON ms.bid=b.id GROUP BY inv_itemid `,
        data = req.body,
        sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.model_serial_num ms
        LEFT JOIN stock_mgmt.invoice_items i ON ms.inv_itemid=i.iiid
         LEFT JOIN stock_mgmt.invoice ii ON i.invid= ii.id
         LEFT JOIN stock_mgmt.business b ON ms.bid=b.id `;

    // if (data.stockinid) {
    //     sqlquery += ` where m.stockinid=${data.stockinid}`
    //     sqlqueryc += ` where m.stockinid=${data.stockinid}`
    // }

    // sqlquery += ' GROUP BY inv_itemid' ;
    //     //     sqlquery += where;
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('Error');
        } else {
            console.log(data)
            var sql = conn.query(sqlquery, function (err, result) {
                console.log(sql.sql)
                if (!err) {
                    var val = [];
                    val.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        console.log(sql.sql)
                        conn.release();
                        if (!err) {
                            val.push(result[0]);
                            res.send(JSON.stringify(val));
                        }
                    });
                } else {
                    conn.release();
                }
            });
        }
    });
});
// model_serial_no.post('/listserialnum', function (req, res, err) {
//     var where = [], jwtdata = req.jwt_data, sql, sqlquery = `SELECT ms.model_sid,ms.bid,b.bname,ms.inv_itemid,i.itemname,ii.invno,ms.serial_num FROM stock_mgmt.model_serial_num ms
//     INNER JOIN stock_mgmt.invoice_items i ON ms.inv_itemid=i.iiid
//      INNER JOIN stock_mgmt.invoice ii ON i.invid= ii.id
//      INNER JOIN stock_mgmt.business b ON ms.bid=b.id `,
//         sqlqueryc = ` SELECT COUNT(*) AS count FROM stock_mgmt.model_serial_num ms
//         INNER JOIN stock_mgmt.invoice_items i ON ms.inv_itemid=i.iiid
//          INNER JOIN stock_mgmt.invoice ii ON i.invid= ii.id
//          INNER JOIN stock_mgmt.business b ON ms.bid=b.id ` , 
//         data = req.body;

//         sqlquery +=` where ms.inv_itemid=${data.id}`;
//         sqlqueryc += ` where ms.inv_itemid=${data.id}`;

//     // sqlquery += ' LIMIT ?,? ';
//     console.log('testmodel',sqlquery);
//     console.log(sqlqueryc);
//     pool.getConnection(function (err, conn) {
//         if (err) {
//             console.log('Error');
//         } else {
//             console.log(data)
//             var sql = conn.query(sqlquery, function (err, result) {
//                 console.log(sql.sql)
//                 if (!err) {
//                     var val = [];
//                     val.push(result);
//                     sql = conn.query(sqlqueryc, function (err, result) {
//                         console.log(sql.sql)
//                         conn.release();
//                         if (!err) {
//                             val.push(result[0]);
//                             res.send(JSON.stringify(val));
//                         }
//                     });
//                 } else {
//                     conn.release();
//                 }
//             });
//         }
//     });
// });

model_serial_no.post('/selectmodel_serial_num', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sql, data = req.body
        , sqlquery = 'SELECT * FROM stock_mgmt.model_serial_num';
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

model_serial_no.post('/getmodel_serial_no', function (req, res) {
    var data = req.body, where = [], jwtdata = req.jwt_data,
        sql, sqlquery = `  SELECT ms.model_sid,ms.bid,b.bname,ms.inv_itemid,i.itemname,ii.invno,ii.id,ms.serial_num FROM stock_mgmt.model_serial_num ms
        INNER JOIN stock_mgmt.invoice_items i ON ms.inv_itemid=i.iiid
         INNER JOIN stock_mgmt.invoice ii ON i.invid= ii.id
         INNER JOIN stock_mgmt.business b ON ms.bid=b.id
         WHERE inv_itemid =${data.id}`;
    console.log('hii', sqlquery);
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
model_serial_no.post('/getserial_no', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sqlquery, sqlqueryc, sql, finalresult = [], data = req.body
    console.log('data', data)
    sqlquery = ` SELECT model_sid,serial_num FROM stock_mgmt.model_serial_num 
    WHERE inv_itemid=` + data.id;
    sqlqueryc = `SELECT COUNT(*)cnt FROM stock_mgmt.model_serial_num
    WHERE inv_itemid=` + data.id
    console.log(sqlquery);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                if (!err) {
                    finalresult.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            finalresult.push(result[0]);
                            // console.log('result', result[0]);
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


async function editmodel_serial_no(req) {
    console.log('Edit User Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var errorArray = [], data = req.body, jwtData = req.jwt_data;
        let conn;

        conn = await poolPromise.getConnection();
        if (!conn) {
            errorArray.push({ msg: 'Unable to establish a database connection.', err_code: 500 });
            return resolve(errorArray);
        }

        console.log('Add file', data.serial_num.length);
        for (let i = 0; i < data.serial_num.length; i++) {
            await conn.beginTransaction();
            try {
                let msno = data.serial_num[i];


                let uniqueCheck = await conn.query(`
                            SELECT *
                            FROM stock_mgmt.model_serial_num
                            WHERE serial_num = '${msno.serialno}' AND model_sid= ${msno.id}
                        `);

                if (uniqueCheck[0].length == 0) {


                    let addsno = `
                                 UPDATE stock_mgmt.model_serial_num
                                SET bid=${data.bid},
                                    inv_itemid=${data.itemname},
                                    serial_num='${msno.serialno}'
                            `;
                    addsno += ' WHERE model_sid =' + msno.id
                    console.log('ADD operator Query: ', addsno);
                    let addsnoResult = await conn.query(addsno);

                    if (addsnoResult[0].affectedRows > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='Added Serail_Num',`longtext`='DONE BY'";


                        let sqllogResult = await conn.query(sqllog);

                        if (sqllogResult[0].affectedRows > 0) {
                            errorArray.push({ msg: "Serial Number Added Successfully", err_code: 0 });
                            await conn.commit();
                        } else {
                            errorArray.push({ msg: "Contact Your Admin.", err_code: 199 });
                            await conn.rollback();
                        }
                    } else {
                        errorArray.push({ msg: "Serial Number Not Added.", err_code: 212 });
                        await conn.rollback();
                    }
                }

                else {
                    errorArray.push({ msg: "Serial Number Exsist.", err_code: 212 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error: ', e);
                errorArray.push({ msg: 'Please try after some time.', err_code: 'ERR' });
                await conn.rollback();
            }
        }
        console.log('Success--1');
        console.log('Connection Closed.');
        conn.release();
        console.log('Success--2');
        return resolve(errorArray);

    });
}

model_serial_no.post('/addmodel_serial_no', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.model_serial_noDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addmodel_serial_no(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});
model_serial_no.post('/editmodel_serial_no', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.editmodel_serial_noDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await editmodel_serial_no(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));

});

// model_serial_no.post('/selectqty', function (req, res) {
//     var where = [], jwtdata = req.jwt_data, sqlquery, sqlqueryc, sql, finalresult = [], data = req.body
//     console.log('data', data)
//     sqlquery = ` SELECT (SELECT itemqty FROM stock_mgmt.invoice_items WHERE iiid=${data.id})
//     - COUNT(model_sid) cnt FROM stock_mgmt.model_serial_num WHERE inv_itemid = ${data.id}`;
//     // sqlqueryc = `SELECT COUNT(*)cnt FROM stock_mgmt.model_serial_num
//     // WHERE inv_itemid=` + data.id
//     console.log('paaaa',sqlquery);
//     pool.getConnection(function (err, conn) {
//         if (!err) {
//             finalresult.push(result);
//             sql = conn.query(sqlquery, function (err, result) {
//                 conn.release();
//                 if (!err) {
//                     finalresult.push(result[0]);
//                     // console.log('result', result[0]);
//                     res.end(JSON.stringify(finalresult));

//                 }
//             });
//         } else {
//             conn.release();
//         }


//     });
// });
model_serial_no.post('/selectqty', function (req, res) {
    var where = [], jwtdata = req.jwt_data, sql, data = req.body
        , sqlquery =` SELECT (SELECT itemqty FROM stock_mgmt.invoice_items WHERE iiid=${data.id})
          - COUNT(model_sid) cnt FROM stock_mgmt.model_serial_num WHERE inv_itemid = ${data.id}`;
    
    // if (where.length > 0) {
    //     where = ' WHERE' + where.join(' AND ');
    //     sqlquery += where;
    // }
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
module.exports = model_serial_no;
