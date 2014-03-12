var _ = require("lodash");
var baseConfig = require("./base");

var config = _.extend({}, baseConfig, {
    log: {
        format: [
            "{{timestamp}} <{{title}}> {{file}}:{{line}} {{message}}", //default format
            {
                error: "{{timestamp}} <{{title}}> {{file}}:{{line}} {{message}} \nCall Stack:\n{{stack}}" // error format
            }
        ],
        dateformat: "yyyy-mm-dd HH:MM:ss.l",
        level: "debug"
    },

    db: {
        client: "mysql",
        connection: {
            host: "127.0.0.1",
            port: "3306",
            user: "root",
            password: "",
            database: "zhanguoce",
            // When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option
            supportBigNumbers: true,
            // Enabling both supportBigNumbers and bigNumberStrings forces big numbers (BIGINT and DECIMAL columns)
            // to be always returned as JavaScript String objects (Default: false).
            // Enabling supportBigNumbers but leaving bigNumberStrings disabled will return big numbers as String objects
            // only when they cannot be accurately represented with JavaScript Number objects (which happens when they exceed the [-2^53, +2^53] range),
            // otherwise they will be returned as Number objects. This option is ignored if supportBigNumbers is disabled
            bigNumberStrings: true,
            debug: false
        },
        pool: {
            min: 2,
            max: 50,
            // boolean that specifies whether idle resources at or below the min threshold
            // should be destroyed/re-created.  optional (default=true)
            refreshIdle: true,
            // max milliseconds a resource can go unused before it should be destroyed
            // (default 30000)
            idleTimeoutMillis: 60 * 60 * 1000,
            // frequency to check for idle resources (default 1000)
            reapIntervalMillis: 60 * 1000,
            // true/false or function -
            // If a log is a function, it will be called with two parameters:
            //   - log string
            //   - log level ('verbose', 'info', 'warn', 'error')
            // Else if log is true, verbose log info will be sent to console.log()
            // Else internal log messages be ignored (this is the default)
            log: false
        },
        debug: true
    },

    express: {
        "port": 3000,
        // 返回浏览器的请求头中是否包含 x-powered-by=express;
        "x-powered-by": true,
        // 默认的渲染引擎
        "view engine": "ejs",
        // 是否缓存视图
        "view cache": false
    }
});

module.exports = config;