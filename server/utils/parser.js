
var KLineData = require('../models/KLineData.js')

const formatTime = datetime => {
  var nowDate = new Date(datetime);
  return nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();
}

        // '1';//空仓等待'
        //2'金叉'
        //3'继续持有'
        //4'死叉'
const formatType = type => {
  if ('1' == type) {
    type = '空仓等待'
  } else if('2' == type) {
    type = '金叉'
  } else if ('3' == type) {
    type = '继续持有'
  } else if ('4' == type) {
    type = '死叉'
  } 
  return type;
}


// 解析k线数据
const parseKLinesData = array =>{
    var results = []
    for (var i = 0; i < array.length; i++) {
    // for (var i = array.length - 1; i >= 0; i--) {
      // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = item;
      var item = new KLineData(array[i][0], array[i][1], array[i][2], array[i][3], array[i][4], array[i][5], array[i][6], array[i][7], array[i][8], array[i][9], array[i][10], array[i][11])
        results.push(item)
    }
    return results
}


module.exports = {
     parseKLinesData,
     formatTime,
     formatType
}
