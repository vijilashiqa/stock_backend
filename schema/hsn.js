
const Joi = require('joi');
//-----------------------------------------------HSN------------------------------------//
const hsnData={

   
    mhsn:Joi.string().required().label(' hsn required'),
   
    
 }
 const hData={ id: Joi.number().integer().required().label('ID Required') }

  module.exports.hsnDataSchema = Joi.object().keys(
      hsnData
  ).options({ stripUnknown: true });  
  
  module.exports.edithsnDataSchema = Joi.object().keys({
      hsnData, hData
  }).options({ stripUnknown: true });