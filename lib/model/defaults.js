/**
 * Author: chenboxiang
 * Date: 14-1-30
 * Time: 下午2:18
 */
"use strict";

var handlebars = require("handlebars");

var validatorMessages = {
    "notNull": handlebars.compile("This parameter '{{{name}}}' can not be null"),
    "notEmpty": handlebars.compile("This parameter '{{{name}}}' can not be empty"),
    "email": handlebars.compile("This parameter '{{{name}}}:{{{value}}}' is a invalid email"),
    "URL": handlebars.compile("This parameter '{{{name}}}:{{{value}}}' is a invalid URL"),
    "IP": handlebars.compile("This parameter '{{{name}}}:{{{value}}}' is a invalid IP"),
    "alpha": handlebars.compile("This parameter '{{{name}}}:{{{value}}}' is a invalid alpha")
}

validatorMessages.isEmail = validatorMessages.email;
validatorMessages.isURL = validatorMessages.URL;
validatorMessages.isIP = validatorMessages.IP;
validatorMessages.isAlpha = validatorMessages.alpha;

module.exports = {
    columns: {
        createTime: {},
        actionTime: {},
        action: {}
    },

    // 验证错误后的提示信息
    validatorMessages: validatorMessages
}