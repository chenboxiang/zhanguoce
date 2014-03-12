/**
 * Author: chenboxiang
 * Date: 14-1-21
 * Time: 上午11:52
 */
/**
 * Module dependencies.
 */
var constants = require("./lib/constants");
var express = require("express");
var http = require("http");
var path = require("path");
var _ = require("lodash");
var _s = require("underscore.string");
var config = require("./config/" + (process.env.NODE_ENV || "development"));
var logger = require("tracer").console(config.log);
var async = require("async");
var utils = require("./lib/utils");

// 全局对象
global.ZGC = {};
ZGC.logger = logger;

// -- 初始化数据库 -----------------------
var mysqlIsInit = false;
// TODO 需在测试环境确认mysql未启动的情况是否会报错
var initMysqlConnectionPool = function(callback) {
    var Dao = require("./lib/model/dao");
    config.db.pool.afterCreate = function(connection, cb) {
        if (!mysqlIsInit) {
            logger.info("Mysql connection pool init success!");
            mysqlIsInit = true;
            callback();
        }
        cb(null, connection);
    }
    var dao = Dao.init(_.extend({name: constants.DAO_INSTANCE_DEF}, config.db));
    ZGC.dao = dao;
}

// init app
var app = express();

// all environments
for (var attrName in config.express) {
    app.set(attrName, config.express[attrName]);
}
app.set("views", __dirname + "/view");

// -- 渲染引擎 -------------------------
// 注册全局 handlebars helpers
//var handlebars = require("handlebars");
//require("./lib/handlebars/index").registerHelpers(handlebars);
//express engine wrapper
//var ExpressHandlebars = require("./lib/handlebars/express_adapter");
//app.engine(".hbs", new ExpressHandlebars({
//    viewDir: app.get("views"),
//    autoReload: app.get("env") === "development"
//}).engine);
// ejs
var ExpressEjs = require("./lib/ejs/express_adapter");
app.engine(".ejs", new ExpressEjs({
    viewDir: app.get("views"),
    cache: app.get("env") !== "development",
    compileOptions: {
        compileDebug: false,
        debug: false,
        escape: function(html) {
            if (!html) {
                return "";
            }
            return String(html)
                .replace(/&(?!\w+;)/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
    },
    // 去多余空白符
    strip: true
}).engine)

// -- 设置中间件 -------------------------
var useMiddlewares = function(callback) {
    app.use(express.responseTime());
    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    app.use("/public", express.static(path.join(__dirname, "public")));
    app.use(express.logger({
        stream: {
            write: function(message) {
                logger.debug(message);
            }
        }
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    // 用redis来存储session
    var RedisStore = require("connect-redis")(express);
    var redisStore = new RedisStore(config.session.redisStore);
    redisStore.on("connect", function() {
        logger.info("Redis store is connected!");
        callback(null);
    })
    redisStore.on("disconnect", function() {
        logger.error("Redis store is disconnected!");
        callback(new Error("Redis store is disconnected!"));
    })
    app.use(express.session({
        store: redisStore,
        secret: config.session.secret
    }))
    // render时将设置上request
    app.use(function(request, response, next) {
        var render = response.render;
        response.render = function(view, options, fn) {
            options = options || {};
            options.request = request;
            render.call(response, view, options, fn);
        }
        next();
    })
    app.use(app.router);
    // development only
    if (app.get("env") === "development") {
        app.use(express.errorHandler());
    }
}

// -- 加载路由配置信息 -------------------------
var loadRoutes = function(callback) {
    var paths = utils.getFilePathsSync(path.join(__dirname, "controller"), function(path, stats) {
        return _s.endsWith(path, ".js") && stats.isFile();
    });
    logger.info("controllers:\n", paths.join("\n "));
    paths.forEach(function(path) {
        require(path)(app);
    });
    callback();
}

// -- 启动服务器 -------------------------
async.parallel(
    [initMysqlConnectionPool, useMiddlewares, loadRoutes],
    function(err, results) {
        if (!err) {
            var server = http.createServer(app);
            server.listen(app.get("port"), function() {
                logger.info("Express server listening on port " + app.get("port"));
            });

        } else {
            throw err;
        }
    }
);