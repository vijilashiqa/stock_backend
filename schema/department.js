
const Joi = require('joi');
//------------------------------------------------device ---------------------------//
const deviceData={
    busid:Joi.number().required().label('Business Name required'),
    depname:Joi.string().required().label('Departnment Name required'),
 }
 const detData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.departmentDataSchema = Joi.object().keys(
      deviceData
  ).options({ stripUnknown: true });  
  
  module.exports.departmentDataSchema = Joi.object().keys(deviceData, detData).options({ stripUnknown: true });