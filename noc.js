// "use strict";
const express = require('express');
app = express();
// Routes File Import Start

const vendor=require('./routes/vendor');
const location=require('./routes/location');
const hsn=require('./routes/hsn');
const users=require('./routes/users');
const business=require('./routes/business');
const invoice=require('./routes/invoice');
const model=require('./routes/model');
const make=require('./routes/make');
const device=require('./routes/device');
const model_serial_no=require('./routes/model_serial_no');
const hub=require('./routes/hub');
const own_use=require('./routes/own_use');
const prehandler=require('./routes/prehandler');
const login=require('./routes/login');
const department=require('./routes/department');
const menurole=require('./routes/menurole');
// Routes File Import End
const cors = require('cors');
// const swaggerUi = require('swagger-ui-express');
// var options = { swaggerOptions: { url: 'http://petstore.swagger.io/v2/swagger.json' } }
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));
var compress = require('compression');
var helmet = require('helmet');
const bodyParser = require('body-parser');
const IP = '192.168.4.60',port=9093; 
app.use(cors())
app.use(compress());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(function (req, res, next) {
  console.log(
    '----------Request START----------\n\rSystem IP :', req.ip,
    '\n\rLocal IP :', req.connection.remoteAddress,
    '\n\rreq Origin :', req.url,'\n\rreq Origin Ip :', req.headers.origin,
    '\n\rReq.body :',req.body,
    '\n\r----------Request END----------'
  );
  next();
});
app.use(helmet({frameguard: { action: 'deny' }}));
// API Method Start
app.use('/login',login);
app.use('/*',prehandler);
app.use('/vendors',vendor);
app.use('/location',location);
app.use('/hsn',hsn);
app.use('/users',users);
app.use('/business',business);
app.use('/invoice',invoice);
app.use('/model',model);
app.use('/make',make);
app.use('/device',device);
app.use('/model_serial_no',model_serial_no);
app.use('/hub',hub);
app.use('/own_use',own_use);
app.use('/department',department)
app.use('/menurole',menurole);
// API Method End
app.listen(port, IP, () => {
    console.log('NOC Server Running... on IP:',IP+':'+port)
  });