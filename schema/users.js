const Joi = require('joi');


const usersData={
bid :Joi.number().integer().required().label('Bussiness is Required'),
urole:Joi.number().integer().required().label('urole is Required'),
    loginid:Joi.string().required().label('Username is Required'),
    // pwd:Joi.string().required().label('password Required'),

    fname:Joi.string().required().label('First Name is Required'),
    email: Joi.string().trim(true).email({ minDomainAtoms: 2 }).required().label('Email Required'),  

    mobile: Joi.number().min(10).required().label('Mobile Number required'),
    address: Joi.string().required().label('Address Required'),
//    umenu :Joi.number().min(10).required().label('Menu is Required'),
}

const userData={ id: Joi.number().integer().required().label('ID Required') }

module.exports.usersDatachema = Joi.object().keys(
    usersData
).options({ stripUnknown: true });  

module.exports.editusersDataSchema = Joi.object().keys(usersData, userData).options({ stripUnknown: true });       