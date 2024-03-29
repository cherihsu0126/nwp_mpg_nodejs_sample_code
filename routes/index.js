
const express = require('express');
const router = express.Router();
const { aes_encrypt, sha_encrypt, aes_decrypt } = require('./../public/javascripts/crypto');

const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const { MerchantID, HASHKEY, HASHIV, ReturnURL, NotifyURL, Host } = process.env;


// 選擇支付方式 MPG API 範例 view
router.get('/', (req, res, next) => {
  res.render('index', { title: '藍新 MPG API 串接範例', Host ,MerchantID, HASHKEY, HASHIV, ReturnURL, NotifyURL});  //view
});

router.get('/formPostSubmit', (req, res, next) => {
  res.render('formPostSubmit', { title: '藍新 MPG API 串接 加密後交易測試範例'});  //view
});


router.post('/createOrder', async (req, res) => { //api
  const order = req.body;
  // AES加密
  const aesEncrypt = aes_encrypt(order);
  // 使用 HASH 再次 SHA 加密字串，作為驗證使用
  const shaEncrypt = sha_encrypt(aesEncrypt, order.key, order.iv);
  
  let enOrder = {
    order: order,
    TradeInfo: aesEncrypt,
    TradeSha: shaEncrypt,
  }
  res.redirect(`${Host}/formPostSubmit?${JSON.stringify(enOrder)}`)  //response to front-end
});

// ReturnURL
router.post('/newebpay-return', function (req, res, next) {
  const response = req.body
  const nwpReturnData = response.TradeInfo
  let decryptData = aes_decrypt(response.TradeInfo, HASHKEY, HASHIV);
  res.render('result', { title: '交易結果', nwpReturnData, decryptData });
});

// NotifyURL
router.post('/newebpay-notify', function (req, res, next) {
  const response = req.body;
  const thisShaEncrypt = sha_encrypt(response.TradeInfo, HASHKEY, HASHIV);
  if ( !thisShaEncrypt === response.TradeSha ) {
    console.log('付款失敗：TradeSha 不一致');
    return res.end();
  }

  // 解密交易內容
  const decryptData = aes_decrypt(response.TradeInfo, HASHKEY, HASHIV);
  console.log('交易結果：', decryptData);

  return res.end();
});

module.exports = router;
