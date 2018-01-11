
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
// const sqlUtil = require('../utils/sqlUtil.js')
const sqlClientUtil = require('../utils/sqlClientUtil.js')
const async = require('async')

function getDelayedData() {
  return new Promise(async resolve => {
    var sql = sqlClientUtil.select_list_symbols("binance");
    mysqlUtil.query(sql, function (data) {
        resolve(data); 
      });

  });
}

function getCrossData(symbol) {
  return new Promise(async resolve => {
    var sql = sqlClientUtil.select_macd_cross_bysymbol("binance", symbol);
    mysqlUtil.query(sql, function (data) {
      for (j in data) {
        let datetime = parser.formatTime(data[j].time);
        data[j].time = datetime;
        data[j].type = parser.formatType(data[j].type);
      }
      resolve(data);
    });
  });
}

async function list(ctx, next) {

  let result = await getDelayedData();
  for (index in result) {
    let cross = await getCrossData(result[index].symbol);
    result[index].cross = cross;
    result[index].time = parser.formatTime(result[index].time);
  }
  ctx.state.data = result;
}

module.exports = {
  list
}
