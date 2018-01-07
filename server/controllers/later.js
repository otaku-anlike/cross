const binance = require('../utils/node-binance-api.js');
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
const sqlUtil = require('../utils/sqlUtil.js')
const async = require('async')
const later = require('later');
const schedule = require("node-schedule");

const exchange = 'binance'
const period = '1h'
const loop = 'every 10 mins'

binance.options({
  'APIKEY': '<api key>',
  'APISECRET': '<api secret>'
});

later.date.localTime();

function test(val, interval) {
  console.log(new Date());
  console.log(val);
  
  var sql = sqlUtil.select_schedule(exchange, period);
  mysqlUtil.query(sql, function (data) {
    if (data[0].status == 0) {
      interval.clear();
    }
    console.log(data)
  });

  try {
    insertDb();
  } catch (e) {
    console.log('\r\n', e, '\r\n', e.stack);
    try {
      res.end(e.stack);
    } catch (e) { }
  }
  
}

function testDb() {
  var datetime = parser.formatTime(Date.now());
  var sql = "UPDATE `macd_cross` SET `time`='" + datetime + "' WHERE id=248";
  mysqlUtil.query(sql, function (data) {
    console.log(data)
  });
}

function insertDb() {

  var datetime = parser.formatTime(Date.now());
  var sql_schedule = sqlUtil.update_schedule_lasttime(datetime, 1, exchange, period);
  mysqlUtil.query(sql_schedule, function (data) {
    console.log(data)
  });

  mysqlUtil.query(sqlUtil.select_symbols(exchange), function (data) {
  async.eachSeries(data, function (item, callback) {
    //  for (var item in data) {
    var symbol = item.symbol;
    binance.candlesticks(symbol, period, function (ticks) {
      // console.log("candlesticks()", ticks);
      // let last_tick = ticks[ticks.length - 1];
      var kLinesData = parser.parseKLinesData(ticks)
      var length = kLinesData.length;
      var macdData = quota.macd(kLinesData)
      var type = quota.cross(kLinesData, macdData)
      // console.log(macdData);
      // var datetime = parser.formatTime(kLinesData[length - 1].closeTime);
      //var datetime = parser.formatTime(Date.now());
      // 2金叉 or 4死叉
      if ('2' == type || '4' == type) {
        // datetime = parser.formatTime(kLinesData[length - 1].time);

        var sql_history = sqlUtil.select_macd_cross_history(exchange, symbol, type);

        mysqlUtil.query(sql_history, function (data) {
          if (data == undefined || data.length == 0) {
            sql_history = sqlUtil.insert_macd_cross_history(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
            mysqlUtil.query(sql_history, function (data) {
              console.log(data)
            });
          } else {
            sql_history = sqlUtil.update_macd_cross_history(kLinesData[length - 1].close, datetime, data[0].id);
            mysqlUtil.query(sql_history, function (data) {
              console.log(data)
            });
          }
        });
      }

      var sql = sqlUtil.select_macd_cross(exchange, symbol, type, period);

      mysqlUtil.query(sql, function (data) {
        if (data == undefined || data.length == 0) {
          sql = sqlUtil.insert_macd_cross(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
          mysqlUtil.query(sql, function (data) {
            console.log(data)
          });
        } else {
          sql = sqlUtil.update_macd_cross(type, kLinesData[length - 1].close, datetime, data[0].id);
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
}

/**
 * 响应 GET 请求（响应微信配置时的签名检查请求）
 */
async function start(ctx, next) {
  console.log('开启定时任务:[' + exchange + ',' + period + + '] ' + "Now:" + new Date())
  var sched = later.parse.text(loop),
  // var sched = later.parse.recur().every(2).second(),
    interval = later.setInterval(function () {
      test(Math.random(10), interval);
    }, sched);
}

async function end(ctx, next) {
  console.log('关闭定时任务:[' + exchange + ',' + period + '] ' + "Now:" + new Date())
  var sql = sqlUtil.update_schedule(0, exchange, period);
  mysqlUtil.query(sql, function (data) {
    console.log(data)
  });
}

module.exports = {
  start,end
}