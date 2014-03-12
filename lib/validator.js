/**
 * Author: chenboxiang
 * Date: 14-1-30
 * Time: 下午2:38
 */
"use strict";

var _ = require("lodash");
var validator = _.extend({}, require("validator"), {
    isNull: function(obj) {
        return obj === null || obj === undefined;
    },

    notNull: function(obj) {
        return !validator.isNull(obj);
    },

    /**
     * @see _.isEmpty
     * @param obj
     */
    isEmpty: function(obj) {
        return _.isEmpty(obj);
    },

    notEmpty: function(obj) {
        return !_.isEmpty(obj);
    }
});

module.exports = validator;