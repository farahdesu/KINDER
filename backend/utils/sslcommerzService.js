const SSLCommerzPayment = require('sslcommerz-lts');

const initializePayment = async (paymentData) => {
  const store_id = process.env.STORE_ID;
  const store_passwd = process.env.STORE_PASSWORD;
  const is_live = process.env.IS_LIVE === 'true';

  const data = {
    total_amount: paymentData.totalAmount,
    currency: 'BDT',
    tran_id: paymentData.transactionId, // unique transaction id
    success_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/success`,
    fail_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/ipn`,
    shipping_method: 'NO',
    product_name: 'Babysitter Booking Payment',
    product_category: 'Service',
    product_profile: 'general',
    cus_name: paymentData.customerName,
    cus_email: paymentData.customerEmail,
    cus_add1: paymentData.customerAddress || 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: paymentData.customerPhone,
    cus_fax: paymentData.customerPhone,
    ship_name: paymentData.customerName,
    ship_add1: 'Dhaka',
    ship_add2: 'Dhaka',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: 1000,
    ship_country: 'Bangladesh',
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  console.log('SSLCommerz connected');
  const apiResponse = await sslcz.init(data);

  return apiResponse;
};

const validatePayment = async (val_id) => {
  const store_id = process.env.STORE_ID;
  const store_passwd = process.env.STORE_PASSWORD;
  const is_live = process.env.IS_LIVE === 'true';

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const validation = await sslcz.validate({ val_id });

  return validation;
};

module.exports = {
  initializePayment,
  validatePayment
};