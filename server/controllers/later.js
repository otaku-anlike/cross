const binance = require('../utils/node-binance-api.js');
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
const sqlUtil = require('../utils/sqlUtil.js')
const async = require('async')
const later = require('later');
const schedule = require("node-schedule");

// const exchange = 'binance'
// const period = '1h'
// const loop = 'every 10 mins'

binance.options({
  'APIKEY': '<api key>',
  'APISECRET': '<api secret>'
});

later.date.localTime();

function test(exchange, period, loop, interval) {
  
  var sql = sqlUtil.select_schedule(exchange, period);
  console.log(sql)
  mysqlUtil.query(sql, function (data) {
    if (data[0].status == 0) {
      interval.clear();
    }
    console.log(data)
  });

  try {
    insertDb(exchange, period, loop);
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
    // console.log(data)
  });
}

function insertDb(exchange, period, loop) {
  var datetime = parser.formatTime(Date.now());
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
        console.log(sql_history)
        mysqlUtil.query(sql_history, function (data) {
          if (data == undefined || data.length == 0) {
            sql_history = sqlUtil.insert_macd_cross_history(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
            console.log(sql_history)
            mysqlUtil.query(sql_history, function (data) {
              // console.log(data)
            });
          } else {
            sql_history = sqlUtil.update_macd_cross_history(kLinesData[length - 1].close, datetime, data[0].id);
            console.log(sql_history)
            mysqlUtil.query(sql_history, function (data) {
              // console.log(data)
            });
          }
        });
      }

      var sql = sqlUtil.select_macd_cross(exchange, symbol, type, period);
      console.log(sql)
      mysqlUtil.query(sql, function (data) {
        if (data == undefined || data.length == 0) {
          sql = sqlUtil.insert_macd_cross(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
          console.log(sql)
          mysqlUtil.query(sql, function (data) {
            // console.log(data)
          });
        } else {
          sql = sqlUtil.update_macd_cross(type, kLinesData[length - 1].close, datetime, data[0].id);
          console.log(sql)
          mysqlUtil.query(sql, function (data) {
            // console.log(data)
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
  startInterval('binance', '1h', 'every 3 mins');
  startInterval4h('binance', '4h', 'every 7 mins');
}

function startInterval(exchange, period, loop) {
  console.log('开启定时任务 start:[' + exchange + ',' + period + + '] ' + "Now:" + new Date())
  var datetime = parser.formatTime(Date.now());
  var sql_schedule = sqlUtil.update_schedule_lasttime(datetime, 1, exchange, period);
  mysqlUtil.query(sql_schedule, function (data) {
    console.log('更新定时任务表:[' + exchange + ',' + period + + '] ' + "Now:" + new Date())
    console.log(data)
  });
  var sched = later.parse.text(loop),
    // var sched = later.parse.recur().every(2).second(),
    interval = later.setInterval(function () {
      test(exchange, period, loop, interval);
    }, sched);
}

function startInterval4h(exchange, period, loop) {
  console.log('开启定时任务 start:[' + exchange + ',' + period + + '] ' + "Now:" + new Date())
  var datetime4h = parser.formatTime(Date.now());
  var sql_schedule4h = sqlUtil.update_schedule_lasttime(datetime4h, 1, exchange, period);
  mysqlUtil.query(sql_schedule4h, function (data) {
    console.log('更新定时任务表:[' + exchange + ',' + period + + '] ' + "Now:" + new Date())
    console.log(data)
  });
  var sched4h = later.parse.text(loop),
    // var sched = later.parse.recur().every(2).second(),
    interval4h = later.setInterval(function () {
      test(exchange, period, loop, interval4h);
    }, sched4h);
}


function endInterval(exchange, period) {
  console.log('关闭定时任务 start:[' + exchange + ',' + period + '] ' + "Now:" + new Date())
  var sql = sqlUtil.update_schedule(0, exchange, period);
  mysqlUtil.query(sql, function (data) {
    console.log('关闭定时任务 end:[' + exchange + ',' + period + '] ' + "Now:" + new Date())
    console.log(data)
  });
}

async function end(ctx, next) {
  endInterval('binance', '1h');
  endInterval('binance', '4h');
}

module.exports = {
  start,end
}