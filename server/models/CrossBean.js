
function CrossBean(exchange, symbol, type, price, baseprice, time) {
  this.exchange = exchange,
    this.symbol = symbol,
    this.type = type,
    this.price = price,
    this.baseprice = baseprice,
    this.time = time
}

module.exports = CrossBean
