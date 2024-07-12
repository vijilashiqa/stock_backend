
const Joi = require('joi');



// console.log("data in the schema", req.body);
//-----------------------------------------------HSN------------------------------------//
const modelData={

    bid:Joi.number().integer().required().label('Business Name is Required'),
    depid:Joi.number().integer().required().label('Department  Name is Required'),
    itemname:Joi.number().integer().required().label('item  Name is Required'),
    // hubid:Joi.number().integer().required().label('HUB Name is Required'),

 }


 
 const mData={ id: Joi.number().integer().required().label('ID Required') }

  module.exports.own_useDataSchema = Joi.object().keys(modelData).options({ stripUnknown: true });  
  
  module.exports.editown_useDataSchema = Joi.object().keys({modelData, mData}).options({ stripUnknown: true });