/**
 * Author: chenboxiang
 * Date: 14-2-24
 * Time: 下午2:03
 */
"use strict";

var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var logger = ZGC.logger;
var ejs = require("ejs-remix");

function ExpressEjs(config) {
    // 模板文件名后缀
    this.ext = config.ext || ".ejs";

    // view目录
    this.viewDir = config.viewDir;

    // compile options
    this.compileOptions = config.compileOptions || {};

    // 是否缓存模板
    this.cache = !!config.cache;
    // 缓存templates
    this.templates = {};

    // 是否去除标签间的空格
    this.strip = !!config.strip;
    if (this.strip) {
        var parse = ejs.parse;
        ejs.parse = function(str, options) {
            str = str.replace(/(<\/?[^<>]+>)\s+/g, "$1");

            return parse.apply(this, [str, options]);
        }
    }

    this.engine = this.render.bind(this);
}

_.extend(ExpressEjs.prototype, {
    /**
     * 提供给express用的渲染接口
     * @param {String} viewPath
     * @param {Object} options
     * @param {Function} callback
     */
    render: function(viewPath, options, callback) {
        var self = this;
        var tk = this._generateTemplateKey(viewPath);
        var template = this.templates[tk];
        options.__proto__ = options.locals;
        if (template) {
            callback(null, template.call(options.scope, options));

        } else {
            fs.readFile(viewPath, {encoding: "utf8"}, function(err, td) {
                var data = null;
                if (!err) {
                    template = ejs.compile(td, _.extend({filename: viewPath}, self.compileOptions));
                    if (self.cache) {
                        self.templates[tk] = template;
                    }
                    data = template.call(options.scope, options);
                }
                callback(err, data);
            })
        }
    },

    /**
     * 通过绝对路径生成template缓存的key，同时也是handlebars的 partial name
     * @param {String} absolutePath
     * @returns {String}
     * @private
     */
    _generateTemplateKey: function(absolutePath) {
        var key = path.relative(this.viewDir, absolutePath);
        // 去掉后缀
        key = key.substring(0, key.length - this.ext.length);

        return key;
    }
})

module.exports = ExpressEjs;