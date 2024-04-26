const Joi = require('joi');

//------------------------------------------------VENDOR DETAIL---------------------------//
const vendordetData={
    vcompany:Joi.string().required().label('Company  name required'),
    vname:Joi.string().required().label('vendor name required'),
    vmobile:Joi.number().required().label('Mobile Number required'),
    vmail:Joi.string().trim(true).email({ minDomainAtoms: 2 }).required().label('Email Required'),
    gstno: Joi.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().label("Invalid GST Number"),
    addrname:Joi.string().required().label('address required'),
    state: Joi.number().integer().required().label('State  required'),
    dist: Joi.number().integer().required().label('District required'),
    pincode: Joi.number().integer().required().label('Pincode required'),
    bank:Joi.string().required().label('Bank required'),
    vbname:Joi.string().required().label('Bank name required'),
    vbaccto:Joi.string().required().label('Account Number required'),
    vbifsc:Joi.string().required().label('Bank IFSC required'),
 }
 const vendetData={ id: Joi.number().integer().required().label('ID Required') }
  

   module.exports.vendordetDataSchema = Joi.object().keys(
      vendordetData
  ).options({ stripUnknown: true });  
  
  module.exports.editvendordetDataSchema = Joi.object().keys({
      vendordetData, vendetData
  }).options({ stripUnknown: true });