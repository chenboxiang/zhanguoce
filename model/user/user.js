/**
 * Author: chenboxiang
 * Date: 14-1-29
 * Time: 下午8:37
 */
"use strict";

var ModelFactory = require("../../lib/model/model_factory");

module.exports = ModelFactory("user", {
    email: {
        validation: ["notEmpty", "email"]
    },

    emailChecked: {},
});