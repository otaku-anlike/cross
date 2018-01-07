const binance = require('../utils/node-binance-api.js');
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
const async = require('async')
const later = require('later');
const schedule = require("node-schedule");

const exchange = 'binance'

binance.options({
  'APIKEY': '<api key>',
  'APISECRET': '<api secret>'
});
var rule1 = new schedule.RecurrenceRule();
var times1 = [1, , 11, , 21, , 31, , 41, , 51, ];
rule1.second = times1;
var newYearJob;

async function post(ctx, next) {

  // Get market depth for a symbol
// binance.depth("SNMBTC", function(json) {
// 	console.log("market depth",json);
//   ctx.state.data = {
//     msg: json
//   }
// });
newYearJob = schedule.scheduleJob(rule1, function () {
var searchSql = "SELECT * FROM symbols WHERE exchange = '" + exchange + "'";
mysqlUtil.query(searchSql, function (data) {
  async.eachSeries(data, function (item, callback) {
  //  for (var item in data) {
     var symbol = item.symbol;
     binance.candlesticks(symbol, "1h", function (ticks) {
        // console.log("candlesticks()", ticks);
        // let last_tick = ticks[ticks.length - 1];
        var kLinesData = parser.parseKLinesData(ticks)
        var length = kLinesData.length;
        var macdData = quota.macd(kLinesData)
        var type = quota.cross(kLinesData, macdData)
        // console.log(macdData);
        // var datetime = parser.formatTime(kLinesData[length - 1].closeTime);
        var datetime = parser.formatTime(Date.now());

        var sql = "SELECT * FROM macd_cross WHERE exchange = '" + exchange + "' AND symbol = '" + symbol + "' AND type = '" + type + "'";

        mysqlUtil.query(sql, function (data) {
          if (data == undefined || data.length == 0) {
            sql = "INSERT INTO macd_cross(`exchange`, `symbol`, `type`, `price`, `baseprice`) VALUES ('" + exchange + "','" + symbol + "','" + type + "'," + kLinesData[length - 1].close + "," + 0 + ")";
            mysqlUtil.query(sql, function (data) {
              console.log(data)
            });
          } else {
            sql = "UPDATE `macd_cross` SET `type`='" + type + "',`price`=" + kLinesData[length - 1].close + ",`time`='" + datetime + "' WHERE id=" + data[0].id;
            mysqlUtil.query(sql, function (data) {
              console.log(data)
            });
          }
        });
      });
     // 执行完成后也要调用callback，不需要参数
     callback();
    });
  });
});
  // var kline = new Kline({
  //   element: "#kline_container",
  //   width: 1200,
  //   height: 650,
  //   theme: 'dark', // light/dark
  //   language: 'zh-cn', // zh-cn/en-us/zh-tw
  //   ranges: ["1w", "1d", "1h", "30m", "15m", "5m", "1m", "line"],
  //   symbol: "BTC",
  //   symbolName: "BTC/USD",
  //   type: "poll", // poll/socket
  //   url: "../utils/mock.json",
  //   limit: 1000,
  //   intervalTime: 5000,
  //   debug: true,
  //   showTrade: true,
  //   onResize: function (width, height) {
  //     console.log("chart resized: " + width + " " + height);
  //   }
  // });

  // kline.draw();
  // console.log(kline);
  ctx.state.data = {
    msg: '是时候表演真正的技术拉'
  }

  // binance.prices(await function (ticker) {
  //   console.log("prices()", ticker);
  //   console.log("Price of BNB: ", ticker.BNBBTC);
  //   ctx.state.data = {
  //     msg: ticker
  //   }
  // });

}

module.exports = {
  post
}
