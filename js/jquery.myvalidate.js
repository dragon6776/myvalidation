;( function( $, window, document, undefined ) {

    "use strict";

    var defaults = {
        rules: {},
        messages: {
            required: "This field is required.",
            email: "Please enter a valid email address.",
            number: "Please enter a valid number.",
            equalto: "Please enter the same value again.",
            minlength: "Please enter at least {0} characters.",
        }
    }

    function Validator(form, options){
        this.currentForm = form;

        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;

        this.init();
    }

    $.extend(Validator.prototype, {
        init: function(){
            $(this).attr( "novalidate", "novalidate" );
            this.isValid = true;
            this.firstInvalidElement = null;
            this.submitedElements = [];
            this.dataAttrs = ["required", "email", "number", "minlength", "equalto"];
            this.elements = this.getElements();
        },
        sanitizeElements: function(){
            // get error message from default or custom
            // change attribute to data-attribute
            // add error message data-attribute to input
            // sanitize all input element before check valid
            var validator = this;
            this.elements.each(function(){
                validator.addRuleDataAttrs(this);
            });
        },
        getErrorMessage: function (name, key, value){

            if (typeof this.settings !== "undefined" && 
                typeof this.settings.messages !== "undefined" && 
                this.settings.messages.hasOwnProperty(name))
            {
                // var x = this.settings.messages[name][key];
                var msg = this.settings.messages[name];

                return typeof msg === "string" ? msg : msg[key];

            } else {
                if(key === "minlength"){
                    return this.toString(this._defaults.messages[key], value);
                } else {
                    return this._defaults.messages[key];
                }

            }
        },
        addDataAttr: function ($input, attr, value){
            if(!$input.attr(attr)){
                $input.attr(attr, value);
            }
        },
        addDataMsgAttr: function(){

        },
        addRuleDataAttrs: function(input){

            var $input = $(input);
            var vldtr = this;

            // sanitize attributes (add prefix 'data-rule-')
            // ...

            // get element data rules attrs

            // override attributes if plugin options existed
            if(typeof this.settings !== "undefined" && this.settings.rules && this.settings.rules.hasOwnProperty(input.name)) {
                var obj = this.settings.rules[input.name];
                if(typeof obj === "string"){
                    // only "required" case
                    this.addDataAttr($input, "data-rule-" + obj, true);
                    this.addDataAttr($input, "data-msg-" + obj, this.getErrorMessage(input.name, obj));
                } else {
                    for (var prop in obj) {
                        if($.inArray(prop, this.dataAttrs) > -1){
                            if(prop === "required" || prop === "email"){
                                this.addDataAttr($input, "data-rule-" + prop, true);
                            } else {
                                this.addDataAttr($input, "data-rule-" + prop, obj[prop]);
                            }

                            // add data-msg
                            this.addDataAttr($input, "data-msg-" + prop, this.getErrorMessage(input.name, prop, obj[prop]));
                        }
                    }
                }
            } else {
                // add data-msg when data-rule existed
                $.each(this.dataAttrs, function(i, value){
                    if(typeof $input.data("rule-" + value) !== "undefined"){
                        vldtr.addDataAttr($input, "data-msg-" + value, vldtr.getErrorMessage(input.name, value));
                    }
                });
            }
        },
        bindKeyEvents: function(){

            var validator = this;

            this.elements.each(function(){
                var input = this;
                $(this).keyup(function(){
                    validator.checkElement(input);
                });

                $(this).focusout(function(){
                    validator.checkElement(input);
                });

                //validator.keyEvents().bindKeyUp(this);
                //validator.keyEvents().bindFocusOut(this);
            });
        },
        bindSumitEvent: function(){

            var validator = this;

            $(validator.currentForm).submit(function(e) {
                validator.checkForm();

                if($(validator.currentForm).find("input[invalid]").length) {
                    validator.focusFirstInvalidElement();
                    return false;
                }
            });
        },
        checkForm: function() {

            var validator = this;
            validator.elements.each(function(){
                validator.checkElement(this);
            });

            return this.isValid;
        },
        getElements: function() {
            // get input elements to check valid
            return $(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, :disabled");
        },
        showErrorMessage: function(input, type){
            var $input = $(input);

            $input.attr("invalid", true);

            var msg = $input.data("msg-" + type);
            // or use input.getAttribute("data-msg-required");

            var new_error_label = '<label class="error" for="' + $input.attr("name") + '">' + msg + '</label>';
            this.removeErrorMessage($input);
            $(input).after(new_error_label);
        },
        removeErrorMessage: function($input){
            var error_label = $input.parent().find("label.error");
            if (error_label.length) {
                error_label.remove();
                $input.removeAttr("invalid");
            }
        },
        checkElement: function(input) {

            var $input = $(input);
            var inputValid = false;

            this.removeErrorMessage($input);

            var val = $input.val();

            if (typeof $input.data("rule-required") !== "undefined" && !val) {
                var name = $input.attr("name");
                this.showErrorMessage(input, "required");
            } else if(typeof $input.data("rule-email") !== "undefined"&& val.length && !this.isEmail(val)){
                this.showErrorMessage(input, "email");
            } else if(typeof $input.data("rule-number") !== "undefined"&& val.length && !this.isNumber(val)){
                this.showErrorMessage(input, "number");
            } else if(typeof $input.data("rule-minlength") !== "undefined" && val.length < $input.data("rule-minlength")){
                this.showErrorMessage(input, "minlength");
            } else if (typeof $input.data("rule-equalto") !== "undefined" && val !== this.currentForm[$input.data("rule-equalto")].value){
                this.showErrorMessage(input, "equalto");
            } else {
                inputValid = true;
            }

            return inputValid;
        },
        focusFirstInvalidElement: function(){
            var $element = $(this.currentForm).find("[invalid]")[0];

            $element.focus();
        },
        toString: function(){
            var source = arguments[0];
            var args = Array.prototype.slice.call(arguments, 1);

            $.each(args, function(index, value){
                source = source.replace( new RegExp( "\\{" + index + "\\}", "g" ), value);
            });

            return source;
        },
        isEmail: function(value){
            return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
        },
        isNumber: function( value, element ) {
            return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
        },
    });


$.fn.myvalidate = function(options) {

    return this.each(function() {

        var validator = new Validator(this, options);

        validator.sanitizeElements();

        validator.bindKeyEvents();

        validator.bindSumitEvent();
    });
}

} )( jQuery, window, document );