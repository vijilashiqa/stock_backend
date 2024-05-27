"use strict";
var express = require('express'),
    compress = require('compression'),
    invoice = express.Router(),
    pool = require('../connection/conn'),
    poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/invoice');


// async function taxcal(taxtype, amt, taxper) {
//     return new Promise(async (resolve, reject) => {
//         if (taxtype == 0) {

//         } else {

//         }
//     });
// }

async function checkgst(bagstno, gst_no, cgst, sgst, igst) {
    return new Promise(async (resolve, reject) => {
        if ((bagstno) == (gst_no)) {
            if (cgst == null || cgst === '' || sgst == null || sgst === '') {
                return resolve({ "msg": " State GST Not Added.", "err_code": 24 });
            }
            else {
                return resolve({ "msg": "No Error.", "err_code": 0 });
            }

        } else {
            if (igst == null || igst === '') {
                return resolve({ "msg": " Indian GST Not Added.", "err_code": 35 });
            }
            else {
                return resolve({ "msg": "No Error.", "err_code": 0 });
            }
        }
    });
}
async function addinvoice(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);
                let checkprofile = await conn.query("SELECT COUNT(*) cnt FROM stock_mgmt.invoice WHERE busid =" + data.busid + " and invno='" + data.invno + "'");
                // console.log('detild data', checkprofile);

                if (checkprofile[0][0]['cnt'] == 0) {
                    let checkadd = await conn.query(`SELECT b.bname,b.pan,b.tinno, ba.baaddrname,ba.bagstno,b.id FROM stock_mgmt.business b 
                    LEFT JOIN  stock_mgmt.business_address ba  ON b.id=ba.bid  WHERE b.id=${data.busid} AND ba.id=${data.busaddr}`);
                    let checkven = await conn.query(` SELECT  id,addrname,gst_no,vid FROM stock_mgmt.vendor_address   WHERE id=${data.vaddr} AND vid=${data.vendorid} `);
                    // let status = data.status == true ? 1 : 0;
                    // data.addr = data.addr.replace("'", ' ');

                    let addinv = `INSERT INTO stock_mgmt.invoice SET                                                                 
                        invno='${data.invno}',
                        busid=${data.busid},
                        busname='${checkadd[0][0].bname}',
                        busaddrid=${data.busaddr},
                        busaddr='${checkadd[0][0].baaddrname}',
                        busgstno='${checkadd[0][0].bagstno}',
                        buspanno='${checkadd[0][0].pan}',
                        invdate='${data.invdate}',
                        vid=${data.vendorid},
                        vaddrid=${data.vaddr},
                        vaddr='${checkven[0][0].addrname}',
                        vgstno='${checkven[0][0].gst_no}',
                        gsttype=${data.gsttype}
                        `
                    console.log((checkadd[0][0].bagstno).slice(0, 2), (checkven[0][0].gst_no).slice(0, 2));
                    if (data.gsttype == 1) {
                        let res = await checkgst((checkadd[0][0].bagstno).slice(0, 2), (checkven[0][0].gst_no).slice(0, 2), data.cgst, data.sgst, data.igst);
                        console.log('res :', res);
                        if (res['err_code'] == 0) {
                            if (data.cgst != null && data.cgst != '' || data.sgst != null && data.sgst != '') addinv += `,cgst='${data.cgst}',sgst='${data.sgst}' `;
                            if (data.igst != null && data.igst != '') addinv += `,igst=${data.igst} `;
                        }

                    }

                    console.log('ADD invoice Query: ', addinv);
                    addinv = await conn.query(addinv);

                    if (addinv[0]['affectedRows'] > 0) {
                        if (checkprofile[0][0]['cnt'] == 0) {
                            let invoiceid = addinv[0].insertId;

                            for (let i = 0; i < data.invoiceid.length; i++) {
                                let inv = data.invoiceid[i];

                                let itemnameResult = await conn.query(`SELECT CONCAT(mk.makename,' ',d.devicename,' ',m.modelname) as itemname FROM model m 
                                INNER JOIN device d ON m.deviceid=d.deviceid 
                                INNER JOIN make mk ON mk.makeid=m.makeid WHERE m.modelid=${inv.modelid}`);
                            let itemname = itemnameResult[0][0]['itemname'];
                                let addinvitem = ` Insert into stock_mgmt.invoice_items set 
                                        busid=${data.busid},
                                        invid=${invoiceid},
                                        itemname='${itemname.toString().replace(/\[/g, '').replace(/\]/g, '')}', 
                                        modelid=${inv.modelid},               
                                        itemgst=${inv.itemgst},
                                        itemamt=${inv.itemamt}
                                        
                                       `;
                                if (inv.itemqty != null || inv.itemqty != '') addinvitem += `,itemqty=${inv.itemqty}`;
                                if (data.gsttype == 0) {
                                    let res = await checkgst((checkadd[0][0].bagstno).slice(0, 2), (checkven[0][0].gst_no).slice(0, 2), inv.cgst, inv.sgst, inv.igst)
                                    console.log('res :', res);
                                    if (res['err_code'] == 0) {
                                        if (inv.cgst != null && inv.cgst != '' || inv.sgst != null && inv.sgst != '') addinvitem += `,cgst='${inv.cgst}',sgst='${inv.sgst}' `;
                                        if (inv.igst != null && inv.igst != '') addinvitem += `,igst=${inv.igst} `;
                                    }

                                }

                                addinvitem = await conn.query(addinvitem);

                                if (addinvitem[0]['affectedRows'] > 0) {
                                    erroraray.push({ msg: " Invoice Item  Created Succesfully", err_code: 0 });
                                    await conn.commit();
                                    continue;
                                }
                                else {
                                    erroraray.push({ msg: "Invoice Item Not Added.", err_code: 52 });
                                    await conn.rollback();
                                }

                            }

                        }

                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADDED INVOICE DETAIL',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Invoice Deatil Created Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: " invoice Deatil ID Already Exists.", err_code: 56 });
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

invoice.post('/addinvoice', async (req, res) => {
    req.setTimeout(864000000);
    const validation = joiValidate.invoicedetDataSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
        return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    }
    let result = await addinvoice(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

invoice.post('/listinvoice', function (req, res, err) {
    var sql, sqlquery = `SELECT* FROM stock_mgmt.invoice
	   `,
        sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.invoice
		`, finalresult = [],
        data = req.body;
    if (data.limit && data.index) {
        sqlquery += ' LIMIT ?,?'
    }
    console.log('-------------------', sqlquery);
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

invoice.post('/getinvoice', function (req, res) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        } else {
            var sql = conn.query(`select * from stock_mgmt.invoice  `, function (err, result) {
                conn.release();
                if (!err) {
                    res.end(JSON.stringify(result));
                }
            });
        }
    });
});
invoice.post('/getinvoice_item_edit', function (req, res, err) {
    var jwtdata = req.jwt_data, where = [], sql;
       var  sqlquery = `SELECT  i.iiid,i.busid, i.invid, i.itemqty, i.itemgst, i.itemamt, i.igst, i.sgst, i.cgst, i.itemstatus,i.modelid,m.modelname,
       mk.makeid,mk.makename,d.deviceid,d.devicename,
       GROUP_CONCAT(mk.makename,' ',d.devicename,' ',m.modelname)itemname

   FROM 
       stock_mgmt.invoice_items i
   INNER JOIN 
       stock_mgmt.model m ON i.modelid = m.modelid
   INNER JOIN 
       stock_mgmt.make mk ON FIND_IN_SET(mk.makeid, m.makeid)
   INNER JOIN 
       stock_mgmt.device d ON FIND_IN_SET(d.deviceid, m.deviceid)`, finalresult = [];
       var  sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.invoice_items i
       INNER JOIN 
       stock_mgmt.model m ON i.modelid = m.modelid
   INNER JOIN 
       stock_mgmt.make mk ON FIND_IN_SET(mk.makeid, m.makeid)
   INNER JOIN 
       stock_mgmt.device d ON FIND_IN_SET(d.deviceid, m.deviceid) `,
        data = req.body;
    if (data.id != '' && data.id != null) where.push(` invid= ${data.id} `);
    // if (data.id != '' && data.id != null) where.push(` iiid= ${data.id} `);
    where.push(`itemstatus=1`);
    if (where.length > 0) {
        where = ' WHERE  ' + where.join(' AND ');
        sqlquery += where;
        sqlqueryc += where

    }
    sqlquery += ' GROUP BY  i.busid, i.invid, i.itemqty, i.itemgst, i.itemamt, i.igst, i.sgst, i.cgst, i.itemstatus';
    // sqlqueryc += ' GROUP BY  i.busid, i.invid, i.itemqty, i.itemgst, i.itemamt, i.igst, i.sgst, i.cgst, i.itemstatus';
    
    if (data.index != null) console.log('-----');
    if (data.index != null && data.limit != null) sqlquery += ' LIMIT ' + data.index + ',' + data.limit;
    // console.log('getlist...', sqlquery);
    console.log('list adress ...', sqlquery);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                if (!err) {
                    finalresult.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            finalresult.push(result[0]);
                            console.log('result', result[0]);
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
invoice.post('/getinvoice_edit', function (req, res, err) {
    var jwtdata = req.jwt_data, where = [], sql,
        sqlquery = `SELECT v.vmobile,vname,b.bphoneno,i.*  FROM stock_mgmt.invoice i 
        left join stock_mgmt.vendor v on i.vid=v.id
        left join stock_mgmt.business b on i.busid=b.id`, finalresult = [],
        sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.invoice i
        left join stock_mgmt.vendor v on i.vid=v.id
        left join stock_mgmt.business b on i.busid=b.id`,
        data = req.body;
    if (data.id != '' && data.id != null) where.push(` i.id= ${data.id} `);
    if (where.length > 0) {
        where = ' WHERE ' + where.join(' AND ');
        sqlquery += where;
        sqlqueryc += where

    }
    if (data.index != null) console.log('-----');
    if (data.index != null && data.limit != null) sqlquery += ' LIMIT ' + data.index + ',' + data.limit;
    // console.log('getlist...', sqlquery);
    console.log('list adress ...', sqlquery);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                if (!err) {
                    finalresult.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            finalresult.push(result[0]);
                            console.log('result', result[0]);
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
invoice.post('/getmodel_edit', function (req, res, err) {
    var jwtdata = req.jwt_data, where = [], sql,
        sqlquery = `SELECT mk.makename,d.devicename,m.* FROM stock_mgmt.model m 
        INNER JOIN stock_mgmt.make mk ON m.makeid=mk.makeid
        INNER JOIN stock_mgmt.device d ON m.deviceid=d.deviceid`, finalresult = [],
        sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.model m 
        INNER JOIN stock_mgmt.make mk ON m.makeid=mk.makeid
        INNER JOIN stock_mgmt.device d ON m.deviceid=d.deviceid`,
        data = req.body;
    if (data.makeid != '' && data.makeid != null) where.push(` m.makeid= ${data.makeid} `);
    if (data.deviceid != '' && data.deviceid != null) where.push(` m.deviceid= ${data.deviceid} `);
    if (where.length > 0) {
        where = ' WHERE ' + where.join(' AND ');
        sqlquery += where;
        sqlqueryc += where

    }
    if (data.index != null) console.log('-----');
    if (data.index != null && data.limit != null) sqlquery += ' LIMIT ' + data.index + ',' + data.limit;
    // console.log('getlist...', sqlquery);
    console.log('list adress ...', sqlquery);
    pool.getConnection(function (err, conn) {
        if (!err) {
            sql = conn.query(sqlquery, function (err, result) {
                if (!err) {
                    finalresult.push(result);
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            finalresult.push(result);
                            console.log('result', result);
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

async function editinvoice(req) {
    console.log('Add vendordetail Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                const checkProfileQuery = "SELECT COUNT(*) cnt FROM stock_mgmt.invoice WHERE busid = ? and invno = ? and id != ?";
                const checkProfileResult = await conn.query(checkProfileQuery, [data.busid, data.invno, data.id]);

                if (checkProfileResult[0][0]['cnt'] === 0) {
                    // Fetch additional details for the invoice
                    const checkAddQuery = `SELECT b.bname, b.pan, b.tinno, ba.baaddrname, ba.bagstno, b.id
                                               FROM stock_mgmt.business b
                                               LEFT JOIN stock_mgmt.business_address ba ON b.id = ba.bid
                                               WHERE b.id = ? AND ba.id = ?`;
                    const checkAddResult = await conn.query(checkAddQuery, [data.busid, data.busaddr]);

                    const checkVenQuery = `SELECT id, addrname, gst_no, vid
                                               FROM stock_mgmt.vendor_address
                                               WHERE id = ? AND vid = ?`;
                    const checkVenResult = await conn.query(checkVenQuery, [data.vaddr, data.vendorid]);
                  
                    // Update invoice details
                    let updateInvoiceQuery = `UPDATE stock_mgmt.invoice SET
                                                  invno = ?, busid = ?, busname = ?, busaddrid = ?, busaddr = ?,
                                                  busgstno = ?, buspanno = ?, invdate = ?, vid = ?, vaddrid = ?,
                                                  vaddr = ?, vgstno = ?, gsttype = ? `;
                   
                    console.log((checkAddResult[0][0].bagstno).slice(0, 2), (checkVenResult[0][0].gst_no).slice(0, 2));
                    if (data.gsttype == 1) {
                        let res = await checkgst((checkAddResult[0][0].bagstno).slice(0, 2), (checkVenResult[0][0].gst_no).slice(0, 2), data.cgst, data.sgst, data.igst);
                        console.log('res :', res);
                        if (res['err_code'] == 0) {
                            if (data.cgst != null && data.cgst != '' || data.sgst != null && data.sgst != '') updateInvoiceQuery += `,cgst=${data.cgst},sgst=${data.sgst} `;
                            if (data.igst != null && data.igst != '') updateInvoiceQuery += `,igst=${data.igst} `;
                        }
                    }
                    updateInvoiceQuery += ' WHERE id =' + data.id;
                    // Execute the update query
                    const updateInvoiceResult = await conn.query(updateInvoiceQuery, [data.invno, data.busid, checkAddResult[0][0].bname, data.busaddr, checkAddResult[0][0].baaddrname, checkAddResult[0][0].bagstno, checkAddResult[0][0].pan, data.invdate, data.vendorid, data.vaddr, checkVenResult[0][0].addrname, checkVenResult[0][0].gst_no, data.gsttype]);


                    if (updateInvoiceResult[0]['affectedRows'] > 0) {


                        for (let i = 0; i < data.invoiceid.length; i++) {
                            const inv = data.invoiceid[i];
                            let itemnameResult = await conn.query(`SELECT CONCAT(mk.makename,' ',d.devicename,' ',m.modelname) as itemname FROM model m 
                            INNER JOIN device d ON m.deviceid=d.deviceid 
                            INNER JOIN make mk ON mk.makeid=m.makeid WHERE m.modelid=${inv.modelid}`);
                        let itemname = itemnameResult[0][0]['itemname'];
                            let ivid= data.id;
                          
                            if (inv.id != null && inv.id != '') {
                                // Update existing invoice item
                                let updateInvoiceItemQuery = `UPDATE stock_mgmt.invoice_items SET
                                                                  busid = ?,invid=?,modelid =?,itemname =?,  itemgst = ?, itemamt = ?, itemstatus = ? `;
                             
                                if (inv.itemqty != null || inv.itemqty != '') updateInvoiceItemQuery += `,itemqty=${inv.itemqty}`;
                               
                                if(itemname[0][0]==0){
                                    
                                }
                                
                                if (data.gsttype == 0) {
                                    let res = await checkgst((checkAddResult[0][0].bagstno).slice(0, 2), (checkVenResult[0][0].gst_no).slice(0, 2), inv.cgst, inv.sgst, inv.igst);
                                    console.log('res :', res);
                                    if (res['err_code'] == 0) {
                                        if (inv.cgst != null && inv.cgst != '' || inv.sgst != null && inv.sgst != '') updateInvoiceItemQuery += `,cgst=${inv.cgst},sgst=${inv.sgst} `;
                                        if (inv.igst != null && inv.igst != '') updateInvoiceItemQuery += `,igst=${inv.igst} `;
                                    }


                                }
                                updateInvoiceItemQuery += ' WHERE iiid =' + inv.id;
                                // Execute the update query for the invoice item
                                const updateInvoiceItemResult = await conn.query(updateInvoiceItemQuery, [data.busid, ivid, inv.modelid,itemname, inv.itemgst, inv.itemamt,inv.vastatus]);

                                if (updateInvoiceItemResult[0]['affectedRows'] > 0) {
                                    erroraray.push({ msg: "Invoice Item Updated Successfully", err_code: 0 });
                                    continue;
                                } else {
                                    erroraray.push({ msg: "Invoice Item Not Updated.", err_code: 52 });
                                    await conn.rollback();
                                }
                            } else {
                                // Insert new invoice item
                                let insertInvoiceItemQuery = `INSERT INTO stock_mgmt.invoice_items set 
                                                                  busid=?, invid=?,modelid=?, itemname=?, itemgst=?, itemamt=?
                                                                 `;
                                                                 
                                if (inv.itemqty != null || inv.itemqty != '') insertInvoiceItemQuery += `,itemqty=${inv.itemqty}`;
                                 
                                if (data.gsttype == 0) {
                                    let res = await checkgst((checkAddResult[0][0].bagstno).slice(0, 2), (checkVenResult[0][0].gst_no).slice(0, 2), inv.cgst, inv.sgst, inv.igst);
                                    console.log('res :', res);
                                    if (res['err_code'] == 0) {
                                        if (inv.cgst != null && inv.cgst != '' || inv.sgst != null && inv.sgst != '') insertInvoiceItemQuery += `,cgst=${inv.cgst},sgst=${inv.sgst} `;
                                        if (inv.igst != null && inv.igst != '') insertInvoiceItemQuery += `,igst=${inv.igst} `;
                                    }


                                }
                                // Execute the insert query for the new invoice item
                                const insertInvoiceItemResult = await conn.query(insertInvoiceItemQuery, [data.busid, ivid,inv.modelid, itemname, inv.itemgst, inv.itemamt]);

                                if (insertInvoiceItemResult[0]['affectedRows'] > 0) {
                                    erroraray.push({ msg: "Invoice Item Added Successfully", err_code: 0 });
                                    continue;
                                } else {
                                    erroraray.push({ msg: "Invoice Item Not Added.", err_code: 52 });
                                    await conn.rollback();
                                }
                            }
                        }
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE INVOICE DETAIL',`longtext`='DONE BY'";
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Invoice Deatil Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }

                       


                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 52 });
                        await conn.rollback();
                    }
                } else {
                    erroraray.push({ msg: "Invoice Detail ID Already Exists.", err_code: 56 });
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


invoice.post('/editinvoice', async (req, res) => {
    req.setTimeout(864000000);
    // let validation = joiValidate.editinvoicedetDataSchema.validate(req.body);
    // if (validation.error) {
    //     console.log(validation.error.details);
    //     // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
    // }
    let result = await editinvoice(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

module.exports = invoice;