"use strict";
var express = require('express'),
	compress = require('compression'),
	business = express.Router(),
	pool = require('../connection/conn'),
	poolPromise = require('../connection/conn').poolp;
const joiValidate = require('../schema/business');

async function addbusiness(req) {
	return new Promise(async (resolve, reject) => {
		var erroraray = [], data = req.body, jwtdata = req.jwt_data;
		console.log("add business log jwt ", jwtdata);

		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				console.log('channel Data', data);
				let checkbusiness = await conn.query("SELECT COUNT(*) AS cnt FROM stock_mgmt.business WHERE bname = ?", [data.bname]);
				if (checkbusiness[0][0]['cnt'] == 0) {
					let addbusines = `INSERT INTO stock_mgmt.business SET
                        bname = ?,
                        bemail = ?,
                        bphoneno = ?,
                        pan=?,
                        tinno=?,
                        stateid=?,
                        distid=?`;

					addbusines = await conn.query(addbusines, [data.bname, data.bemail, data.bphoneno, data.pan, data.tinno, data.stateid, data.distid]);

					if (addbusines[0]['affectedRows'] > 0) {
						let businessid = addbusines[0].insertId;
						let insertaddress = [];
						let insertbank = [];

						for (let i = 0; i < data.stockinid.length; i++) {
							let baddr = data.stockinid[i];
							insertaddress.push([businessid, baddr.baaddrname, baddr.bastateid, baddr.badistid, baddr.bagstno, baddr.baaddress]);
						}
						// console.log('daaaatta', insertaddress);

						let addbusinesadress = `INSERT INTO stock_mgmt.business_address(bid,baaddrname, bastateid, badistid, bagstno, baaddress) VALUES ?`;
						addbusinesadress = await conn.query(addbusinesadress, [insertaddress]);

						if (addbusinesadress[0]['affectedRows'] == 0) {
							erroraray.push({ msg: "Business address Not Created", error_code: 111 });
							await conn.rollback();
						}

						for (let i = 0; i < data.bankdetails.length; i++) {
							let ba = data.bankdetails[i];
							insertbank.push([businessid, ba.bank, ba.bbname, ba.bbacctno, ba.bbifsc, jwtdata.id]);
						}

						let addbusinesdorbank = `INSERT INTO stock_mgmt.business_bank(bid, bank, bbname, bbacctno, bbifsc,cby) VALUES ?`;
						addbusinesdorbank = await conn.query(addbusinesdorbank, [insertbank]);

						if (addbusinesdorbank[0]['affectedRows'] == 0) {
							erroraray.push({ msg: "Business Bank Not Created", error_code: 111 });
							await conn.rollback();
						}

						let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='ADD Business',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
						sqllog = await conn.query(sqllog);

						if (sqllog[0]['affectedRows'] > 0) {
							erroraray.push({ msg: "Business created Successfully", err_code: 0 });
							await conn.commit();
						}
					} else {
						erroraray.push({ msg: "Contact Your Admin.", err_code: 38 });
						await conn.rollback();
					}
				} else {
					erroraray.push({ msg: "Business Name Already Exists.", err_code: 43 });
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


		}
		else {
			erroraray.push({ msg: 'Please try after sometimes', err_code: 68 })
			return;
		}
		console.log('success--2');
		return resolve(erroraray);
	});
}

business.post('/addbusiness', async (req, res) => {
	req.setTimeout(864000000);
	const validation = joiValidate.bussdetDataSchema.validate(req.body);
	if (validation.error) {
		console.log(validation.error.details);
		// return res.status(422).json({ msg: validation.error.details, err_code: '422' });
		return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
	}
	let result = await addbusiness(req);
	console.log('process', result);
	res.end(JSON.stringify(result));
});



business.post('/listbusiness', function (req, res, err) {
	var sql, sqlquery = `SELECT * FROM stock_mgmt.business 
           `,
		sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.business 
            `, finalresult = [], where = [],jwtdata = req.jwt_data,
		data = req.body;
		let bid = jwtdata.urole == 999  ? data.bid : jwtdata.bid;
	if (data.hasOwnProperty('busid') && data.busid) where.push(` id =${data.busid}`)
	if (data.hasOwnProperty('mobile') && data.mobile) where.push(` id =${data.mobile}`)
		if (data.hasOwnProperty('mail') && data.mail) where.push(` id =${data.mail}`)
		if (jwtdata.urole > 888 && data.bid != '' && data.bid != null) where.push(`  id= ${bid} `);
        if (jwtdata.urole <= 888) where.push(` id= ${bid} `);
        if (where.length > 0) {
            where = ' WHERE' + where.join(' AND ');
            sqlquery += where;
			sqlqueryc += where;
        }

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


business.post('/getbank', function (req, res, err) {

	var data = req.body, sql, sqlquery = `SELECT * FROM stock_mgmt.bank`,
		sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.bank`, finalresult = [];
	if (data.hasOwnProperty('like') && data.like) {
		sqlquery += ' WHERE bname LIKE "%' + data.like + '%" '
	}
	console.log('-********************-', sqlquery);
	pool.getConnection(function (err, conn) {
		if (!err) {
			sql = conn.query(sqlquery, function (err, result) {
				if (!err) {
					finalresult.push(result);


					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						if (!err) {
							finalresult.push(result[0]);
							res.end(JSON.stringify(finalresult));
						}
					});


					console.log("SQL@@@@@@@@@@@@2", sql.sql)
				} else {
					conn.release();
				}
			});
		}
	});
});





business.post('/getmobile', function (req, res, err) {

	var data = req.body, sql, sqlquery = `SELECT * FROM stock_mgmt.business `,
		sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.bank`, finalresult = [],where=[];
	console.log("data",data);
	if (data.hasOwnProperty('id') && data.id) where.push(` id =${data.id}`)
		if (where.length > 0) {
			where = ' WHERE' + where.join(' AND ');
			sqlquery += where;
		}
		if (data.hasOwnProperty('like') && data.like) {
			sqlquery += ' AND bphoneno LIKE "%' + data.like + '%" '
		}
	console.log('-********************-', sqlquery);
	pool.getConnection(function (err, conn) {
		if (!err) {
			sql = conn.query(sqlquery, function (err, result) {
				if (!err) {
					finalresult.push(result);


					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						if (!err) {
							finalresult.push(result[0]);
							res.end(JSON.stringify(finalresult));
						}
					});


					console.log("SQL@@@@@@@@@@@@2", sql.sql)
				} else {
					conn.release();
				}
			});
		}
	});
});



business.post('/getmail', function (req, res, err) {

	var data = req.body, sql, sqlquery = `SELECT * FROM stock_mgmt.business `,
		sqlqueryc = `SELECT COUNT(*) AS count FROM stock_mgmt.bank`, finalresult = [],where =[];

		console.log("data",data);
	if (data.hasOwnProperty('id') && data.id) where.push(` id =${data.id}`)
		if (where.length > 0) {
			where = ' WHERE' + where.join(' AND ');
			sqlquery += where;
		}
	if (data.hasOwnProperty('like') && data.like) {
		sqlquery += ' WHERE bemail LIKE "%' + data.like + '%" '
	}
	console.log('-********************-', sqlquery);
	pool.getConnection(function (err, conn) {
		if (!err) {
			sql = conn.query(sqlquery, function (err, result) {
				if (!err) {
					finalresult.push(result);


					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						if (!err) {
							finalresult.push(result[0]);
							res.end(JSON.stringify(finalresult));
						}
					});


					console.log("SQL@@@@@@@@@@@@2", sql.sql)
				} else {
					conn.release();
				}
			});
		}
	});
});




business.post('/getbusinessaddredit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.business_address `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.business_address`,
		data = req.body;



	if (data.id != '' && data.id != null) where.push(` bid= ${data.id} `);
	where.push(`bastatus=1`);
	if (where.length > 0) {
		where = ' WHERE  ' + where.join(' AND ');
		sqlquery += where;
		sqlqueryc += where

	}


	if (data.hasOwnProperty('like') && data.like) {
		sqlquery += ' and baaddrname LIKE "%' + data.like + '%" '
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
business.post('/getbusinessbankedit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.business_bank   `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.business_bank`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` bid= ${data.id} `);
	where.push(`bstatus=1`);
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
business.post('/getbusinessedit', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.business `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.business`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` id= ${data.id} `);
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

business.post('/getbusiness', function (req, res, err) {
	var jwtdata = req.jwt_data, where = [], sql,
		sqlquery = `SELECT *  FROM stock_mgmt.business `, finalresult = [],
		sqlqueryc = ` SELECT count(*) as cnt FROM stock_mgmt.business`,
		data = req.body;
	if (data.id != '' && data.id != null) where.push(` id= ${data.id} `);
	if (where.length > 0) {
		where = ' WHERE ' + where.join(' AND ');
		sqlquery += where;
		sqlqueryc += where

	}

	if (data.hasOwnProperty('like') && data.like) {
		sqlquery += 'WHERE bname LIKE "%' + data.like + '%" '
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



async function businessaddrupdate(stockinid, conn, businessId) {
	return new Promise(async (resolve, reject) => {
		let errorArray = [], fstatus = false;
		if (conn) {
			for (let i = 0; i < stockinid.length; i++) {
				let bAddr = stockinid[i];

				if (bAddr.id != null && bAddr.id != '') {
					// Update existing record for business Address
					let updatebusinessAddress = `UPDATE stock_mgmt.business_address 
				SET baaddrname = ?, bastateid = ?, badistid = ?, bagstno = ?, baaddress = ?, bastatus = ? 
					 WHERE bid = ? AND id = ?`;

					let updatedAddress = await conn.query(updatebusinessAddress, [bAddr.baaddrname, bAddr.bastateid, bAddr.badistid, bAddr.bagstno, bAddr.baaddress, bAddr.bastatus, bAddr.bid, bAddr.id]);

					if (updatedAddress[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error updating business Address", error_code: 117 });
						fstatus = true;
						await conn.rollback();
						return resolve(errorArray);
					}

				} else {
					// Insert new record for business Address
					let insertbusinessAddress = `INSERT INTO stock_mgmt.business_address 
			   (baaddrname, bastateid, badistid, bagstno,baaddress,bastatus,bid) 
				   VALUES (?, ?, ?, ?, ?, ?, ?)`;

					let insertedAddress = await conn.query(insertbusinessAddress, [bAddr.baaddrname, bAddr.bastateid, bAddr.badistid, bAddr.bagstno, bAddr.baaddress, 1, businessId]);

					if (insertedAddress[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error inserting new business Address ", error_code: 116 });
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

async function businessbankupdate(bankdetails, conn, businessId, jwt) {
	return new Promise(async (resolve, reject) => {
		let errorArray = [], fstatus = false;
		if (conn) {
			for (let i = 0; i < bankdetails.length; i++) {
				let bBank = bankdetails[i];

				if (bBank.id != null && bBank.id != '') {
					// Update existing record for business Bank
					let updatebusinessBank = `UPDATE stock_mgmt.business_bank 
		  SET bank = ?, bbname = ?, bbacctno = ?, bbifsc = ?, bstatus = ? ,  mby =?
		   WHERE bid = ? AND id = ?`;
					let updatedBank = await conn.query(updatebusinessBank, [bBank.bank, bBank.bbname, bBank.bbacctno, bBank.bbifsc, bBank.bstatus, jwt, bBank.bid, bBank.id]);
					console.log("update the bank", updatedBank);
					console.log("business edit data cbt++++++++++++++++", jwt)

					if (updatedBank[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error updating business Bank", error_code: 115 });
						await conn.rollback();
					}

				} else {

					// Insert new record for business Bank
					let insertbusinessBank = `INSERT INTO stock_mgmt.business_bank 
				(bank, bbname, bbacctno, bbifsc, bstatus, bid) 
				 VALUES (?, ?, ?, ?, ?, ?)`;

					let insertedBank = await conn.query(insertbusinessBank, [bBank.bank, bBank.bbname, bBank.bbacctno, bBank.bbifsc, 1, businessId]);

					if (insertedBank[0]['affectedRows'] == 0) {
						errorArray.push({ msg: "Error in inserting new business Bank ", error_code: 114 });
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

async function businessedit(req) {
	console.log('Edit business Data:', req.body);
	return new Promise(async (resolve, reject) => {
		var errorArray = [], data = req.body, jwtdata = req.jwt_data;


		let conn = await poolPromise.getConnection();

		if (conn) {
			await conn.beginTransaction();

			try {
				console.log('business Data', data);

				let checkbusiness = await conn.query("SELECT COUNT(*) AS cnt FROM stock_mgmt.business WHERE   id= ?", [data.id]);
				console.log('helloooo', checkbusiness[0]);
				if (checkbusiness[0].length == 1) {

					let businessId = data.id;

					// Update business Details
					let updatebusiness = `UPDATE stock_mgmt.business SET
					bname = ?,
					bemail = ?,
					bphoneno = ?,
					pan=?,
					tinno=?,
					stateid=?,
					distid=?
					WHERE id = ?`;

					let updatedbusiness = await conn.query(updatebusiness, [data.bname, data.bemail, data.bphoneno, data.pan, data.tinno, data.stateid, data.distid, businessId]);

					if (updatedbusiness[0]['affectedRows'] > 0) {

						//update business id into vendor


						// Inside the loop for updating business Address

						let businessaddr_res = await businessaddrupdate(data.stockinid, conn, businessId)

						// Inside the loop for updating business Bank
						let businessbank_res = await businessbankupdate(data.bankdetails, conn, businessId, jwtdata.id)


						console.log("bank-----------------------------------===========-----------------", businessaddr_res);

					}

					let sqlLog = "INSERT INTO stock_mgmt.activitylog SET table_id='EDIT Business',`longtext`='DONE BY',urole=" + jwtdata.urole + ", cby=" + jwtdata.id;
					sqlLog = await conn.query(sqlLog);

					if (sqlLog[0]['affectedRows'] > 0) {
						errorArray.push({ msg: "business edited successfully", err_code: 0 });
						await conn.commit();
					}
				} else {
					errorArray.push({ msg: "Unable to edit business", err_code: 39 });
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


business.post('/businessedit', async (req, res) => {
	req.setTimeout(864000000);
	const validation = joiValidate.editbussdetDataSchema.validate(req.body);
	if (validation.error) {
		console.log(validation.error.details);
		return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
	}
	let result = await businessedit(req);
	console.log("Process Completed", result);
	res.end(JSON.stringify(result));

});


module.exports = business;