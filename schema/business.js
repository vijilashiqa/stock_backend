
const Joi = require('joi');
//------------------------------------------------buss DETAIL---------------------------//
// console.log("schema joi", body);

const bussdetData={
    bname:Joi.string().required().label('Bussiness  Name is Required'),
    bemail:Joi.string().trim(true).email({ minDomainAtoms: 2 }).required().label('Email is Required'),
    bphoneno:Joi.number().required().label('Mobile Number is Required'),
    pan: Joi.string().required().label('PAN NO is Required'),
    stateid: Joi.number().integer().required().label('State Name  is Required'),
    distid: Joi.number().integer().required().label('District Name is Required'),
    tinno: Joi.string().required().label('TIN No is Required'),

  

//     bankdetails:Joi.array().items(Joi.object.keys({ 

        
//             bank:Joi.number().integer().required().label('Bank  Details is Required'),
//             bbname:Joi.string().required().label('Bank Name  is Required'),
//             bbaccto:Joi.string().required().label('Account Number is Required'),
//             bbifsc:Joi.string().required().label('Bank IFSC is Required'),
          
//         })) 
// ,

//       stockinid :Joi.array().items(Joi.object.keys({ 

//         bagstno: Joi.string().required().label('GST is Required'),
//         baaddress :Joi.string().required().label("Bank Address is Required"),
//         bastateid: Joi.number().integer().required().label('State  is Required'),
//         badistid: Joi.number().integer().required().label('District is Required'),
//         baaddrname:Joi.string().required().label('Bank Name is required'),

    

    
 
   
//   })) 


   
  

 }


 

 

 const bdetData={ id: Joi.number().integer().required().label('ID Required') }
  

  module.exports.bussdetDataSchema = Joi.object().keys(
      bussdetData
  ).options({ stripUnknown: true });  
  
  module.exports.editbussdetDataSchema = Joi.object().keys({
      bussdetData, bdetData
  }).options({ stripUnknown: true });