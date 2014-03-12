/**
 * Author: chenboxiang
 * Date: 14-1-24
 * Time: 下午5:41
 */

module.exports.register = function (Handlebars) {
    var helpers = {

        /**
         * Extend a layout that contains block definitions
         * @param  {String} layout  name of the layout to extend
         * @param  {Object} options normal handlebars options
         * @return {String}         rendered layout
         */
        extend: function (layout, options) {
            var context = Object.create(this || null);
            var template = Handlebars.partials[layout];

            if (typeof template === 'undefined') {
                throw new Error("Missing layout: '" + layout + "'");
            }

            if (typeof template === 'string') {
                template = Handlebars.compile(template);
            }

            // Parse blocks and discard output
            if (typeof options.fn === 'function') {
                options.fn(context);
            }

            return template(context);

        },


        /**
         * Used within layouts to define block sections
         * @param  {String} name    name of block to be referenced later
         * @param  {Object} options normal handlebars options
         * @return {String}         rendered block section
         */
        block: function (name, options) {
            this._blocks = this._blocks || {};
            var block = this._blocks[name];

            var optionsFn = options.fn || function () {
                return '';
            };

            switch (block && block.fn && block.mode.toLowerCase()) {
                case 'append':
                    return optionsFn(this) + block.fn(this);

                case 'prepend':
                    return block.fn(this) + optionsFn(this);

                case 'replace':
                    return block.fn(this);

                default:
                    return optionsFn(this);
            }
        },


        /**
         * Used within templates that extend a layout to define
         * content that will replace block sections
         * @param  {String} name    name of the block to replace
         * @param  {Object} options normal handlebars options
         * @return {String}         rendered content section
         */
        content: function (name, options) {
            options = options || {};
            options.hash = options.hash || {};
            var mode = options.hash['mode'] || 'replace';

            this._blocks = this._blocks || {};
            this._blocks[name] = {
                mode: mode.toLowerCase(),
                fn: options.fn
            };
        }

    };

    for (var helper in helpers) {
        if (helpers.hasOwnProperty(helper)) {
            Handlebars.registerHelper(helper, helpers[helper]);
        }
    }
};