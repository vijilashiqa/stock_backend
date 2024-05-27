
const Joi = require('joi');



// console.log("data in the schema", req.body);
//-----------------------------------------------HSN------------------------------------//
const modelData={

    bid:Joi.number().integer().required().label('Business Name is Required'),
    itemname:Joi.number().integer().required().label('Make Name is Required'),
    deviceid:Joi.number().integer().required().label('Device ID is Required'),
    modelname:Joi.string().required().label('Model Name is Required'),

 }


 
 const mData={ id: Joi.number().integer().required().label('ID Required') }

  module.exports.own_useDataSchema = Joi.object().keys(modelData).options({ stripUnknown: true });  
  
  module.exports.editmodeldataschema = Joi.object().keys({modelData, mData}).options({ stripUnknown: true });