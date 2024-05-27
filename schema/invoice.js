const Joi = require("joi");
//------------------------------------------------Invoice DETAIL---------------------------//
const invoicedetData = {
  busid: Joi.number().required().label("Business Name  is required"),
  busaddr: Joi.number().required().label("Bussiness Address is  required"),
  vendorid: Joi.number().required().label("Vendor Namr Address is  required"),
  vaddr: Joi.number().required().label("Vendor Address is  required"),
  invno: Joi.number().required().label("Invoice Number  is required"),
//   invdate: Joi.number().required().label("Invoice Date is required"),
};
const invdetData = {
  id: Joi.number().integer().required().label("ID Required"),
};

module.exports.invoicedetDataSchema = Joi.object()
  .keys(invoicedetData)
  .options({ stripUnknown: true });

module.exports.editinvoicedetDataSchema = Joi.object()
  .keys({
    invoicedetData,
    invdetData,
  })
  .options({ stripUnknown: true });
