const Jimp = require("jimp");
const qrCode = require('qrcode-reader');

class Payment{
    constructor(){
        this.payments = [];
    }

    addPayment(payment){
        this.payments.push(payment);
    }

    getPayments(){
        return this.payments;
    }

    static async decodeQRCode(buffer) {
        try{
          return new Promise((resolve, reject) => {
            Jimp.read(buffer, async (err, image) => {
              if (err) {
                console.error(err);
                reject(err);
              }
        
              const qrcode = new qrCode();
              qrcode.callback = (err, value) => {
                if (err) {
                  console.error(err);
                  reject(err);
                }
        
                const code = value.result;
                console.log("code>", code);
                resolve(code);
              };
        
              qrcode.decode(image.bitmap);
            });
          });
        }catch(err){
          console.log("err while decoding>", err);
          return null;
        }
      }
}

module.exports = Payment;