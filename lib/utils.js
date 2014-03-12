/**
 * Author: chenboxiang
 * Date: 14-1-28
 * Time: 下午6:53
 */
"use strict";

var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var _s = require("underscore.string");
var sql = require("./model/query");

module.exports = {

    /**
     * 获取满足条件condition的所有文件绝对路径的集合
     * @param {String|Array} dirs  directory or directorys
     * @param {Function} filter
     */
    getFilePathsSync: function(dirs, filter) {
        if (_.isString(dirs)) {
            dirs = [dirs];
        }
        var result = [];
        dirs.forEach(function(dir) {
            var paths = fs.readdirSync(dir);
            paths.forEach(function(p) {
                var absolutePath = path.join(dir, p);
                var stats = fs.lstatSync(absolutePath);

                if (!stats.isDirectory()) {
                    if (!_.isFunction(filter) || filter(absolutePath, stats)) {
                        result.push(absolutePath);
                    }

                } else {
                    result = result.concat(module.exports.getFilePathsSync(absolutePath, filter));
                }
            });
        })

        return result;
    },

    // The standard Backbone.js `extend` method, for some nice
    // "sugar" on proper prototypal inheritance.
    extend: function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    },

    throwError: function(code, message) {
        var error = new Error();
        if (!code) {
            code = "500";
        }
        if (_.isString(code)) {
            code = code + "";
        }
        error.code = code;
        error.message = message;
        throw error;
    },

    /**
     * 将req.query 转为数据库查询的where 列表
     * @param query
     * @param config
     * @returns {Array} [{
            name: "id",
            operator: "=",
            value: 1
        }]
     */
    queryToWheres: function(query, config) {
        return query.toWheres(query, config);
    },

    appendOrderByAndLimit: function(builder, query) {

    }
}