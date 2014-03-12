/**
 * Author: chenboxiang
 * Date: 14-1-26
 * Time: 下午2:38
 */
"use strict";

var constants = require("../lib/constants");
var dao = ZGC.dao;
var logger = ZGC.logger;
var async = require("async");

module.exports = function(app) {
    app.get("/", function(request, response) {
        dao.max(dao("user"), "id", function(err, count) {
            logger.info(count);
            response.render("index", {
                count: count
            });
        });
    })
}