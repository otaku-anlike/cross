
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
const sqlUtil = require('../utils/sqlUtil.js')
const async = require('async')

function getDelayedData() {
  return new Promise(async resolve => {
    var sql = sqlUtil.select_list_macd_cross("");
    mysqlUtil.query(sql, function (data) {
      resolve(data); 
      // ctx.state.data = data;
      // console.log(data)
    })
    
  });
}

async function list(ctx, next) {

  let result = await getDelayedData();
  ctx.state.data = result;
}

module.exports = {
  list
}
