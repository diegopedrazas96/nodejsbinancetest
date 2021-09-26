const express = require('express');
const requestify = require('requestify'); 
const cron = require('node-cron');
const app = express();

app.use(express.json());


var lstCurrency = [];
var lstHistCurrency = [];
var histCounter = 0;
// RUN TASK EVERY MINUTE
cron.schedule('* * * * *', () => {
    lstCurrency.forEach(element => {
        requestify.get('https://api3.binance.com/api/v3/avgPrice?symbol=' + element.symbol).then(function(response) {
        
        let resp = response.getBody();
        if(resp != null && resp != undefined){
            histCounter++;
            lstHistCurrency.push({id : histCounter,symbol : element.symbol,mins: resp.mins,price : parseFloat(resp.price), date : new Date() });
        }
                      
        });
    });
    console.log('Task Running Every Minute');
  });

// RUN TASK EVERY HOUR
/*cron.schedule('0 * * * *', () => {
    lstCurrency.forEach(element => {
        requestify.get('https://api3.binance.com/api/v3/avgPrice?symbol=' + element.symbol).then(function(response) {
        
        let resp = response.getBody();
        if(resp != null && resp != undefined){
            histCounter++;
            lstHistCurrency.push({id : histCounter,symbol : element.symbol,mins: resp.mins,price : resp.price });
        }
                      
        });
    });
    console.log('Task Running Every Hour');
  });*/

app.get('/', (req, res) => res.send('API RUNNING!'));


app.get('/average', (req, res) => {
    if(req.query.symbol == null){
        res.status(400).send('Symbol is required!');
        return;
    }
    if(req.query.lectures == null){
        res.status(400).send('Lectures is required!');
        return;
    }

    let lstHistory = lstHistCurrency.filter(curr => curr.symbol == req.query.symbol);
    let lectureNumber  = 0;
    let avg = 0;
    let sum = 0;
    if(lstHistory.length < parseInt(req.query.lectures)){
        sum = lstHistory.reduce((a, b) => +a + +b ['price'], 0);
        avg = (sum / lstHistory.length) || 0;
        lectureNumber = lstHistory.length;

    }else{
        const lastLectures = lstHistory.slice(-parseInt(req.query.lectures));
        sum = lastLectures.reduce((a, b) => +a + +b ['price'], 0);
        avg = (sum / lastLectures.length) || 0;
        lectureNumber = lastLectures.length;
    }
    
     res.send({average : avg,numberOfLectures: lectureNumber});
});

app.get('/history', (req, res) => {

    res.send({results : lstHistCurrency})
});
app.get('/pairs', (req, res) => {

    res.send({results : lstCurrency})
});
app.post('/pairs', (req,res) => {
    //console.log('Init')
    requestify.get('https://testnet.binancefuture.com/fapi/v1/ticker/price').then(function(response) {
        // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
        const lstBinanceCurrrency = response.getBody();
        const lstPairs = req.body;
        lstCurrency = [];       
        let counter  = 0;
        lstPairs.forEach(element => {

            lstBinanceCurrrency.forEach(elementBinance => {
                if(element == elementBinance.symbol){
                    counter ++;
                    let objCurrency = {
                        id: counter,
                        symbol : element
                    }
                    lstCurrency.push(objCurrency);
                } 
            });

        });
               
        res.send(lstCurrency);
    });

   
});


const port = 8000;
app.listen(port, () => {
  console.log('Listening on port ' + port);
});