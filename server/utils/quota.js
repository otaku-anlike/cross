var MacdBean = require('../models/MacdBean.js')



const macd = mChartData => {
  let [shortValue, longValue,  mValue] =[12,26,9];
  var emaShort = 0.0;
  var emaLong = 0.0;
  var dif = [];
  var dea = [];
  var macd = [];
  var length = mChartData.length;
  for (var i = 0; i < length; i++) {
    if (i == 0) {
      emaShort = mChartData[i].close;
      emaLong = mChartData[i].close;
      dif.push(0);
      dea.push(0);
      macd.push(0);
    } else {
      emaShort = (emaShort * (shortValue - 1) + mChartData[i].close * 2) / (shortValue + 1);
      emaLong = (emaLong * (longValue - 1) + mChartData[i].close * 2) / (longValue + 1);
      var _dif = emaShort - emaLong;
      var _dea = (dea[i-1] * (mValue - 1) + _dif * 2) / (mValue + 1);
      var _macd = (_dif - _dea) * 2;
      dif.push(_dif);
      dea.push(_dea);
      macd.push(_macd);
    }
  }

  // var last_macd = [];
  // last_macd.push(mChartData[length - 1].close);
  // last_macd.push(dif[length - 1]);
  // last_macd.push(dea[length - 1]);
  // last_macd.push(macd[length - 1]);
  // last_macd.push(mChartData[length - 1].closeTime);
  // let [item_price, item_dif, item_dea, item_macd, item_closeTime] = last_macd;

  return new MacdBean(dif, dea, macd);

}

const cross = (mChartData, macdBean) => {
  var result = '1';//空仓等待';
  // var macd = TA.MACD(records,12,26,9);//调用指标函数， 参数为MACD 默认的参数。
  // var output = kline.chartMgr._indic._outputs;
  var dif = macdBean.dif; //dif线
  var dea = macdBean.dea; //dea线
  var column = macdBean.column; // MACD柱
  var len = mChartData.length; //K线周期长度
  // if( (dif[len-1] > 0 && dea[len-1] > 0) && dif[len-1] > dea[len-1] && dif[len-2] < dea[len-2] && column[len-1] > 0.2 ){
  if (dif[len - 1] > dea[len - 1] && dif[len - 2] < dea[len - 2]) {
    //判断金叉条件：dif 与 dea 此刻均大于0 ， 且dif由下上穿dea ， 且 MACD量柱大于0.2
    //            return 1; //返回1 代表 金叉信号。
    result = '2';//'金叉';
  }
  // if( (dif[len-1] < 0 && dea[len-1] < 0) && dif[len-1] < dea[len-1] && dif[len-2] > dea[len-2] && column[len-1] < -0.2 ){
  else if (dif[len - 1] < dea[len - 1] && dif[len - 2] > dea[len - 2]) {
    //判断死叉条件：
    //            return 2;//返回2 代表 死叉信号。
    result = '4';//'死叉';
  } else if (dif[len - 1] > dea[len - 1] && dif[len - 2] > dea[len - 2]) {
    //判断死叉条件：
    //            return 2;//返回2 代表 死叉信号。
    result = '3';//'继续持有';
  }

  return result;
}

module.exports = { macd, cross }
