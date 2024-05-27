
const Joi = require('joi');
//------------------------------------------------device ---------------------------//
const deviceData={
    devicename:Joi.string().required().label('Device name required'),
    bid:Joi.number().required().label('Business Name required'),
 }
 const detData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.deviceDataSchema = Joi.object().keys(
      deviceData
  ).options({ stripUnknown: true });  
  
  module.exports.editdeviceDataSchema = Joi.object().keys(deviceData, detData).options({ stripUnknown: true });