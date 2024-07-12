


const Joi = require('joi');
//------------------------------------------------device ---------------------------//
constmakeData={
    bid:Joi.number().required().label('Business Name required'),

    makename:Joi.string().required().label('Make Name required'),
 }
 const detData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.makeDataSchema = Joi.object().keys(constmakeData).options({ stripUnknown: true });  
  
  module.exports.editmakeDataSchema = Joi.object().keys(constmakeData, detData).options({ stripUnknown: true });