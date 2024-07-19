const express = require('express');
const login = express();
const bodyParser = require('body-parser');
login.use(bodyParser.json());       // to support JSON-encoded bodies
login.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const jwt = require('jsonwebtoken');
const tokenExpireTime = 2 * 60 * 60 * 1000;
const refreshTokenExpireTime = 24 * 60 * 60 * 1000;
const privateKey  = require('../config/key');
const poolPromise = require('../connection/conn').poolp;

async function account(data) {
    console.log("Login Data", data)
    console.log("request data", data.jwtdata);
    return new Promise(async (resolve, reject) => {
        var sqlquery, loginid, pwd, erroraray = [], refresh_token;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                sqlquery = ` SELECT * FROM stock_mgmt.users 
                WHERE loginid = '${data.loginid}' AND pwd='${data.pwd}' `
                let usercount = " SELECT EXISTS( " + sqlquery + " )AS COUNT ";
                console.log('User Exists Query ', usercount);
                let [[userava]] = await conn.query(usercount);
                if (userava['COUNT'] == 1) {
                    let result = await conn.query(sqlquery);
                    console.log('Length ', result[0].length);
                    if (result[0].length == 1) {
                        let userDet = result[0][0];
                        console.log('Userdetails', userDet)
                        let session_id = generateRondomSting(), token, updatetoken;
                        try {
                            token = await jwt.sign({
                                id: userDet.id, loginid: userDet.loginid,fname:userDet.fname, email: userDet.email, mobile: userDet.mobile,umenu:userDet.umenu,bid:userDet.bid,
                                urole:userDet.urole,session_id: session_id,
                            },
                                privateKey, { algorithm: 'HS512', expiresIn: tokenExpireTime });
                                refresh_token = await jwt.sign({ id: userDet.id, loginid: userDet.loginid, session_id: session_id ,urole:userDet.urole,umenu:userDet.umenu,},
                                privateKey, { algorithm: 'HS512', expiresIn: refreshTokenExpireTime });


                                console.log("token @@@@@@@@@@@",token);

                        } catch (e) {
                            erroraray.push({ msg: "Please Try After Sometimes", status: 0, error_msg: '48' });
                            return;
                        }
                        let user_details = {
                            id: userDet.id, loginid: userDet.loginid,fname:userDet.fname, email: userDet.email, mobile: userDet.mobile,umenu:userDet.umenu,bid:userDet.bid,
                                urole:userDet.urole
                        }
                         console.log(token, "tokennnnnnnnnnnnnn");
                         console.log('refressss',refresh_token);
                         console.log('usertype',userDet.urole);
                        updatetoken = " UPDATE stock_mgmt.users set `token`='" + token + "', `refresh_token`='" + refresh_token + "' where id=" + userDet.id;
                        console.log('updatetoken', updatetoken);
                        updatetoken = await conn.query(updatetoken);
                        if (updatetoken[0]['affectedRows'] != 0) {
                            await conn.commit();
                            erroraray.push({ msg: "login successfully", status: 1, error_msg: 0, user_details: user_details, token: token, refresh_token: refresh_token });
                            console.log("login successfully ");
                        } else {
                            erroraray.push({ msg: " Please Try After 15 Min. ", status: 2, error_msg: '66' });
                            await conn.rollback();
                        }
                    } else {
                        erroraray.push({ msg: "Please Try After 5 Min", status: 0, error_msg: '70' });
                        await conn.rollback();
                    }
                } else {
                    console.log(' COUNT is 0 :  ', userava['COUNT']);
                    erroraray.push({ msg: "User ID or Password Incorrect. ", status: 0, error_msg: '75' });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e)
                erroraray.push({ status: 0, msg: 'Internal Error please try later ', error_msg: '80' });
            }
            console.log('connection Closed.');
            conn.release();
        } else {
            erroraray.push({ status: 0, msg: 'Internal Error please try later ', error_msg: '85' });
            return;
        }
        console.log('success--2');
        return resolve(erroraray);
    });
}



login.post('/account', async (req, res) => {
    req.setTimeout(864000000);
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('result----', ip);
    let result = await account(req.body);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});


const generateRondomSting = (length = 20, stringNeedToGenerate = 'ab56789cRSjklmnopqdefghiABCDEFGHIJKL0123MNOPQrstuvwxyzTUVWXYZ4') => {
    let randomString = '';
    for (var i = 0; i < length; i++) {
        let index = Math.floor(Math.random() * stringNeedToGenerate.length);
        randomString += stringNeedToGenerate[index];
    }
    return randomString;
}







async function resetpasswaord(req) {
    console.log('update Data:', req.jwt_data);
    return new Promise(async (resolve, reject) => {
        var erroraray = [], data = req.body, jwtdata = req.jwt_data, password_en;
    
        let conn = await poolPromise.getConnection();
        console.log("jwt req",jwtdata)
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log('Data', data);

                let checkprofile = await conn.query("SELECT pwd FROM stock_mgmt.users  WHERE  id=" + data.id + " ");
                console.log('checkprofile', checkprofile)
                if (checkprofile[0]['pwd'] == password_en) {
                    // let status = data.status == true ? 1 : 0;
                    let addbox = `UPDATE  stock_mgmt.users SET pwd='${data.password_en}' WHERE id =` + data.id;
                    console.log('Update boxmodel Query: ', addbox);
                    addbox = await conn.query(addbox);
                    if (addbox[0]['affectedRows'] > 0) {
                        let sqllog = "INSERT INTO stock_mgmt.activitylog SET table_id='UPDATE USERS',`longtext`='DONE BY',urole=" + data.urole + ",cby=" + data.id;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            erroraray.push({ msg: " Password Updated Succesfully", err_code: 0 });
                            await conn.commit();
                        }
                    } else {
                        erroraray.push({ msg: "Contact Your Admin.", err_code: 90 });
                        await conn.rollback();
                    }
                } else {
                    console.log('no data', checkprofile)
                    erroraray.push({ msg: " password already exits.", err_code: 95 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ msg: 'Please try after sometimes', err_code: 'TRYE' });
                await conn.rollback();
            }
        } else {
            erroraray.push({ msg: 'Please try after ', err_code: 104 });
            return resolve(erroraray);
        }
        if (conn) conn.release();
        console.log('connection Closed.');
        return resolve(erroraray);
    });
}
login.post('/resetpassword', async (req, res) => {
    req.setTimeout(864000000);
    let result = await resetpasswaord(req);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
})

module.exports = login;