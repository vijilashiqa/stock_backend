
var mysql = require('mysql'), db = require('../config/1');

db = db.mysqltesting;
console.log('DB_Server_Name:',db.Server_Name,'\npublic_ip:',db.public_ip,'\nhost',db.host);
var pool = mysql.createPool({
    connectionLimit: 999 * 1,
    host: db.public_ip,
    user: db.user,
    password: db.password,
    database: db.database,
    debug: false
});

var mysqlPromise = require('promise-mysql2');
let connection = mysqlPromise.createPool({
    "host": db.public_ip,
    "user": db.user,
    "password": db.password,
    "database": db.database,
    "connectionLimit": 999 * 1,
});

module.exports = pool; //method 1
module.exports.poolp = connection; //method 2