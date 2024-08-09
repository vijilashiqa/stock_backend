"use strict";
var express = require('express'),
	compress = require('compression'),
	vendors = express.Router(),
	pool = require('../connection/conn'),
	poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/vendor');

async function addvendor(req) {
	console.log('Add vendor Data:', req.body);
	return new Promise(async (resolve, reject) => {
		var erroraray = [];
		var data = req.body;
		var jwtdata = req.jwt_data;
		let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
		let conn = await poolPromise.getConnection();

		if (conn) {
			await conn.beginTransaction();

			try {
				console.log('channel Data', data);
				let checkvendor = await conn.query("SELECT COUNT(*) AS cnt FROM stock_mgmt.vendor WHERE vcompany = ?", [data.vcompany]);

				if (checkvendor[0][0]['cnt'] == 0) {
					// let status = data.status == true ? 1 : 0;

					let addven = `INSERT INTO stock_mgmt.vendor SET
					    bid=?,
                        vname = ?,
                        vcompany = ?,
                        vmobile = ?,
                        vmail = ?,
						cby=?
						`;

					addven = await conn.query(addven, [bid, data.vname, data.vcompany, data.vmobile, data.vmail, jwtdata.id]);

					if (addven[0]['affectedRows'] > 0) {
						let vendorid = addven[0].insertId;
						let insertaddress = [];
						let insertbank = [];

						for (let i = 0; i < data.stockinid.length; i++) {
							let vcm = data.stockinid[i];
							insertaddress.push([vendorid, vcm.gst_no, vcm.addrname, vcm.state, vcm.dist, vcm.pincode, vcm.address, jwtdata.id]);
						}
						console.log('daaaatta', insertaddress);

						let addvenadress = `INSERT INTO stock_mgmt.vendor_address(vid, gst_no, addrname, state, dist, pincode, address,cby) VALUES ?`;
						addvenadress = await conn.query(addvenadress, [insertaddress]);

						if (addvenadress[0]['affectedRows'] == 0) {
							erroraray.push({ msg: "Vendor address Not Created", error_code: 111 });
							await conn.rollback();
						}

						for (let i = 0; i < data.bankdetails.length; i++) {
							let vb = data.bankdetails[i];
							insertbank.push([vendorid, vb.bank, vb.vbankname, vb.vbacctno, vb.vbifsc, jwtdata.id]);
						}

						let addvendorbank = `INSERT INTO stock_mgmt.vendor_bank(vid, bank, vbname, vbacctno, vbifsc,cby) VALUES ?`;
						addvendorbank = await conn.query(addvendorbank, [insertbank]);

						if (addvendorbank[0]['affectedRows'] == 0) {
							erroraray.push({ msg: "Vendor Bank Not Created", error_code: 111 });
							await conn.rollback();
						}

						let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD Vendor Details',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
						sqllog = await conn.query(sqllog);

						if (sqllog[0]['affectedRows'] > 0) {
							erroraray.push({ msg: "Vendor created Successfully", err_code: 0 });
							await conn.commit();
						}
					} else {
						erroraray.push({ msg: "Contact Your Admin.", err_code: 38 });
						await conn.rollback();
					}
				} else {
					erroraray.push({ msg: "Vendor Name Already Exists.", err_code: 43 });
					await conn.rollback();
				}
			} catch (e) {
				console.log('Error', e);
				erroraray.push({ msg: 'Please try after sometimes Error', err_code: 'ERR' });
				await conn.rollback();
			}

			console.log('Success--1');
			console.log('Connection Closed.');
			conn.release();
		} else {
			erroraray.push({ msg: 'Please try after sometimes', err_code: 56 });
		}

		console.log('Success--2');
		return resolve(erroraray);
	});
}



vendors.post('/listvendor', function (req, res, err) {
	var sql, sqlquery = `SELECT v.id,v.vcompany,v.vname,v.vmobile,v.vmail,b.bname FROM stock_mgmt.vendor v
INNER JOIN stock_mgmt.business b ON b.id =v.id `,
		sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.vendor v
INNER JOIN stock_mgmt.business b ON b.id =v.id`, finalresult = [], where = [], data = req.body, jwtdata = req.jwt_data

let bid = jwtdata.urole == 999 ? data.busid : jwtdata.bid;

	if (data.hasOwnProperty('vcompany') && data.vcompany) where.push(` v.id =${data.vcompany}`)

	if (data.hasOwnProperty('vname') && data.vname) where.push(` v.id =${data.vname}`)

	if (jwtdata.urole > 888 && data.bid != '' && data.bid) where.push(` v.id =${data.bid}`)


	if (jwtdata.urole > 888 && data.busid != '' && data.busid != null) where.push(`  v.bid = ${bid} `);
	if (jwtdata.urole <= 888) where.push(` v.bid= ${bid} `);
	if (where.length > 0) {
		where = ' WHERE' + where.join(' AND ');
		sqlquery += where;
	}

	if (data.limit || data.limit == '' && data.index || data.index == '') {

		sqlquery += ' LIMIT ?,?'
	}
	console.log('--------vendor lidt-----------', sqlquery);
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
vendors.post('/getvendor', function (req, res) {
	let finalresult = [], where = [], data = req.body, jwtdata = req.jwt_data
	var sql, sqlquery ="select * from stock_mgmt.vendor"
	console.log("getvndor",data);;
		if (data.bid != '' && data.bid != null) where.push(` id =${data.bid}`)
			if (where.length > 0) {
				where = ' WHERE' + where.join(' AND ');
				sqlquery += where;
			}
			if (data.hasOwnProperty('like') && data.like) {
				sqlquery += ' AND vname LIKE "%' + data.like + '%" '
			}

			if (data.hasOwnProperty('vlike') && data.vlike) {
				sqlquery += ' AND vcompany LIKE "%' + data.vlike + '%" '
			}
console.log("sql",sqlquery);
	pool.getConnection(function (err, conn) {
		if (err) {
			console.log(err);
		} else {
			var sql = conn.query(sqlquery, function (err, result) {
				conn.release();
				if (!err) {
					res.end(JSON.stringify(result));
				}
			});
		}
	});
});



vendors.post('/getcompany', function (req, res) {
	let finalresult = [], where = [], data = req.body, jwtdata = req.jwt_data
	var sql, sqlquery ="select * from stock_mgmt.vendor"
	console.log("getvndor",data);;
		if (data.bid != '' && data.bid != null) where.push(` id =${data.bid}`)
			if (where.length > 0) {
				where = ' WHERE' + where.join(' AND ');
				sqlquery += where;
			}
			if (data.hasOwnProperty('like') && data.like) {
				sqlquery += ' AND vcompany LIKE "%' + data.like + '%" '
			}
console.log("sql",sqlquery);
	pool.getConnection(function (err, conn) {
		if (err) {
			console.log(err);
		} else {
			var sql = conn.query(sqlquery, function (err, result) {
				conn.release();
				if (!err) {
					res.end(JSON.stringify(result));
				}
			});
		}
	});
});

vendors.post('/getvendoraddredit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.vendor_address `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.vendor_address`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` vid= ${data.id} `);
	where.push(`vastatus=1`);
	if (where.length > 0) {
		where = ' WHERE  ' + where.join(' AND ');
		sqlquery += where;
		sqlqueryc += where
	}
	if (data.hasOwnProperty('like') && data.like) {
		sqlquery += (' AND addrname LIKE "%' + data.like + '%" ')
	}
	if (data.index != null) console.log('-----');
	if (data.index != null && data.limit != null) sqlquery += ' LIMIT ' + data.index + ',' + data.limit;
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



vendors.post('/getvendorbankedit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.vendor_bank   `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.vendor_bank`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` vid= ${data.id} `);
	where.push(`cbstatus=1`);
	if (where.length > 0) {
		where = ' WHERE   ' + where.join(' AND ');
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



vendors.post('/getvendoredit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.vendor `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.vendor`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` id= ${data.id} `);
	if (where.length > 0) {
		where = ' WHERE ' + where.join(' AND ');
		sqlquery += where;
		sqlqueryc += where
	}
	if (data.index != null) console.log('-----');
	if (data.index != null && data.limit != null) sqlquery += ' LIMIT ' + data.index + ',' + data.limit;
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

vendors.post('/getbank', function (req, res) {
	pool.getConnection(function (err, conn) {
		if (err) {
			console.log(err);
		} else {
			var sql = conn.query('SELECT  id,bname from stock_mgmt.bank where cbstatus=1 ', function (err, result) {
				conn.release();
				if (!err) {
					res.end(JSON.stringify(result));
				}
			});
		}
	});
});

async function vendoraddrupdate(stockinid, conn, vendorId, jwtdata) {
	return new Promise(async (resolve, reject) => {
		let errorArray = [], fstatus = false;
		if (conn) {
			for (let i = 0; i < stockinid.length; i++) {
				let vAddr = stockinid[i];

				if (vAddr.id != null && vAddr.id != '') {
					// Update existing record for Vendor Address
					let updateVendorAddress = `UPDATE stock_mgmt.vendor_address 
				SET gst_no = ?, addrname = ?, state = ?, dist = ?, pincode = ?, address = ?, vastatus = ? ,mby=?
					 WHERE vid = ? AND id = ?`;
					let updatedAddress = await conn.query(updateVendorAddress, [vAddr.gstno, vAddr.addresname, vAddr.state, vAddr.district, vAddr.pincode, vAddr.address, vAddr.vastatus, jwtdata, vAddr.vid, vAddr.id]);
					if (updatedAddress[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error updating Vendor Address", error_code: 117 });
						fstatus = true;
						await conn.rollback();
						return resolve(errorArray);
					}

				} else {
					// Insert new record for Vendor Address
					let insertVendorAddress = `INSERT INTO stock_mgmt.vendor_address 
			   (gst_no, addrname, state, dist, pincode, address, vastatus, mby,vid) 
				   VALUES (?, ?, ?, ?, ?, ?, ?, ? ,?)`;

					let insertedAddress = await conn.query(insertVendorAddress, [vAddr.gstno, vAddr.addresname, vAddr.state, vAddr.district, vAddr.pincode, vAddr.address, 1, jwtdata, vendorId]);

					if (insertedAddress[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error inserting new Vendor Address ", error_code: 116 });
						fstatus = true;
						await conn.rollback();
						return resolve(errorArray);

					}
				}
			}
			if (!fstatus) {
				return resolve([{ msg: "Process Done.", error_code: 0 }]);
			}
		} else {
			return resolve([{ msg: "DB Connection Error.", error_code: 'DBCE' }]);
		}
	});
}

async function vendorbankupdate(bankdetails, conn, vendorId, jwtdata) {
	return new Promise(async (resolve, reject) => {
		let errorArray = [], fstatus = false;
		if (conn) {
			for (let i = 0; i < bankdetails.length; i++) {
				let vBank = bankdetails[i];

				if (vBank.id != null && vBank.id != '') {
					// Update existing record for Vendor Bank
					let updateVendorBank = `UPDATE stock_mgmt.vendor_bank 
		  SET bank = ?, vbname = ?, vbacctno = ?, vbifsc = ?, cbstatus = ? ,mby =?
		   WHERE vid = ? AND id = ?`;

					let updatedBank = await conn.query(updateVendorBank, [vBank.bank, vBank.vbname, vBank.vbacctno, vBank.vbifsc, vBank.vbstatus, jwtdata, vBank.vid, vBank.id]);

					if (updatedBank[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error updating Vendor Bank", error_code: 115 });
						await conn.rollback();
					}

				} else {

					// Insert new record for Vendor Bank
					let insertVendorBank = `INSERT INTO stock_mgmt.vendor_bank 
				(bank, vbname, vbacctno, vbifsc, cbstatus, vid,mby) 
				 VALUES (?, ?, ?, ?, ?, ?)`;
					let insertedBank = await conn.query(insertVendorBank, [vBank.bank, vBank.vbname, vBank.vbacctno, vBank.vbifsc, 1, vendorId, jwtdata]);
					if (insertedBank[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error in inserting new Vendor Bank ", error_code: 114 });
						await conn.rollback();
					}
				}
			}
			if (!fstatus) {
				return resolve([{ msg: "Process Done.", error_code: 0 }]);
			}
		} else {
			return resolve([{ msg: "DB Connection Error.", error_code: 'DBCE' }]);
		}
	});
}

async function vendoredit(req) {
	console.log('Edit Vendor Data:', req.body);
	return new Promise(async (resolve, reject) => {
		var errorArray = [], data = req.body, jwtdata = req.jwt_data;
		let bid = jwtdata.urole == 999 ? data.bid : jwtdata.bid;
		console.log("business id ", bid);
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				console.log('Vendor Data', data);

				let checkvendor = await conn.query("SELECT COUNT(*) AS cnt FROM stock_mgmt.vendor WHERE   id= ?", [data.id]);
				console.log('helloooo', checkvendor[0]);
				if (checkvendor[0].length == 1) {

					let vendorId = data.id;

					// Update Vendor Details
					let updateVendor = `UPDATE stock_mgmt.vendor SET
					bid=?,
					vcompany = ?,
                    vname = ?,
                    vmobile = ?,
                    vmail = ?,
					mby=?
                    WHERE id = ?`;

					let updatedVendor = await conn.query(updateVendor, [bid, data.vcompany, data.vname, data.vmobile, data.vmail, jwtdata.id, vendorId]);

					if (updatedVendor[0]['affectedRows'] > 0) {
						// Update Vendor Address

						// Inside the loop for updating Vendor Address

						let venaddr_res = await vendoraddrupdate(data.stockinid, conn, vendorId, jwtdata.id)

						// Inside the loop for updating Vendor Bank
						let venabank_res = await vendorbankupdate(data.bankdetails, conn, vendorId, jwtdata.id)

					}

					let sqlLog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT Vendor',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
					sqlLog = await conn.query(sqlLog);

					if (sqlLog[0]['affectedRows'] > 0) {
						errorArray.push({ msg: "Vendor edited successfully", err_code: 0 });
						await conn.commit();
					}
				} else {
					errorArray.push({ msg: "Unable to edit vendor", err_code: 39 });
					await conn.rollback();
				}
			} catch (e) {
				console.log('Error', e);
				errorArray.push({ msg: 'Please try again later', err_code: 'ERR' });
				await conn.rollback();
			}

			console.log('Success--1');
			console.log('Connection Closed.');
			conn.release();
		} else {
			errorArray.push({ msg: 'Please try again later', err_code: 56 });
		}

		console.log('Success--2');
		return resolve(errorArray);
	});
}


vendors.post('/vendoredit', async (req, res) => {
	req.setTimeout(864000000);
	const validation = joiValidate.editvendorDataSchema.validate(req.body);
	if (validation.error) {
		console.log(validation.error.details);
		return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
	}
	let result = await vendoredit(req);
	console.log("Process Completed", result);
	res.end(JSON.stringify(result));

});



vendors.post('/addvendor', async (req, res) => {
	req.setTimeout(864000000);

	const validation = joiValidate.vendorDataSchema.validate(req.body);
	if (validation.error) {
		console.log(validation.error.details);
		// return res.status(422).json({ msg: validation.error.details, err_code: '422' });
		return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
	}
	let result = await addvendor(req);
	console.log("Process Completed", result);
	res.end(JSON.stringify(result));
});





module.exports = vendors;