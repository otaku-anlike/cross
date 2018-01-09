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

function task(exchange, period, interval) {
  
  var sql = sqlUtil.select_schedule(exchange, period);
  console.log(sql)
  mysqlUtil.query(sql, function (data) {
    if (data[0].status == 0) {
      interval.clear();
    }
    console.log(data)
  });

  try {
    insertDb(exchange, period);
  } catch (e) {
    console.log('\r\n', e, '\r\n', e.stack);
    try {
      res.end(e.stack);
    } catch (e) { }
  }
}

function task_price(exchange, period, interval) {

  var sql = sqlUtil.select_schedule(exchange, period);
  console.log(sql)
  mysqlUtil.query(sql, function (data) {
    if (data[0].status == 0) {
      interval.clear();
    }
    console.log(data)
  });

  try {
    insertDbPrice(exchange);
  } catch (e) {
    console.log('\r\n', e, '\r\n', e.stack);
    try {
      res.end(e.stack);
    } catch (e) { }
  }
}

// function testDb() {
//   var datetime = parser.formatTime(Date.now());
//   var sql = "UPDATE `macd_cross` SET `time`='" + datetime + "' WHERE id=248";
//   mysqlUtil.query(sql, function (data) {
//     // console.log(data)
//   });
// }

function getLastPrice(exchange, symbol, price, datetime) {
      var sql = sqlUtil.select_symbols(exchange, symbol);
      // console.log(sql)
      mysqlUtil.query(sql, function (data) {
        if (data == undefined || data.length == 0) {
          sql = sqlUtil.insert_symbols(exchange, symbol, price, datetime);
          // console.log(sql)
          mysqlUtil.query(sql, function (data) {
            // console.log(data)
          });
        } else {
          sql = sqlUtil.update_symbols(price, datetime, data[0].id);
          // console.log(sql)
          mysqlUtil.query(sql, function (data) {
            // console.log(data)
          });
        }
      });
}

function getCandlesticks(exchange, symbol, period) {
  binance.candlesticks(symbol, period, function (ticks) {
    var datetime = parser.formatTime(Date.now());
    console.log('调K线api start:[' + symbol + ',' + period + '] ' + "Now:" + new Date())
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

      var sql_history = sqlUtil.select_macd_cross_history(exchange, symbol, type, period);
      // console.log(sql_history)
      mysqlUtil.query(sql_history, function (data) {
        if (data == undefined || data.length == 0) {
          sql_history = sqlUtil.insert_macd_cross_history(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
          // console.log(sql_history)
          mysqlUtil.query(sql_history, function (data) {
            // console.log(data)
          });
        } else {
          sql_history = sqlUtil.update_macd_cross_history(kLinesData[length - 1].close, datetime, data[0].id);
          // console.log(sql_history)
          mysqlUtil.query(sql_history, function (data) {
            // console.log(data)
          });
        }
      });
    }

    var sql = sqlUtil.select_macd_cross(exchange, symbol, period);
    // console.log(sql)
    mysqlUtil.query(sql, function (data) {
      if (data == undefined || data.length == 0) {
        sql = sqlUtil.insert_macd_cross(exchange, symbol, type, kLinesData[length - 1].close, period, datetime);
        // console.log(sql)
        mysqlUtil.query(sql, function (data) {
          // console.log(data)
        });
      } else {
        sql = sqlUtil.update_macd_cross(type, kLinesData[length - 1].close, datetime, data[0].id);
        // console.log(sql)
        mysqlUtil.query(sql, function (data) {
          // console.log(data)
        });
      }
    });
  });
}

function insertDb(exchange, period) {
  
  mysqlUtil.query(sqlUtil.select_list_symbols(exchange), function (data) {
  async.eachSeries(data, function (item, callback) {
    var symbol = item.symbol;
    setTimeout(function () {
      getCandlesticks(exchange, symbol, period);
    }, 7000);  

    // 执行完成后也要调用callback，不需要参数
    callback();

  });
});
}

function insertDbPrice(exchange) {

  binance.prices(function (ticker) {
    var datetime = parser.formatTime(Date.now());
    console.log('调价格api start:[' + exchange + '] ' + "Now:" + new Date());
    var symbols = [];
    for (key in ticker) {
      symbols.push({
        'symbol': key,
        'price': ticker[key]
      });
    }
    async.eachSeries(symbols, function (item, callback) {

      getLastPrice(exchange, item.symbol, item.price, datetime);

      // 执行完成后也要调用callback，不需要参数
      callback();

    });
  });
}

/**
 * 响应 GET 请求（响应微信配置时的签名检查请求）
 */
async function start(ctx, next) {
  startInterval('binance', '1h', 'every 4 mins');
  startInterval('binance', '4h', 'every 7 mins');
  startIntervalPrice('binance', '1m', 'every 1 mins');
}

function startInterval(exchange, period, loop) {
  console.log('开启定时任务 start:[' + exchange + ',' + period + '] ' + "Now:" + new Date())
  var datetime = parser.formatTime(Date.now());
  var sql_schedule = sqlUtil.update_schedule_lasttime(datetime, 1, exchange, period);
  mysqlUtil.query(sql_schedule, function (data) {
    console.log('更新定时任务表:[' + exchange + ',' + period + '] ' + "Now:" + new Date())
    console.log(data)
  });
  var sched = later.parse.text(loop),
    // var sched = later.parse.recur().every(2).second(),
    interval = later.setInterval(function () {
      task(exchange, period, interval);
    }, sched);
}

function startIntervalPrice(exchange, period, loop) {
  console.log('开启定时任务 start:[' + exchange + ',' + period + ',' + loop + '] ' + "Now:" + new Date())
  var datetime = parser.formatTime(Date.now());
  var sql_schedule = sqlUtil.update_schedule_lasttime(datetime, 1, exchange, period);
  mysqlUtil.query(sql_schedule, function (data) {
    console.log('更新定时任务表 start:[' + exchange + ',' + period + ',' + loop + '] ' + "Now:" + new Date())
    console.log(data)
  });
  var sched = later.parse.text(loop),
    // var sched = later.parse.recur().every(2).second(),
    interval = later.setInterval(function () {
      task_price(exchange, period, interval);
    }, sched);
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
  endInterval('binance', '1m');
}

process.on('uncaughtException', function (err) {
  console.log(err);
  start();
});

module.exports = {
  start,end
}