
var KLineData = require('../models/KLineData.js')

const formatTime = datetime => {
  var nowDate = new Date(datetime);
  return nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();
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
     formatTime
}
