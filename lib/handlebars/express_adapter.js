/**
 * Author: chenboxiang
 * Date: 14-1-25
 * Time: 下午3:15
 * express wrapper
 */
"use strict";

var handlebars = require("handlebars");
var _ = require("lodash");
var _s = require("underscore.string");
var fs = require("fs");
var utils = require("../utils");
var path = require("path");
var logger = ZGC.logger;

function ExpressHandlebars(config) {
    // 模板文件名后缀
    this.ext = config.ext || ".hbs";

    // view目录
    this.viewDir = config.viewDir;

    // 布局文件目录(relative to view dir)
    this.layoutDir = config.layoutDir || "layout";
    // absolute path
    this.layoutDir = path.join(this.viewDir, this.layoutDir);

    // sub template目录(relative to view dir)
    this.partialDir = config.partialDir || "partial";
    // absolute path
    this.partialDir = path.join(this.viewDir, this.partialDir);

    // 是否自动重载变更的模板，开启此项会损耗性能，一般在开发环境使用
    this.autoReload = !!config.autoReload;
    if (this.autoReload) {
        this._watchTemplatesAndReload();
    }

    // 缓存templates
    this.templates = {};

    this._registerPartials();

    this.engine = this.render.bind(this);
}

_.extend(ExpressHandlebars.prototype, {
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
        if (template) {
            callback(null, template(options));

        } else {
            fs.readFile(viewPath, {encoding: "utf8"}, function(err, td) {
                var data = null;
                if (!err) {
                    template = handlebars.compile(td);
                    self.templates[tk] = template;
                    data = template(options);
                }
                callback(err, data);
            })
        }
    },

    /**
     * 注册所有的partials和layouts
     * @private
     */
    _registerPartials: function() {
        var self = this;

        // 获取所有partials和layouts并注册
        var paths = utils.getFilePathsSync([this.layoutDir, this.partialDir], function(filePath, stats) {
            return _s.endsWith(filePath, self.ext) && stats.isFile();
        });
        logger.info("partials and layouts: ", paths.join("\n"));
        paths.forEach(function(p) {
            var data = fs.readFileSync(p, {
                encoding: "utf8"
            });
            var name = self._generateTemplateKey(p);
            var template = handlebars.compile(data);
            self.templates[name] = template;
            handlebars.registerPartial(name, template);
        })
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
    },

    /**
     * 监听view目录，有template变更或新增则更新缓存
     * @private
     */
    _watchTemplatesAndReload: function() {
        var self = this;
        var chokidar = require("chokidar");
        var watcher = chokidar.watch(this.viewDir, {
            ignored: /[\/\\]\./,
            persistent: true
        })

        watcher.on("add", function(path) {
            logger.debug("A file has been added, the path is: ", path);
            self._loadTemplate(path);

        }).on("unlink", function(path) {
            logger.debug("A file has been deleted, the path is: ", path);
            self._deleteTemplate(path);

        }).on("change", function(path) {
            logger.debug("A file has been changed, the path is: ", path);
            self._loadTemplate(path);

        }).on("error", function(error) {
            logger.error("A file watch occurs errors, the error is: ", error);
        })

        logger.info("templates watcher has started.");
    },

    /**
     * 加载模板
     * @param {String} path 模板的完整路径
     * @param {Function} callback
     * @private
     */
    _loadTemplate: function(path) {
        var self = this;

        fs.readFile(path, {encoding: "utf8"}, function(err, data) {
            if (!err) {
                var template = handlebars.compile(data);
                self.templates[self._generateTemplateKey(path)] = template;
            }
        })
    },

    /**
     * 删除模板
     * @param {String} path 模板的完成路径
     * @private
     */
    _deleteTemplate: function(path) {
        this.templates[this._generateTemplateKey(path)] = undefined;
    }
})

module.exports = ExpressHandlebars;
