
function KLineData(time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored) {
  this.time = time
  this.open = open
  this.high = high
  this.low = low
  this.close = close
  this.volume = volume
  this.closeTime = closeTime
  this.assetVolume = assetVolume
  this.trades = trades
  this.buyBaseVolume = buyBaseVolume
  this.buyAssetVolume = buyAssetVolume
  this.ignored = ignored

  this.toString = function () {
    return '[time: ' + time + ', open: ' + open + ', high: ' + high + ', low: ' + low
      + ', close: ' + close + ', volume: ' + volume + ', closeTime: ' + closeTime + ', assetVolume: ' + assetVolume + ', trades: ' + trades + ', buyBaseVolume: ' + buyBaseVolume + ', buyAssetVolume: ' + buyAssetVolume + ', ignored: ' + ignored + ']'
  }
}

module.exports = KLineData
