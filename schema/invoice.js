

const Joi = require('joi');
//------------------------------------------------Invoice DETAIL---------------------------//
const invoicedetData={
   
   invno:Joi.number().required().label('Invoice Number required'),
    busid:Joi.number().required().label('Business Name required'),
    busaddrid:Joi.number().required().label('address required'),
    vid:Joi.number().required().label('vendor Name required'),
    vaddrid:Joi.number().required().label(' vendor address required'),
    gsttype: Joi.string().required().label('GST reqired'),
 }
 const invdetData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.invoicedetDataSchema = Joi.object().keys(
      invoicedetData
  ).options({ stripUnknown: true });  
  
  module.exports.editinvoicedetDataSchema = Joi.object().keys({
      invoicedetData, invdetData
  }).options({ stripUnknown: true });