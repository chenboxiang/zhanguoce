"use strict";

var path = require('path');
var fs = require('fs');

exports.registerHelpers = function (Handlebars) {

    var cwd = path.join.bind(null, __dirname, 'helper');

    function registerHelper(file) {
        var helper = require(file);
        helper.register(Handlebars);
    }

    /**
     * Register local helpers
     */
    var helperFiles = fs.readdirSync(cwd());

    // Load local helpers.
    helperFiles.map(function (file) {
        registerHelper(cwd(file));
    });
};
