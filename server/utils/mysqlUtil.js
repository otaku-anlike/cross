const { mysql: config } = require('../config')

var mysql = require('mysql');
var pool = mysql.createPool({
  // host: 'example.org',
  // user: 'bob',
  // password: 'secret',
  // database: 'my_db'
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.pass,
  database: config.db,
  charset: config.char,
  multipleStatements: true
});

//查询数据  
function query(sql, callback) {

  pool.getConnection(function (err, connection) {
    // Use the connection
    try {
      connection.query(sql, function (error, results, fields) {
        // And done with the connection.
        connection.release();
        // Handle error after the release.
        if (error) throw error;
        callback(results);
        // return results
        // Don't use the connection here, it has been returned to the pool.
      });
    }
    catch (err){
      connection.release();
    }
  });
}
module.exports = { query }