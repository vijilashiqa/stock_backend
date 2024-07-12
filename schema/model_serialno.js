
const Joi = require('joi');
//-----------------------------------------------HSN------------------------------------//
const model_serial_Data={

    bid:Joi.number().integer().required().label('Business Name is Required'),
    invno:Joi.number().integer().required().label('Invoice No is Required'),
    itemname:Joi.number().integer().required().label('Item Name is Required'),
    // serial_num:Joi.string().required().label('Serial No is Required')
    
 }
 const mData={ id: Joi.number().integer().required().label('ID Required') }

  module.exports.model_serial_noDataSchema = Joi.object().keys(model_serial_Data).options({ stripUnknown: true });  
  
  module.exports.editmodel_serial_noDataSchema = Joi.object().keys({model_serial_Data, mData}).options({ stripUnknown: true });