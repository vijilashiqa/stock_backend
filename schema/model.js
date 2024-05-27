
const Joi = require('joi');
//-----------------------------------------------HSN------------------------------------//
const modelData={
    bid:Joi.number().integer().required().label('Business Name is Required'),
    makeid:Joi.number().integer().required().label('Make Name is Required'),
    deviceid:Joi.number().integer().required().label('Device ID is Required'),
    modelname:Joi.string().required().label('Model Name is Required')
 }
 const mData={ id: Joi.number().integer().required().label('ID Required') }

  module.exports.modeldataschema = Joi.object().keys(modelData).options({ stripUnknown: true });  
  
  module.exports.editmodeldataschema = Joi.object().keys({modelData, mData}).options({ stripUnknown: true });