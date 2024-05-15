import { randomBytes } from 'crypto';
import moment from 'moment';
import otps from './otps';

export const generateOrderID = () => {
  const prefix = 'MOMENTO';
  const date = moment(Date.now()).format('YYYYMMDDHH');
  const random = otps(6);
  const orderID = `${prefix}${date}${random}`;
  return orderID;
};

export const generateCartID = () => {
  const prefix = 'ck';
  const id = randomBytes(8).toString('hex');
  const cartID = `${prefix}${id}`;
  return cartID;
};

export const generateCheckout = () => {
  const prefix = 'ck';
  const id = randomBytes(8).toString('hex');
  const checkoutID = `${prefix}${id}`;
  return checkoutID;
};
