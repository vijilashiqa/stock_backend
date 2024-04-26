
const Joi = require('joi');
//------------------------------------------------buss DETAIL---------------------------//
const bussdetData={
    bcompany:Joi.string().required().label('Bussiness  name required'),
    bname:Joi.string().required().label('buss name required'),
    bemail:Joi.string().trim(true).email({ minDomainAtoms: 2 }).required().label('Email Required'),
    bphoneno:Joi.number().required().label('Mobile Number required'),
    stateid: Joi.number().integer().required().label('State  required'),
    distid: Joi.number().integer().required().label('District required'),
    pan: Joi.string().required().label('GST reqired'),
    tinno: Joi.string().required().label('GST reqired'),
    baaddrname:Joi.string().required().label('address required'),
    bastateid: Joi.number().integer().required().label('State  required'),
    badistid: Joi.number().integer().required().label('District required'),
    bagstno: Joi.string().required().label('GST reqired'),
    bank:Joi.string().required().label('Bank required'),
    bbname:Joi.string().required().label('Bank name required'),
    bbaccto:Joi.string().required().label('Account Number required'),
    bbifsc:Joi.string().required().label('Bank IFSC required'),
 }
 const bdetData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.bussdetDataSchema = Joi.object().keys(
      bussdetData
  ).options({ stripUnknown: true });  
  
  module.exports.editbussdetDataSchema = Joi.object().keys({
      bussdetData, bdetData
  }).options({ stripUnknown: true });