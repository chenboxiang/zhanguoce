/**
 * Author: chenboxiang
 * Date: 14-1-28
 * Time: 下午6:38
 */
"use strict";

var validator = require("../validator");
var constants = require("../constants");
var dao = require("./dao").getInstance(constants.DAO_INSTANCE_DEF);
var _ = require("lodash");
var _s = require("underscore.string");
var defaults = require("./defaults");
var handlebars = require("handlebars");
var utils = require("../utils");
var assert = require("../assert");
var defaultValidationMessage = handlebars.compile("This parameter '{{{name}}}:{{{value}}}' is invalid");

var defaultOptions = {
    includeDefaultColumns: true,
    includeIdColumn: true
}

/**
 * @param tableName
 * @param columns 格式: {columnName: column}
 *          column 格式: {type: "", validation: []}
 *            validation中单个元素 格式:
 *              {
 *                  constraint: "",  // 字段约束, 可为字符串或正则对象或验证函数，
 *                                   // 为字符串时会去查看看是否validator有对应的同名方法，会尝试找字符串原始值，
 *                                   // 以及is + _s.capitalize()之后的值，例如如果为email，则会尝试查找validator["email"]和validator["isEmail"]
 *                                   // 为正则对象时，则直接调用test方法验证
 *                  message: "" // 验证不过时的提示信息，可以为string或handlebars模板编译后的function
 *              }
 *              简化的格式:
 *                  "email"  等同于  {constraint: "email"}
 * @param options
 * @returns {Model}
 * @constructor
 */
var ModelFactory = function(tableName, columns, options) {
    options = _.extend({}, defaultOptions, options);
    if (!tableName) {
        throw new Error("The table name must be specified");
    }
    if (!columns) {
        throw new Error("The columns must be specified");
    }
    columns = _.cloneDeep(columns);
    if (options.includeIdColumn) {
        _.extend(columns, {
            id: {
                primaryKey: true,
                auto: true
            }
        })
    }
    if (options.includeDefaultColumns) {
        _.extend(columns, defaults.columns);
    }
    var primaryKey = [];
    for (var name in columns) {
        var column = columns[name];
        if (column.primaryKey) {
            primaryKey.push(name);
        }
    }
    if (primaryKey.length === 0) {
        throw new Error("The primary key must be specified");
    }

    fixValidate(columns);

    var Model = function(attrs) {
        this.attrs = attrs;
    }

    // -- static methods and properties ---------------

    Object.defineProperties(Model, {
        "tableName": {
            writable: false,
            value: tableName
        },
        "primaryKey": {
            writable: false,
            value: primaryKey
        },
        "dao": {
            writable: false,
            value: dao
        }
    })

    _.extend(Model, {
        getColumns: function() {
            return _.cloneDeep(columns);
        },

        validate: function(attrs, attrNames) {
            var errorMessages = [];
            if (_.isEmpty(attrs)) {
                errorMessages.push("parameters is empty");

            } else {
                if (attrNames && !_.isArray(attrNames)) {
                    attrNames = [attrNames];
                }
                var validationColumns;
                if (attrNames) {
                    validationColumns = _.pick(columns, attrNames);

                } else {
                    validationColumns = columns;
                }
                _.each(validationColumns, function(column, colName) {
                    var validation = column.validation;
                    if (_.isArray(validation) && validation.length > 0) {
                        _.each(validation, function(v) {
                            if (v.constraint) {
                                if (!v.constraint(attrs[colName])) {
                                    var message;
                                    if (_.isFunction(v.message)) {
                                        message = v.message({
                                            name: colName,
                                            value: attrs[colName]
                                        });

                                    } else {
                                        message = v.message;
                                    }
                                    errorMessages.push(message);
                                }
                            }
                        });
                    }
                });
            }

            if (errorMessages.length > 0) {
                utils.throwError("400", errorMessages);
            }
        },

        insert: function(attrs, callback) {
            assert.notEmpty(attrs);
            // set default attr
            if ("action" in columns) {
                var nattrs = attrs;
                if (!_.isArray(nattrs)) {
                    nattrs = [attrs];
                }
                var now = new Date().getTime();
                nattrs.forEach(function(as) {
                    as.action = constants.ACTION_INSERT;
                    as.createTime = now;
                    as.actionTime = now;
                })
            }
            dao.insert(Model.tableName, attrs, callback);
        },

        /**
         * @param attrs
         * @param {String|Object|Builder} builder
         *      String: 当作primary key处理
         *      Object: 传给where函数构建出builder
         * @param callback
         */
        update: function(attrs, builder, callback) {
            assert.notEmpty(attrs);
            // set default attr
            if ("action" in columns) {
                var nattrs = attrs;
                if (!_.isArray(nattrs)) {
                    nattrs = [attrs];
                }
                var now = new Date().getTime();
                nattrs.forEach(function(as) {
                    as.action = constants.ACTION_UPDATE;
                    as.actionTime = now;
                })
            }
            builder = Model._fixBuilder(builder);
            dao.update(builder, attrs, callback);
        },

        /**
         * @param {String|Object|Builder} builder
         *      String: 当作primary key处理
         *      Object: 传给where函数构建出builder
         * @param callback
         */
        del: function(builder, callback) {
            assert.notEmpty(builder);
            builder = Model._fixBuilder(builder);
            dao.del(builder, callback);
        },

        select: function(builder, callback) {
            assert.notEmpty(builder);
            builder = Model._fixBuilder(builder);
            dao.select(builder, callback);
        },

        /**
         *
         * @param {String|Object|Builder|Array} builder
         *      String: 当作primary key处理
         *      Object: 传给where函数构建出builder
         *      Array: 每个元素为{column: "id", operator: "=", value: 1}
         * @returns {*}
         * @private
         */
        _fixBuilder: function(builder) {
            if (_.isString(builder) || _.isNumber(builder)) {
                // primary key只能为1个
                assert.isTrue(Model.primaryKey.length === 1, "Number of primary key is more than one");
                builder = dao(Model.tableName).where(Model.primaryKey[0], builder);

            } else if (_.isPlainObject(builder)) {
                builder = dao(Model.tableName).where(builder);

            } else if (_.isArray(builder)) {
                var wheres = builder;
                builder = dao(Model.tableName);
                wheres.forEach(function(where) {
                    builder.where(where.column, where.operator, where.value);
                });

            } else {
                builder = builder.from(Model.tableName);
            }
            return builder;
        }
    })

    var methods = "count min max sum avg".split(" ");
    methods.forEach(function(method) {
        Model[method] = function(builder, column, callback) {
            assert.notEmpty(builder);
            builder = Model._fixBuilder(builder);
            dao[method](builder, column, callback);
        }
    })

    // -- instance methods and properties --------------

    Model.prototype = {
        /**
         * @param attrNames 指定要验证的属性，不传则验证所有
         * @returns {*}
         */
        validate: function(attrNames) {
            return Model.validation.apply(Model, attrNames);
        },

        insert: function(callback) {
            return Model.insert(this.attrs, callback);
        },

        update: function(builder, callback) {
            return Model.update(this.attrs, builder, callback);
        },

        /**
         * @returns {*}
         */
        del: function(callback) {
            return Model.del(this.attrs, callback);
        }
    }

    return Model;
}

/**
 * 将columns中的validate统一处理下，加快后续验证的处理速度
 * @param columns
 */
var fixValidate = function(columns) {
    _.each(columns, function(column) {
        var validation = column.validation;
        if (!_.isEmpty(validation)) {
            if (!_.isArray(validation)) {
                validation = [validation];
            }
            var fixedValidation = [];
            _.each(validation, function(v) {
                if (!_.isPlainObject(v)) {
                    v = {constraint: v};
                }

                fixConstraintAndMessage(v);
                fixedValidation.push(v);
            })
            column.validation = fixedValidation;

        } else {
            delete column.validation;
        }
    });
}

/**
 * 将验证的字符串转换为function
 * @param constraint
 */
var fixConstraintAndMessage = function(validation) {
    var constraint = validation.constraint;
    if (!_.isFunction(constraint)) {
        if (_.isRegExp(constraint)) {
            validation.constraint = function(v) {
                return constraint.test(v);
            }

        } else {
            var fnName = constraint;
            var fn = validator[fnName];
            if (_.isFunction(fn)) {
                validation.constraint = fn;

            } else {
                fnName = "is" + _s.capitalize(constraint);
                fn = validator[fnName];
                if (_.isFunction(fn)) {
                    validation.constraint = fn;

                } else {
                    throw new Error("This constraint string '" + constraint + "' can not convert to validator function");
                }
            }

            if (!validation.message) {
                validation.message = defaults.validatorMessages[fnName];
            }
        }
    }

    if (!validation.message) {
        validation.message = defaultValidationMessage;
    }
}

module.exports = ModelFactory;