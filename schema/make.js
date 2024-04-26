const Joi=require('joi');


const Joi = require('joi');
//------------------------------------------------device ---------------------------//
constmakeData={
    makename:Joi.string().required().label('Device name required'),
    busid:Joi.number().required().label('Business Name required'),
 }
 const detData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.makeDataSchema = Joi.object().keys(
     makeData
  ).options({ stripUnknown: true });  
  
  module.exports.editmakeDataSchema = Joi.object().keys({
     makeData, detData
  }).options({ stripUnknown: true });