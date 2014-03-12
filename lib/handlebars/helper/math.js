/**
 * Author: chenboxiang
 * Date: 14-1-24
 * Time: 下午5:44
 */
var _ = require("lodash");

var helpers = {

    add: function (value, addition) {
        return value + addition;
    },

    subtract: function (value, substraction) {
        return value - substraction;
    },

    divide: function (value, divisor) {
        return value / divisor;
    },

    multiply: function (value, multiplier) {
        return value * multiplier;
    },

    floor: function (value) {
        return Math.floor(value);
    },

    ceil: function (value) {
        return Math.ceil(value);
    },

    round: function (value) {
        return Math.round(value);
    },

    sum: function () {
        var args = _.flatten(arguments);
        var sum = 0;
        var i = args.length - 1;
        while (i--) {
            if ("number" === typeof args[i]) {
                sum += args[i];
            }
        }
        return Number(sum);
    }
};

// Export helpers
module.exports.register = function (Handlebars) {
    for (var helper in helpers) {
        if (helpers.hasOwnProperty(helper)) {
            Handlebars.registerHelper(helper, helpers[helper]);
        }
    }
};