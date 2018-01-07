const { tunnel } = require('../qcloud')
const debug = require('debug')('koa-weapp-demo')


const binance = require('../utils/node-binance-api.js');
const Kline = require('../utils/kline.js');
const parser = require('../utils/parser.js')
const quota = require('../utils/quota.js')
const mysqlUtil = require('../utils/mysqlUtil.js')
const async = require('async')
const schedule = require("node-schedule");

const exchange = 'binance'

binance.options({
  'APIKEY': '<api key>',
  'APISECRET': '<api secret>'
});

/**
 * 这里实现一个简单的聊天室
 * userMap 为 tunnelId 和 用户信息的映射
 * 实际使用请使用数据库存储
 */
const userMap = {}

// 保存 当前已连接的 WebSocket 信道ID列表
const connectedTunnelIds = []

var rule1 = new schedule.RecurrenceRule();
var times1 = [1,  11,  21,  31,  41,  51,];
rule1.minute = times1;
var newYearJob;

/**
 * 调用 tunnel.broadcast() 进行广播
 * @param  {String} type    消息类型
 * @param  {String} content 消息内容
 */
const $broadcast = (type, content) => {
    tunnel.broadcast(connectedTunnelIds, type, content)
        .then(result => {
            const invalidTunnelIds = result.data && result.data.invalidTunnelIds || []

            if (invalidTunnelIds.length) {
                console.log('检测到无效的信道 IDs =>', invalidTunnelIds)

                // 从 userMap 和 connectedTunnelIds 中将无效的信道记录移除
                invalidTunnelIds.forEach(tunnelId => {
                    delete userMap[tunnelId]

                    const index = connectedTunnelIds.indexOf(tunnelId)
                    if (~index) {
                        connectedTunnelIds.splice(index, 1)
                    }
                })
            }
        })
}

/**
 * 调用 TunnelService.closeTunnel() 关闭信道
 * @param  {String} tunnelId 信道ID
 */
const $close = (tunnelId) => {
    tunnel.closeTunnel(tunnelId)
}

/**
 * 实现 onConnect 方法
 * 在客户端成功连接 WebSocket 信道服务之后会调用该方法，
 * 此时通知所有其它在线的用户当前总人数以及刚加入的用户是谁
 */
function onConnect (tunnelId) {
    console.log(`[onConnect] =>`, { tunnelId })

    if (tunnelId in userMap) {
        connectedTunnelIds.push(tunnelId)

        $broadcast('people', {
            'total': connectedTunnelIds.length,
            'enter': userMap[tunnelId]
        })
    } else {
        console.log(`Unknown tunnelId(${tunnelId}) was connectd, close it`)
        $close(tunnelId)
    }
}

/**
 * 实现 onMessage 方法
 * 客户端推送消息到 WebSocket 信道服务器上后，会调用该方法，此时可以处理信道的消息。
 * 在本示例，我们处理 `speak` 类型的消息，该消息表示有用户发言。
 * 我们把这个发言的信息广播到所有在线的 WebSocket 信道上
 */
function onMessage (tunnelId, type, content) {
    console.log(`[onMessage] =>`, { tunnelId, type, content })

    switch (type) {
        case 'speak':
            if (tunnelId in userMap) {

              newYearJob = schedule.scheduleJob(rule1, function () {
                var searchSql = "SELECT * FROM symbols WHERE exchange = '" + exchange + "'";
                mysqlUtil.query(searchSql, function (data) {
                  async.eachSeries(data, function (item, callback) {
                    //  for (var item in data) {
                    var symbol = item.symbol;
                    binance.candlesticks(symbol, "1h", function (ticks) {
                      // console.log("candlesticks()", ticks);
                      // let last_tick = ticks[ticks.length - 1];
                      var kLinesData = parser.parseKLinesData(ticks)
                      var length = kLinesData.length;
                      var macdData = quota.macd(kLinesData)
                      var type = quota.cross(kLinesData, macdData)
                      // console.log(macdData);
                      // var datetime = parser.formatTime(kLinesData[length - 1].closeTime);
                      var datetime = parser.formatTime(Date.now());

                      var sql = "SELECT * FROM macd_cross WHERE exchange = '" + exchange + "' AND symbol = '" + symbol + "' AND type = '" + type + "'";

                      mysqlUtil.query(sql, function (data) {
                        if (data == undefined || data.length == 0) {
                          sql = "INSERT INTO macd_cross(`exchange`, `symbol`, `type`, `price`, `baseprice`) VALUES ('" + exchange + "','" + symbol + "','" + type + "'," + kLinesData[length - 1].close + "," + 0 + ")";
                          mysqlUtil.query(sql, function (data) {
                            console.log(data)
                          });
                        } else {
                          sql = "UPDATE `macd_cross` SET `type`='" + type + "',`price`=" + kLinesData[length - 1].close + ",`time`='" + datetime + "' WHERE id=" + data[0].id;
                          mysqlUtil.query(sql, function (data) {
                            console.log(data)
                          });
                        }
                      });
                    });
                    // 执行完成后也要调用callback，不需要参数
                    callback();
                  });
                  $broadcast('speak', {
                    'who': userMap[tunnelId],
                    'word': data
                  })
                });
                
              });


              // newYearJob = schedule.scheduleJob(rule1, function () {
              // binance.websockets.candlesticks(['BNBBTC'], "1m", function (candlesticks) {
              //   console.log("candlesticks()", candlesticks);
              //   $broadcast('speak', {
              //     'who': userMap[tunnelId],
              //     'word': candlesticks
              //   })
              // });   
              // });  
            } else {
                $close(tunnelId)
            }
            break
      case 'cancle':
        newYearJob.cancel();
        $broadcast('speak', {
          'who': userMap[tunnelId],
          'word': 'cancle'+content.word
        })
        break
        default:
            break
    }
}

/**
 * 实现 onClose 方法
 * 客户端关闭 WebSocket 信道或者被信道服务器判断为已断开后，
 * 会调用该方法，此时可以进行清理及通知操作
 */
function onClose (tunnelId) {
    console.log(`[onClose] =>`, { tunnelId })

    if (!(tunnelId in userMap)) {
        console.log(`[onClose][Invalid TunnelId]=>`, tunnelId)
        $close(tunnelId)
        return
    }

    const leaveUser = userMap[tunnelId]
    delete userMap[tunnelId]

    const index = connectedTunnelIds.indexOf(tunnelId)
    if (~index) {
        connectedTunnelIds.splice(index, 1)
    }

    // 聊天室没有人了（即无信道ID）不再需要广播消息
    if (connectedTunnelIds.length > 0) {
        $broadcast('people', {
            'total': connectedTunnelIds.length,
            'leave': leaveUser
        })
    }
}

module.exports = {
    // 小程序请求 websocket 地址
    get: async ctx => {
        const data = await tunnel.getTunnelUrl(ctx.req)
        const tunnelInfo = data.tunnel

        userMap[tunnelInfo.tunnelId] = data.userinfo

        ctx.state.data = tunnelInfo
    },
    // 信道将信息传输过来的时候
    post: async ctx => {
        const packet = await tunnel.onTunnelMessage(ctx.request.body)

        debug('Tunnel recive a package: %o', packet)

        switch (packet.type) {
            case 'connect':
                onConnect(packet.tunnelId)
                break
            case 'message':
                onMessage(packet.tunnelId, packet.content.messageType, packet.content.messageContent)
                break
            case 'close':
                onClose(packet.tunnelId)
                break
        }
    }

}
