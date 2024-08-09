
const Joi = require('joi');
//------------------------------------------------device ---------------------------//
const deviceData={
    bid:Joi.number().required().label('Business Name required'),

    devicename:Joi.string().required().label('Device name required'),
 }
 const detData={ id: Joi.number().integer().required().label('ID Required') }
  
  module.exports.deviceDataSchema = Joi.object().keys(deviceData).options({ stripUnknown: true });  
  
  module.exports.editdeviceDataSchema = Joi.object().keys(deviceData, detData).options({ stripUnknown: true });