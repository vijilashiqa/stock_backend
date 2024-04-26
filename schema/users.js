const Joi = require('joi');


const usersData={

    loginid:Joi.string().required().label('Username Required'),
    password:Joi.number().required().label('password Required'),
    fname:Joi.string().required().label('First Name Required'),
    mobile: Joi.number().min(10).required().label('Mobile Number required'),
    email: Joi.string().trim(true).email({ minDomainAtoms: 2 }).required().label('Email Required'),  
    address: Joi.string().required().label('Address Required'),
   
}

const userData={ id: Joi.number().integer().required().label('ID Required') }

module.exports.usersDatachema = Joi.object().keys(
    usersData
).options({ stripUnknown: true });  

module.exports.editusersDataSchema = Joi.object().keys({
    usersData, userData
}).options({ stripUnknown: true });       