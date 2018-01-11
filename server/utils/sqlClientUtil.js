

const select_list_symbols = exchange => {
  return "SELECT * FROM symbols WHERE symbol LIKE '%BTC%' AND exchange = '" + exchange + "'    order by symbol";
}

const select_macd_cross_bysymbol = (exchange, symbol) => {
  return "SELECT * FROM macd_cross WHERE exchange = '" + exchange + "' AND symbol = '" + symbol + "'  order by period";
}


module.exports = {
  select_list_symbols,
  select_macd_cross_bysymbol
}
