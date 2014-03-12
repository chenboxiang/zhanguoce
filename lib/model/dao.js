/**
 * relational database client
 * Author: chenboxiang
 * Date: 14-1-28
 * Time: 下午4:56
 */
"use strict";

var path = require("path");
var Knex = require("knex");
var _ = require("lodash");
var logger = ZGC.logger;

var instances = {};

var defaultConfig = {

}

function Dao(config) {
    config = _.extend({}, defaultConfig, config);
    // dao的名称，用于支持多数据源
    var name = config.name;
    if (instances[name]) {
        return instances[name];
    }

    delete config.name;
    var knex = Knex.initialize(config);

    var dao = function(tableName) {
        return knex(tableName);
    }
    _.extend(dao, knex);

    dao.insert = function(tableName, obj, callback) {
        tableName = tableName || obj._tableName;
        dao(tableName).insert(obj).exec(function(err, result) {
            if (_.isArray(result) && result.length === 1) {
                // result id convert
                result = result[0];
            }
            callback(err, result);
        });
    }

    dao.update = function(builder, obj, callback) {
        builder.update(obj).exec(callback);
    }

    dao.del = function(builder, callback) {
        builder.del().exec(callback);
    }

    dao.select = function(builder, callback) {
        builder.select().exec(callback);
    }

    var methods = "count min max sum avg".split(" ");
    methods.forEach(function(method) {
        dao[method] = function(builder, column, callback) {
            if (_.isFunction(column)) {
                callback = column;
                column = "*";
            }
            builder[method](column + " as ret").exec(function(err, result) {
                if (result) {
                    result = result[0].ret;
                }
                callback(err, result);
            });
        }
    })


    // TODO 看看什么时候destroy比较好
//    dao.destroy = function() {
//        logger.info("--------destroy db pool start----------");
//        dao.client.pool.destroy(function() {
//            logger.info("--------destroy db pool end----------");
//        });
//    }

    // 需定期检查pool中connection是否可用，主要是解决mysql server超过超时时间（默认为8小时）断开连接时，不通知客户端的问题
    // 1小时发送1次sql，保证mysql server不断开连接
    setInterval(function() {
        dao.client.pool.poolInstance.availableObjects.forEach(function(objWithTimeout) {
            var connection = objWithTimeout.obj;
            connection.query("SELECT 1 + 1", function(err) {
                if (err) {
                    dao.client.pool.poolInstance.destroy(connection);
                }
            })
        })
    }, 60 * 60 * 1000);

    instances[name] = dao;

    return dao;
}

Dao.init = function(config) {
    return Dao(config);
}

Dao.getInstance = function(name) {
    return instances[name];
}

module.exports = Dao;