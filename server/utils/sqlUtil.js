

const select_symbols = exchange => {
  return "SELECT * FROM symbols WHERE exchange = '" + exchange + "'";
}

const select_list_macd_cross = exchange => {
  return "SELECT * FROM macd_cross";
}

const select_macd_cross = (exchange, symbol, type, period) => {
  return "SELECT * FROM macd_cross WHERE exchange = '" + exchange + "' AND symbol = '" + symbol + "' AND type = '" + type + "' AND period = '" + period + "'";
}

const insert_macd_cross = (exchange, symbol, type, price, period, time) => {
  return "INSERT INTO macd_cross(`exchange`, `symbol`, `type`, `price`, `period`,`time`) VALUES ('" + exchange + "','" + symbol + "','" + type + "'," + price + ",'" + period + "','" + time + "')";
}

const update_macd_cross = (type, price, time, id) => {
  return "UPDATE `macd_cross` SET `type`='" + type + "',`price`=" + price + ",`time`='" + time + "' WHERE id=" + id;
}

const select_macd_cross_history = (exchange, symbol, type, period) => {
  return "SELECT * FROM macd_cross_history WHERE exchange = '" + exchange + "' AND symbol = '" + symbol + "' AND type = '" + type + "' AND period = '" + period + "'";
}

const insert_macd_cross_history = (exchange, symbol, type, price, period, time) => {
  return "INSERT INTO macd_cross_history (`exchange`, `symbol`, `type`, `price`, `period`,`time`) VALUES ('" + exchange + "','" + symbol + "','" + type + "'," + price + ",'" + period + "','" + time + "')";
}

const update_macd_cross_history = (price, time, id) => {
  return "UPDATE `macd_cross_history` SET `price`=" + price + ",`time`='" + time + "' WHERE id=" + id;
}

const select_schedule = (exchange, period) => {
  return "SELECT * FROM schedule WHERE exchange = '" + exchange + "' AND period = '" + period + "'";
}

const update_schedule = (status, exchange, period) => {
  return "UPDATE `schedule` SET `status`=" + status + " WHERE exchange = '" + exchange + "' AND period = '" + period + "'";
}

const update_schedule_lasttime = (lasttime, status, exchange, period) => {
  return "UPDATE `schedule` SET `lasttime`='" + lasttime + "', `status`=" + status + " WHERE exchange = '" + exchange + "' AND period = '" + period + "'";
}

module.exports = {
  select_symbols,
  select_macd_cross,
  insert_macd_cross,
  update_macd_cross,
  select_macd_cross_history,
  insert_macd_cross_history,
  update_macd_cross_history,
  select_schedule,
  update_schedule,
  update_schedule_lasttime,
  select_list_macd_cross
}
