(function() {
    rivets.binders.input = {
        publishes: true,
        routine: rivets.binders.value.routine,
        bind: function(el) {
            return $(el).bind('input.rivets', this.publish);
        },
        unbind: function(el) {
            return $(el).unbind('input.rivets');
        }
    };

    rivets.configure({
        prefix: "rv",
        adapter: {
            subscribe: function(obj, keypath, callback) {
                callback.wrapped = function(m, v) {
                   return callback(v);
                };
                return obj.on('change:' + keypath, callback.wrapped);
            },
            unsubscribe: function(obj, keypath, callback) {
                return obj.off('change:' + keypath, callback.wrapped);
            },
            read: function(obj, keypath) {
                if (keypath === "cid") {
                    return obj.cid;
                }
                return obj.get(keypath);
            },
            publish: function(obj, keypath, value) {
                if (obj.cid) {
                    return obj.set(keypath, value);
                } else {
                    return obj[keypath] = value;
                }
            }
        }
    });

}).call(this);

(function() {
    var BuilderView, EditFieldView, Formbuilder, FormbuilderCollection, FormbuilderModel, ViewFieldView, _ref, _ref1, _ref2, _ref3, _ref4,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    FormbuilderModel = (function(_super) {
        __extends(FormbuilderModel, _super);

        function FormbuilderModel() {
            _ref = FormbuilderModel.__super__.constructor.apply(this, arguments);
            return _ref;
        }

        FormbuilderModel.prototype.sync = function() {};

        FormbuilderModel.prototype.indexInDOM = function() {
            var $wrapper,
            _this = this;
            $wrapper = $(".fb-field-wrapper").filter((function(_, el) {
                return $(el).data('cid') === _this.cid;
            }));

            return $(".fb-field-wrapper").index($wrapper);
        };

        FormbuilderModel.prototype.is_input = function() {
            return Formbuilder.inputFields[this.get(Formbuilder.options.mappings.FIELD_TYPE)] != null;
        };

        return FormbuilderModel;

    })(Backbone.DeepModel);

    FormbuilderCollection = (function(_super) {
        __extends(FormbuilderCollection, _super);

        function FormbuilderCollection() {
            _ref1 = FormbuilderCollection.__super__.constructor.apply(this, arguments);
            return _ref1;
        }

        FormbuilderCollection.prototype.initialize = function() {
            return this.on('add', this.copyCidToModel);
        };

        FormbuilderCollection.prototype.model = FormbuilderModel;

        FormbuilderCollection.prototype.comparator = function(model) {
            return model.indexInDOM();
        };

        FormbuilderCollection.prototype.copyCidToModel = function(model) {
            return model.attributes.cid = model.cid;
        };

        return FormbuilderCollection;

    })(Backbone.Collection);

    ViewFieldView = (function(_super) {
        __extends(ViewFieldView, _super);

        function ViewFieldView() {
            _ref2 = ViewFieldView.__super__.constructor.apply(this, arguments);
            return _ref2;
        }

        ViewFieldView.prototype.className = "fb-field-wrapper";

        ViewFieldView.prototype.events = {
            'click .subtemplate-wrapper': 'focusEditView',
            'click .js-duplicate': 'duplicate',
            'click .js-clear': 'clear'
        };

        ViewFieldView.prototype.initialize = function(options) {
            this.parentView = options.parentView;
            this.listenTo(this.model, "change", this.render);
            return this.listenTo(this.model, "destroy", this.remove);
        };

        ViewFieldView.prototype.render = function() {
            this.$el.addClass('response-field-' + this.model.get(Formbuilder.options.mappings.FIELD_TYPE)).data('cid', this.model.cid).html(Formbuilder.templates["view/base" + (!this.model.is_input() ? '_non_input' : '')]({
                rf: this.model
            }));
            return this;
        };

        ViewFieldView.prototype.focusEditView = function() {
            return this.parentView.createAndShowEditView(this.model);
        };

        ViewFieldView.prototype.clear = function(e) {
            var cb, x,
            _this = this;
            e.preventDefault();
            e.stopPropagation();
            cb = function() {
                _this.parentView.handleFormUpdate();
                return _this.model.destroy();
            };
            x = Formbuilder.options.CLEAR_FIELD_CONFIRM;
            switch (typeof x) {
                case 'string':
                if (confirm(x)) {
                    return cb();
                }
                break;
                case 'function':
                return x(cb);
                default:
                return cb();
            }
        };

        ViewFieldView.prototype.duplicate = function() {
            var attrs;
            attrs = _.clone(this.model.attributes);
            delete attrs['id'];
            attrs['label'] += ' Copy';
            return this.parentView.createField(attrs, {
                position: this.model.indexInDOM() + 1
            });
        };

        return ViewFieldView;

    })(Backbone.View);

    EditFieldView = (function(_super) {
        __extends(EditFieldView, _super);

        function EditFieldView() {
            _ref3 = EditFieldView.__super__.constructor.apply(this, arguments);
            return _ref3;
        }

        EditFieldView.prototype.className = "edit-response-field";

        EditFieldView.prototype.events = {
            'click .js-add-option': 'addOption',
            'click .js-remove-option': 'removeOption',
            'click .js-default-updated': 'defaultUpdated',
            'change .js-select-reference': 'selectReference',
            'input .option-label-input': 'forceRender'
        };

        EditFieldView.prototype.initialize = function(options) {
            this.parentView = options.parentView;
            return this.listenTo(this.model, "destroy", this.remove);
        };

        EditFieldView.prototype.render = function() {
            this.$el.html(Formbuilder.templates["edit/base" + (!this.model.is_input() ? '_non_input' : '')]({
                rf: this.model
            }));
            rivets.bind(this.$el, {
                model: this.model
            });
            return this;
        };

        EditFieldView.prototype.remove = function() {
            this.parentView.editView = void 0;
            this.parentView.$el.find("[data-target=\"#addField\"]").click();
            return EditFieldView.__super__.remove.apply(this, arguments);
        };

        EditFieldView.prototype.addOption = function(e) {
            var $el, i, newOption, options;
            $el = $(e.currentTarget);
            i = this.$el.find('.option').index($el.closest('.option'));
            options = this.model.get(Formbuilder.options.mappings.OPTIONS) || [];
            newOption = {
                label: "",
                checked: false
            };
            if (i > -1) {
                options.splice(i + 1, 0, newOption);
            } else {
                options.push(newOption);
            }
            this.model.set(Formbuilder.options.mappings.OPTIONS, options);
            this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
            return this.forceRender();
        };

        EditFieldView.prototype.selectReference = function(e) {
            var $el, i, newOption, options;
            var $this = $(e.target);
            options = {};

            options[Formbuilder.options.mappings.REFERENCE_SHOW]=$this.val();
            options[Formbuilder.options.mappings.REFERENCE]=$($this.html()).attr(Formbuilder.options.mappings.REFERENCE);
            options[Formbuilder.options.mappings.REFERENCE_TYPE]=$($this.html()).attr(Formbuilder.options.mappings.REFERENCE_TYPE);
            
            for(var key in options){
              this.model.set(key,options[key]);
              this.model.trigger("change:" + key);
            }
            
            return this.forceRender();
        };

        EditFieldView.prototype.removeOption = function(e) {
            var $el, index, options;
            $el = $(e.currentTarget);
            index = this.$el.find(".js-remove-option").index($el);
            options = this.model.get(Formbuilder.options.mappings.OPTIONS);
            options.splice(index, 1);
            this.model.set(Formbuilder.options.mappings.OPTIONS, options);
            this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
            return this.forceRender();
        };

        EditFieldView.prototype.defaultUpdated = function(e) {
            var $el;
            $el = $(e.currentTarget);
            if (this.model.get(Formbuilder.options.mappings.FIELD_TYPE) !== 'checkboxes') {
                this.$el.find(".js-default-updated").not($el).attr('checked', false).trigger('change');
            }
            return this.forceRender();
        };

        EditFieldView.prototype.forceRender = function() {
          return this.model.trigger('change');
        };

        return EditFieldView;

    })(Backbone.View);

    BuilderView = (function(_super) {
        __extends(BuilderView, _super);

        function BuilderView() {
          _ref4 = BuilderView.__super__.constructor.apply(this, arguments);
          return _ref4;
      }

      BuilderView.prototype.SUBVIEWS = [];

      BuilderView.prototype.events = {
          'click .js-save-form': 'saveForm',
          'click .fb-tabs a': 'showTab',
          'click .fb-add-field-types a': 'addField',
          'mouseover .fb-add-field-types': 'lockLeftWrapper',
          'mouseout .fb-add-field-types': 'unlockLeftWrapper'
      };

      BuilderView.prototype.initialize = function(options) {
          var selector;
          selector = options.selector, 
          this.formBuilder = options.formBuilder,
          this.type=(options.type? options.type: "Unknown"),
          this.reference=(options.reference? options.reference: {}),
          this.bootstrapData = options.bootstrapData;
          if (selector != null) {
            this.setElement($(selector));
        }
        this.collection = new FormbuilderCollection;
        this.collection.bind('add', this.addOne, this);
        this.collection.bind('reset', this.reset, this);
        this.collection.bind('change', this.handleFormUpdate, this);
        this.collection.bind('destroy add reset', this.hideShowNoResponseFields, this);
        this.collection.bind('destroy', this.ensureEditViewScrolled, this);
        this.render();
        this.collection.reset(this.bootstrapData);
        //return this.bindSaveEvent();
    };

    BuilderView.prototype.bindSaveEvent = function() {
      var _this = this;
      this.formSaved = true;
      this.saveFormButton = this.$el.find(".js-save-form");
      this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
      if (!!Formbuilder.options.AUTOSAVE) {
        setInterval(function() {
          return _this.saveForm.call(_this);
        }, 5000);
      }
      return $(window).bind('beforeunload', function() {
          if (_this.formSaved) {
            return void 0;
        } else {
            return Formbuilder.options.dict.UNSAVED_CHANGES;
        }
      });
    };

    BuilderView.prototype.reset = function() {
      this.$responseFields.html('');
      return this.addAll();
    };

    BuilderView.prototype.render = function() {
      var subview, _i, _len, _ref5;
      this.$el.html(Formbuilder.templates['page']());
      this.$fbLeft = this.$el.find('.fb-left');
      this.$responseFields = this.$el.find('.fb-response-fields');
      this.bindWindowScrollEvent();
      this.hideShowNoResponseFields();
      _ref5 = this.SUBVIEWS;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        subview = _ref5[_i];
        new subview({
          parentView: this
      }).render();
    }
    return this;
    };

    BuilderView.prototype.bindWindowScrollEvent = function() {
      var _this = this;
      return $(window).on('scroll', function() {
        var maxMargin, newMargin;
        if (_this.$fbLeft.data('locked') === true) {
          return;
      }
      newMargin = Math.max(0, $(window).scrollTop() - _this.$el.offset().top);
      maxMargin = _this.$responseFields.height();
      return _this.$fbLeft.css({
          'margin-top': Math.min(maxMargin, newMargin)
      });
    });
    };

    BuilderView.prototype.showTab = function(e) {
      var $el, first_model, target;
      $el = $(e.currentTarget);
      target = $el.data('target');
      $el.closest('li').addClass('active').siblings('li').removeClass('active');
      $(target).addClass('active').siblings('.fb-tab-pane').removeClass('active');
      if (target !== '#editField') {
        this.unlockLeftWrapper();
    }
    if (target === '#editField' && !this.editView && (first_model = this.collection.models[0])) {
        return this.createAndShowEditView(first_model);
    }
    };

    BuilderView.prototype.addOne = function(responseField, _, options) {
      var $replacePosition, view;
      view = new ViewFieldView({
        model: responseField,
        parentView: this
    });
      if (options.$replaceEl != null) {
        return options.$replaceEl.replaceWith(view.render().el);
    } else if ((options.position == null) || options.position === -1) {
        return this.$responseFields.append(view.render().el);
    } else if (options.position === 0) {
        return this.$responseFields.prepend(view.render().el);
    } else if (($replacePosition = this.$responseFields.find(".fb-field-wrapper").eq(options.position))[0]) {
        return $replacePosition.before(view.render().el);
    } else {
        return this.$responseFields.append(view.render().el);
    }
    };

    BuilderView.prototype.setSortable = function() {
      var _this = this;
      if (this.$responseFields.hasClass('ui-sortable')) {
        this.$responseFields.sortable('destroy');
    }
    this.$responseFields.sortable({
        forcePlaceholderSize: true,
        placeholder: 'sortable-placeholder',
        stop: function(e, ui) {
          var rf;
          if (ui.item.data('field-type')) {
            rf = _this.collection.create(Formbuilder.helpers.defaultFieldAttrs(ui.item.data('field-type')), {
              $replaceEl: ui.item
          });
            _this.createAndShowEditView(rf);
        }
        _this.handleFormUpdate();
        return true;
    },
    update: function(e, ui) {
      if (!ui.item.data('field-type')) {
        return _this.ensureEditViewScrolled();
    }
    }
    });
    return this.setDraggable();
    };

    BuilderView.prototype.setDraggable = function() {
      var $addFieldButtons,
      _this = this;
      $addFieldButtons = this.$el.find("[data-field-type]");
      return $addFieldButtons.draggable({
        connectToSortable: this.$responseFields,
        helper: function() {
          var $helper;
          $helper = $("<div class='response-field-draggable-helper' />");
          $helper.css({
            width: _this.$responseFields.width(),
            height: '80px'
        });
          return $helper;
      }
    });
    };

    BuilderView.prototype.addAll = function() {
      this.collection.each(this.addOne, this);
      return this.setSortable();
    };

    BuilderView.prototype.hideShowNoResponseFields = function() {
      return this.$el.find(".fb-no-response-fields")[this.collection.length > 0 ? 'hide' : 'show']();
    };

    BuilderView.prototype.addField = function(e) {
      var field_type;
      field_type = $(e.currentTarget).data('field-type');
      return this.createField(Formbuilder.helpers.defaultFieldAttrs(field_type,this.collection));
    };

    BuilderView.prototype.createField = function(attrs, options) {
      var rf;
      rf = this.collection.create(attrs, options);
      this.createAndShowEditView(rf);
      return this.handleFormUpdate();
    };

    BuilderView.prototype.createAndShowEditView = function(model) {
      var $newEditEl, $responseFieldEl;
      $responseFieldEl = this.$el.find(".fb-field-wrapper").filter(function() {
        return $(this).data('cid') === model.cid;
      });
      $responseFieldEl.addClass('editing').siblings('.fb-field-wrapper').removeClass('editing');
      if (this.editView) {
        if (this.editView.model.cid === model.cid) {
          this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
          this.scrollLeftWrapper($responseFieldEl);
          return;
        }
        this.editView.remove();
      }
      this.editView = new EditFieldView({
          model: model,
          parentView: this
      });
      $newEditEl = this.editView.render().$el;
      this.$el.find(".fb-edit-field-wrapper").html($newEditEl);
      this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
      this.scrollLeftWrapper($responseFieldEl);
      return this;
    };

    BuilderView.prototype.ensureEditViewScrolled = function() {
      if (!this.editView) {
        return;
      }
      return this.scrollLeftWrapper($(".fb-field-wrapper.editing"));
    };

    BuilderView.prototype.scrollLeftWrapper = function($responseFieldEl) {
      var _this = this;
      this.unlockLeftWrapper();
      if (!$responseFieldEl[0]) {
        return;
      }
      return $.scrollWindowTo((this.$el.offset().top + $responseFieldEl.offset().top) - this.$responseFields.offset().top, 200, function() {
          return _this.lockLeftWrapper();
      });
    };

    BuilderView.prototype.lockLeftWrapper = function() {
      return this.$fbLeft.data('locked', true);
    };

    BuilderView.prototype.unlockLeftWrapper = function() {
      return this.$fbLeft.data('locked', false);
    };

    BuilderView.prototype.handleFormUpdate = function() {
      if (this.updatingBatch) {
        return;
      }
      this.formSaved = false;
      //return this.saveFormButton.removeAttr('disabled').text(Formbuilder.options.dict.SAVE_FORM);
    };

    BuilderView.prototype.saveForm = function(e) {
        var payload;
        if (this.formSaved) {
            return;
        }
        this.formSaved = true;
        this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
        this.collection.sort();
        payload = JSON.stringify({
            fields: this.collection.toJSON()
        });
        if (Formbuilder.options.HTTP_ENDPOINT) {
            this.doAjaxSave(payload);
        }
        return this.formBuilder.trigger('save', payload);
    };

    BuilderView.prototype.formToSchema = function(e) {
        var payload;
        this.collection.sort();
        payload = this.collection.toJSON();

        jsonSchema={
            "$schema":"http://json-schema.org/draft-04/schema#",
            type:'object',
            formType:this.type,
            properties:{
                data:{
                    type:'object',
                    view:this.type,
                    properties:{},
                    order:[],
                    required:[]
                },
                schema:{
                    title:'Type',
                    view:'text',
                    type:'integer',
                    hidden:true
                }
            },
            order:['data'],
            required:['data','schema']
        };
        var _this=this;
        _.each(payload,function(field,index){
            var fieldKey = (field.cid ? field.cid : Formbuilder.idGenerator(Formbuilder.options.mappings.FIELD_KEY,_this.collection));
            var item={};

            for(var element in Formbuilder.fields){
                if(Formbuilder.fields[element].key==field[Formbuilder.options.mappings.FIELD_TYPE]){
                    item=JSON.parse(JSON.stringify(Formbuilder.fields[element].submit));
                    break;
                }
            };

            item[Formbuilder.options.mappings.LABEL]=field[Formbuilder.options.mappings.LABEL];
            item[Formbuilder.options.mappings.FIELD_OPTION]=field[Formbuilder.options.mappings.FIELD_OPTION];
            
            if(item[Formbuilder.options.mappings.FIELD_TYPE]==Formbuilder.fields.REFERENCE.key){
              item[Formbuilder.options.mappings.REFERENCE]=field[Formbuilder.options.mappings.REFERENCE];              
              item[Formbuilder.options.mappings.REFERENCE_SHOW]=field[Formbuilder.options.mappings.REFERENCE_SHOW];
              item[Formbuilder.options.mappings.REFERENCE_TYPE]=field[Formbuilder.options.mappings.REFERENCE_TYPE];
            }
            
            //set min max in json-schema. this is duplicated for schema validation
            var LIMIT_KEY= Formbuilder.options.mappings.MIN.split('.');
            LIMIT_KEY=LIMIT_KEY[LIMIT_KEY.length-1];
            if(field[Formbuilder.options.mappings.FIELD_OPTION] && field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY]){
              item[LIMIT_KEY]= field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY];
            }

            LIMIT_KEY= Formbuilder.options.mappings.MAX.split('.');
            LIMIT_KEY=LIMIT_KEY[LIMIT_KEY.length-1];
            
            if(field[Formbuilder.options.mappings.FIELD_OPTION] && field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY]){
              item[LIMIT_KEY]= field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY];
            }

            LIMIT_KEY= Formbuilder.options.mappings.MINLENGTH.split('.');
            LIMIT_KEY=LIMIT_KEY[LIMIT_KEY.length-1];
            
            if(field[Formbuilder.options.mappings.FIELD_OPTION] && field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY]){
              item[LIMIT_KEY]= field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY];
            }

            LIMIT_KEY= Formbuilder.options.mappings.MAXLENGTH.split('.');
            LIMIT_KEY=LIMIT_KEY[LIMIT_KEY.length-1];
            
            if(field[Formbuilder.options.mappings.FIELD_OPTION] && field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY]){
              item[LIMIT_KEY]= field[Formbuilder.options.mappings.FIELD_OPTION][LIMIT_KEY];
            }

            //generates key value for checkbox/radio/dropdown labels
            var OPTION_KEY=Formbuilder.options.mappings.OPTIONS.split('.');
            OPTION_KEY=OPTION_KEY[OPTION_KEY.length-1];

            if(item[Formbuilder.options.mappings.FIELD_OPTION] && item[Formbuilder.options.mappings.FIELD_OPTION][OPTION_KEY]){
                _.each(item[Formbuilder.options.mappings.FIELD_OPTION][OPTION_KEY],function(option,index,list){
                    if(!option.key){
                        key=Formbuilder.idGenerator(Formbuilder.options.mappings.OPTION_KEY);
                        list[index].key=key;
                    }
                })
            }
            jsonSchema.properties.data.order.push(fieldKey);
            field[Formbuilder.options.mappings.REQUIRED] ? jsonSchema.properties.data.required.push(fieldKey):'';
            jsonSchema.properties.data.properties[fieldKey]=item;
        })
        return jsonSchema;
    };

    BuilderView.prototype.doAjaxSave = function(payload) {
        var _this = this;
        return $.ajax({
            url: Formbuilder.options.HTTP_ENDPOINT,
            type: Formbuilder.options.HTTP_METHOD,
            data: payload,
            contentType: "application/json",
            success: function(data) {
                var datum, _i, _len, _ref5;
                _this.updatingBatch = true;
                for (_i = 0, _len = data.length; _i < _len; _i++) {
                    datum = data[_i];
                    if ((_ref5 = _this.collection.get(datum.cid)) != null) {
                        _ref5.set({
                            id: datum.id
                        });
                    }
                    _this.collection.trigger('sync');
                }
                return _this.updatingBatch = void 0;
            }
        });
    };

    return BuilderView;

    })(Backbone.View);

    Formbuilder = (function() {
      Formbuilder.helpers = {
        defaultFieldAttrs: function(field_type,collection) {
          var attrs, _base;
          attrs = {};
          attrs[Formbuilder.options.mappings.LABEL] = 'Untitled';
          attrs[Formbuilder.options.mappings.FIELD_TYPE] = field_type;
          attrs[Formbuilder.options.mappings.REQUIRED] = true;
          attrs["cid"]=Formbuilder.idGenerator(Formbuilder.options.mappings.FIELD_KEY,collection);
          attrs['field_options'] = {};
          return (typeof (_base = Formbuilder.fields[field_type]).defaultAttributes === "function" ? _base.defaultAttributes(attrs) : void 0) || attrs;
        },
        simple_format: function(x) {
            return x != null ? x.replace(/\n/g, '<br />') : void 0;
        }
      };

      Formbuilder.options = {
        BUTTON_CLASS: 'fb-button',
        HTTP_ENDPOINT: '',
        HTTP_METHOD: 'POST',
        AUTOSAVE: false,
        CLEAR_FIELD_CONFIRM: false,
        mappings: {
            LABEL:        'title',
            FIELD_TYPE:   'view',
            REFERENCE:    '$ref',
            REFERENCE_SHOW:'show',
            REFERENCE_TYPE:'referenceType',
            REQUIRED:     'required',
            ADMIN_ONLY:   'admin_only',
            FIELD_OPTION: 'fieldOptions',
            DEFAULT:      'fieldOptions.default',
            SIZE:         'fieldOptions.size',
            UNITS:        'fieldOptions.units',
            OPTIONS:      'fieldOptions.options',
            DESCRIPTION:  'fieldOptions.description',
            INCLUDE_OTHER:'fieldOptions.include_other_option',
            INCLUDE_BLANK:'fieldOptions.include_blank_option',
            INTEGER_ONLY: 'fieldOptions.integer_only',
            MIN:          'fieldOptions.min',
            MAX:          'fieldOptions.max',
            MINLENGTH:    'fieldOptions.minLength',
            MAXLENGTH:    'fieldOptions.maxLength',
            LENGTH_UNITS: 'fieldOptions.min_max_length_units',
            FIELD_KEY:    'FIELD_KEY',
            OPTION_KEY:   'OPTION_KEY',
            CID_GAP:      4,
        },
        dict: {
            ALL_CHANGES_SAVED: 'All changes saved',
            SAVE_FORM: 'Save form',
            UNSAVED_CHANGES: 'You have unsaved changes. If you leave this page, you will lose those changes!'
        }
      };

      Formbuilder.fields = {
        TEXT:{count:0,key:'text',submit:{view:'text',type:'string'}},
        TIME:{count:0,key:'time',submit:{view:'time',type:'string'}},
        NUMBER:{count:0,key:'number',submit:{view:'number',type:'number'}},
        DROPDOWN:{count:0,key:'dropdown',submit:{view:'dropdown',type:'string'}},
        CHECKBOX:{count:0,key:'checkboxes',submit:{view:'checkboxes',type:'array'}},
        RADIO:{count:0,key:'radio',submit:{view:'radio',type:'string'}},
        DATE:{count:0,key:'date',submit:{view:'date',type:'string', format:'date-time'}},
        REFERENCE:{count:0,key:'reference',submit:{view:'reference',type:'object'}},
        ADDRESS:{count:0,key:'address',submit:{view:'address',type:'object'}},
        EMAIL:{count:0,key:'email',submit:{view:'email',type:'string',format:'email'}},
        PARAGRAPH:{count:0,key:'paragraph',submit:{view:'paragraph',type:'string'}},
        URL:{count:0,key:'url',submit:{view:'url',type:'string',format:'url'}},
        FIELD_KEY:{count:0,key:'field'},
        OPTION_KEY:{count:0,key:'key'}
      };

      Formbuilder.inputFields = {};

      Formbuilder.nonInputFields = {};

      Formbuilder.idGenerator=function(elementType,collection){
          var count=parseInt(Formbuilder.fields[elementType].count)+1;
          
          if(elementType==Formbuilder.options.mappings.FIELD_KEY && collection){
              var max=0;
              _.each(collection.models,function(element,index){
                  var cid= element.cid.split(/.*[^0-9]/);
                  cid?cid=parseInt(cid[cid.length-1]):null;
                  if(cid && cid>max)
                      max=cid;
              })

              count=parseInt(Formbuilder.options.mappings.CID_GAP)+parseInt(max);
          }
          Formbuilder.fields[elementType].count=count;
          return Formbuilder.fields[elementType].key+count;
      };

      Formbuilder.registerField = function(name, opts) {
        var x, _i, _len, _ref5;
        _ref5 = ['view', 'edit'];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          x = _ref5[_i];
          opts[x] = _.template(opts[x]);
        }
        opts.field_type = name;
        Formbuilder.fields[name] = opts;
        if (opts.type === 'non_input') {
          return Formbuilder.nonInputFields[name] = opts;
        } else {
          return Formbuilder.inputFields[name] = opts;
        }
      };

      function Formbuilder(opts) {
          var args;
          if (opts == null) {
              opts = {};
          }
          if(opts.isJsonSchema && opts.schema){
              var schema=opts.schema;
              var bootstrapData=[];
              if(schema && schema.properties && schema.properties.data){
                  
                  var data=schema.properties.data.properties;
                  var order=schema.properties.data.order;
                  var required=schema.properties.data.required;

                  for(var i=0;order[i];i+=1){
                      if(data[order[i]] && !data[order[i]].hidden){
                          var schemaElement=data[order[i]];
                          var formElement={
                              title: schemaElement.title,
                              view: schemaElement.view,
                              required: _.contains(required,order[i]),
                              fieldOptions:(schemaElement.fieldOptions || {}),
                              cid:order[i]
                          }

                          bootstrapData.push(formElement);
                      }
                  }
              }
              opts.bootstrapData=bootstrapData;
          }
          _.extend(this, Backbone.Events);
          args = _.extend(opts, {
              formBuilder: this
          });
          
          Formbuilder.reference=((opts && opts.reference)?opts.reference:{});
          Formbuilder.type=((opts && opts.type)?opts.type:null);
          
          this.mainView = new BuilderView(args);
      }

      return Formbuilder;

    })();

    window.Formbuilder = Formbuilder;

    if (typeof module !== "undefined" && module !== null) {
      module.exports = Formbuilder;
    } 
    else {
      window.Formbuilder = Formbuilder;
    }

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.ADDRESS.key, {
        order: 50,
        view: "<div class='input-line'>\n  <span class='street'>\n    <input type='text' />\n    <label>Address</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='city'>\n    <input type='text' />\n    <label>City</label>\n  </span>\n\n  <span class='state'>\n    <input type='text' />\n    <label>State / Province / Region</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='zip'>\n    <input type='text' />\n    <label>Zipcode</label>\n  </span>\n\n  <span class='country'>\n    <select><option>Bangladesh</option></select>\n    <label>Country</label>\n  </span>\n</div>",
        edit: "<%= Formbuilder.templates['edit/options']({ includeOther: true }) %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-home\"></span></span> Address"
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.CHECKBOX.key, {
        order: 10,
        view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='checkbox' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input type='checkbox' />\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
        edit: "<%= Formbuilder.templates['edit/options']({ includeOther: true }) %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-square-o\"></span></span> Checkboxes",
        defaultAttributes: function(attrs) {
          attrs.field_options.options = [
          {
              label: "",
              checked: false
          }, {
              label: "",
              checked: false
          }
          ];
          return attrs;
        }
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.DATE.key, {
        order: 20,
        view: "<div class='input-line'>\n  <span class='month'>\n    <input type=\"text\" />\n    <label>MM</label>\n  </span>\n\n  <span class='above-line'>/</span>\n\n  <span class='day'>\n    <input type=\"text\" />\n    <label>DD</label>\n  </span>\n\n  <span class='above-line'>/</span>\n\n  <span class='year'>\n    <input type=\"text\" />\n    <label>YYYY</label>\n  </span>\n</div>",
        edit: "<%= Formbuilder.templates['edit/default']() %>\n",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-calendar\"></span></span> Date"
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.DROPDOWN.key, {
        order: 24,
        view: "<select>\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_BLANK)) { %>\n    <option value=''></option>\n  <% } %>\n\n  <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n    <option <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'selected' %>>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </option>\n  <% } %>\n</select>",
        edit: "<%= Formbuilder.templates['edit/options']({ includeBlank: true }) %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-caret-down\"></span></span> Dropdown",
        defaultAttributes: function(attrs) {
          attrs.field_options.options = [
          {
              label: "",
              checked: false
          }, {
              label: "",
              checked: false
          }
          ];
          attrs.field_options.include_blank_option = false;
          return attrs;
        }
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.EMAIL.key, {
        order: 40,
        view: "<input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
        edit: "<%= Formbuilder.templates['edit/default']() %>\n",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-envelope-o\"></span></span> Email"
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.NUMBER.key, {
        order: 30,
        view: "<input type='text' />\n<% if (units = rf.get(Formbuilder.options.mappings.UNITS)) { %>\n  <%= units %>\n<% } %>",
        edit: "<%= Formbuilder.templates['edit/default']() %>\n<%= Formbuilder.templates['edit/min_max']() %>\n<%= Formbuilder.templates['edit/integer_only']() %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-number\">123</span></span> Number"
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.PARAGRAPH.key, {
        order: 5,
        view: "<textarea class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'></textarea>",
        edit: "<%= Formbuilder.templates['edit/default']() %>\n<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>",
        addButton: "<span class=\"symbol\">&#182;</span> Paragraph",
        defaultAttributes: function(attrs) {
          attrs.field_options.size = 'small';
          return attrs;
        }
      });

    }).call(this);

    /*(function() {
      Formbuilder.registerField('price', {
        order: 45,
        view: "<div class='input-line'>\n  <span class='above-line'>$</span>\n  <span class='dolars'>\n    <input type='text' />\n    <label>Dollars</label>\n  </span>\n  <span class='above-line'>.</span>\n  <span class='cents'>\n    <input type='text' />\n    <label>Cents</label>\n  </span>\n</div>",
        edit: "",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-usd\"></span></span> Price"
      });

    }).call(this);*/

    (function() {
      Formbuilder.registerField(Formbuilder.fields.RADIO.key, {
        order: 15,
        view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='radio' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input type='radio' />\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
        edit: "<%= Formbuilder.templates['edit/options']({ includeOther: true }) %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-circle-o\"></span></span> Multiple Choice",
        defaultAttributes: function(attrs) {
          attrs.field_options.options = [
          {
              label: "",
              checked: false
          }, {
              label: "",
              checked: false
          }
          ];
          return attrs;
        }
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.REFERENCE.key, {
        order: 24,
        view: "  <label> <%= (rf.get(Formbuilder.options.mappings.REFERENCE_SHOW)?rf.get(Formbuilder.options.mappings.REFERENCE_SHOW):'N/A') %> </label>\n",
        edit: "<%= Formbuilder.templates['edit/reference']({ includeBlank: false }) %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-caret-down\"></span></span> Reference",
        defaultAttributes: function(attrs) {
          attrs.field_options.include_blank_option = false;
          return attrs;
        }
      });

    }).call(this);


    /*(function() {
      Formbuilder.registerField('section_break', {
        order: 0,
        type: 'non_input',
        view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
        edit: "<div class='fb-edit-section-header'>Label</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n<textarea data-rv-input='model.<%= Formbuilder.options.mappings.DESCRIPTION %>'\n  placeholder='Add a longer description to this field'></textarea>",
        addButton: "<span class='symbol'><span class='fa fa-minus'></span></span> Section Break"
      });

    }).call(this);*/

    (function() {
      Formbuilder.registerField(Formbuilder.fields.TEXT.key, {
        order: 0,
        view: "<input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
        edit: "<%= Formbuilder.templates['edit/default']() %>\n<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>",
        addButton: "<span class='symbol'><span class='fa fa-font'></span></span> Text",
        defaultAttributes: function(attrs) {
          attrs.field_options.size = 'small';
          return attrs;
        }
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.TIME.key, {
        order: 25,
        view: "<div class='input-line'>"+
        "<span class='hours'>"+
        "<input type=\"text\" />"+    
        "<label>HH</label>"+
        "</span>"+
        "<span class='above-line'>:</span>"+
        "<span class='minutes'>"+
        "<input type=\"text\" />"+
        "<label>MM</label>"+
        "</span>"+
        "<span class='above-line'>:</span>"+
        "<span class='seconds'>"+
        "<input type=\"text\" />"+
        "<label>SS</label>"+
        "</span>"+
        "<span class='am_pm'>"+    
        "<select>"+
        "<option>AM</option>"+
        "<option>PM</option>"+
        "</select>"+
        "</span>"+
        "</div>",
        edit: "<%= Formbuilder.templates['edit/default']() %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-clock-o\"></span></span> Time"
      });

    }).call(this);

    (function() {
      Formbuilder.registerField(Formbuilder.fields.URL.key, {
        order: 35,
        view: "<input type='text' placeholder='http://' />",
        edit: "<%= Formbuilder.templates['edit/default']() %>",
        addButton: "<span class=\"symbol\"><span class=\"fa fa-link\"></span></span> Link"
      });

    }).call(this);

    this["Formbuilder"] = this["Formbuilder"] || {};
    this["Formbuilder"]["templates"] = this["Formbuilder"]["templates"] || {};

    this["Formbuilder"]["templates"]["edit/base"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p +=
        ((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
        '\n' +
        ((__t = ( Formbuilder.templates['edit/common']() )) == null ? '' : __t) +
        '\n' +
        ((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
        '\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/base_header"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-field-label\'>\n  <span data-rv-text="model.' +
        ((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
        '"></span>\n  <code class=\'field-type\' data-rv-text=\'model.' +
        ((__t = ( Formbuilder.options.mappings.FIELD_TYPE )) == null ? '' : __t) +
        '\'></code>\n  <span class=\'fa fa-arrow-right pull-right\'></span>\n</div>';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/base_non_input"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p +=
        ((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
        '\n' +
        ((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
        '\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/checkboxes"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
        ((__t = ( Formbuilder.options.mappings.REQUIRED )) == null ? '' : __t) +
        '\' />\n  Required\n</label>\n<!-- label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
        ((__t = ( Formbuilder.options.mappings.ADMIN_ONLY )) == null ? '' : __t) +
        '\' />\n  Admin only\n</label -->';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/common"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Label</div>\n\n<div class=\'fb-common-wrapper\'>\n  <div class=\'fb-label-description\'>\n    ' +
        ((__t = ( Formbuilder.templates['edit/label_description']() )) == null ? '' : __t) +
        '\n  </div>\n  <div class=\'fb-common-checkboxes\'>\n    ' +
        ((__t = ( Formbuilder.templates['edit/checkboxes']() )) == null ? '' : __t) +
        '\n  </div>\n  <div class=\'fb-clear\'></div>\n</div>\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/integer_only"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Integer only</div>\n<label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
        ((__t = ( Formbuilder.options.mappings.INTEGER_ONLY )) == null ? '' : __t) +
        '\' />\n  Only accept integers\n</label>\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/label_description"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<input type=\'text\' data-rv-input=\'model.' +
        ((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
        '\' />\n<textarea data-rv-input=\'model.' +
        ((__t = ( Formbuilder.options.mappings.DESCRIPTION )) == null ? '' : __t) +
        '\'\n  placeholder=\'Add a longer description to this field\'></textarea>';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/min_max"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Minimum / Maximum</div>\n\nAbove\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
        '" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nBelow\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.MAX )) == null ? '' : __t) +
        '" style="width: 30px" />\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/min_max_length"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Length Limit</div>\n\nMin\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.MINLENGTH )) == null ? '' : __t) +
        '" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nMax\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.MAXLENGTH )) == null ? '' : __t) +
        '" style="width: 30px" />\n\n&nbsp;&nbsp;\n\n<select data-rv-value="model.' +
        ((__t = ( Formbuilder.options.mappings.LENGTH_UNITS )) == null ? '' : __t) +
        '" style="width: auto;">\n  <option value="characters">characters</option>\n  <option value="words">words</option>\n</select>\n';
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/options"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
      function print() { __p += __j.call(arguments, '') }
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n';
        if (typeof includeBlank !== 'undefined'){ ;
            __p += '\n  <label>\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
            ((__t = ( Formbuilder.options.mappings.INCLUDE_BLANK )) == null ? '' : __t) +
            '\' />\n    Include blank\n  </label>\n';
        } ;
        __p += '\n\n<div class=\'option\' data-rv-each-option=\'model.' +
        ((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
        '\'>\n  <input type="checkbox" class=\'js-default-updated\' data-rv-checked="option:checked" />\n  <input type="text" data-rv-input="option:label" class=\'option-label-input\' />\n  <a class="js-add-option ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '" title="Add Option"><i class=\'fa fa-plus-circle\'></i></a>\n  <a class="js-remove-option ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '" title="Remove Option"><i class=\'fa fa-minus-circle\'></i></a>\n</div>\n\n';
        if (typeof includeOther !== 'undefined'){ ;
            __p += '\n  <label>\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
            ((__t = ( Formbuilder.options.mappings.INCLUDE_OTHER )) == null ? '' : __t) +
            '\' />\n    Include "other"\n  </label>\n';
        } ;
        __p += '\n\n<div class=\'fb-bottom-add\'>\n  <a class="js-add-option ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '">Add option</a>\n</div>\n';

      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/reference"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
      function print() { __p += __j.call(arguments, '') }
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Reference</div>\n\n';
        __p += '\n\n<div class="reference">\n';

        var option="";
        var hasAnyOption=false;
        if (Formbuilder.reference && Formbuilder.type){  
          option+="\t<select class='js-select-reference'>\n";
          for (i in (Formbuilder.reference[Formbuilder.type] || [])){
            hasAnyOption=true;
            option+=("\n\t<option "+ Formbuilder.options.mappings.REFERENCE+ "='" + 
                    Formbuilder.reference[Formbuilder.type][i][Formbuilder.options.mappings.REFERENCE] +"' "+
              Formbuilder.options.mappings.REFERENCE_TYPE+ "='" + 
                    Formbuilder.reference[Formbuilder.type][i][Formbuilder.options.mappings.REFERENCE_TYPE] +"'>"+ 
              Formbuilder.reference[Formbuilder.type][i][Formbuilder.options.mappings.REFERENCE_SHOW]+"</option>\n");
          }
        }
        if(!hasAnyOption)
          option="<span>No References available</span>";
        __p+=option;
        __p+="\n</div>"
      }
      return __p
    };

    this["Formbuilder"]["templates"]["edit/size"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Size</div>\n<select data-rv-value="model.' +
        ((__t = ( Formbuilder.options.mappings.SIZE )) == null ? '' : __t) +
        '">\n  <option value="small">Small</option>\n  <option value="medium">Medium</option>\n  <option value="large">Large</option>\n</select>\n';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["edit/units"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Units</div>\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.UNITS )) == null ? '' : __t) +
        '" />\n';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["edit/default"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-edit-section-header\'>Default Value</div>\n<input type="text" data-rv-input="model.' +
        ((__t = ( Formbuilder.options.mappings.DEFAULT )) == null ? '' : __t) +
        '" />\n';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["page"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p +=
        /*((__t = ( Formbuilder.templates['partials/save_button']() )) == null ? '' : __t) +
        '\n' +
        */((__t = ( Formbuilder.templates['partials/left_side']() )) == null ? '' : __t) +
        '\n' +
        ((__t = ( Formbuilder.templates['partials/right_side']() )) == null ? '' : __t) +
        '\n<div class=\'fb-clear\'></div>';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["partials/add_field"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
      function print() { __p += __j.call(arguments, '') }
      with (obj) {
        __p += '<div class=\'fb-tab-pane active\' id=\'addField\'>\n  <div class=\'fb-add-field-types\'>\n    <div class=\'section\'>\n      ';
        _.each(_.sortBy(Formbuilder.inputFields, 'order'), function(f){ ;
            __p += '\n        <a data-field-type="' +
            ((__t = ( f.field_type )) == null ? '' : __t) +
            '" class="' +
            ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
            '">\n          ' +
            ((__t = ( f.addButton )) == null ? '' : __t) +
            '\n        </a>\n      ';
        }); ;
        __p += '\n    </div>\n\n    <div class=\'section\'>\n      ';
        _.each(_.sortBy(Formbuilder.nonInputFields, 'order'), function(f){ ;
            __p += '\n        <a data-field-type="' +
            ((__t = ( f.field_type )) == null ? '' : __t) +
            '" class="' +
            ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
            '">\n          ' +
            ((__t = ( f.addButton )) == null ? '' : __t) +
            '\n        </a>\n      ';
        }); ;
        __p += '\n    </div>\n  </div>\n</div>\n';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["partials/edit_field"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-tab-pane\' id=\'editField\'>\n  <div class=\'fb-edit-field-wrapper\'></div>\n</div>\n';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["partials/left_side"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-left\'>\n  <ul class=\'fb-tabs\'>\n    <li class=\'active\'><a data-target=\'#addField\'>Add new field</a></li>\n    <li><a data-target=\'#editField\'>Edit field</a></li>\n  </ul>\n\n  <div class=\'fb-tab-content\'>\n    ' +
        ((__t = ( Formbuilder.templates['partials/add_field']() )) == null ? '' : __t) +
        '\n    ' +
        ((__t = ( Formbuilder.templates['partials/edit_field']() )) == null ? '' : __t) +
        '\n  </div>\n</div>';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["partials/right_side"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-right\'>\n  <div class=\'fb-no-response-fields\'>No response fields</div>\n  <div class=\'fb-response-fields\'></div>\n</div>\n';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["partials/save_button"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'fb-save-wrapper\'>\n  <button class=\'js-save-form ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '\'></button>\n</div>';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["view/base"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
        ((__t = ( Formbuilder.templates['view/label']({rf: rf}) )) == null ? '' : __t) +
        '\n\n  ' +
        ((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
        '\n\n  ' +
        ((__t = ( Formbuilder.templates['view/description']({rf: rf}) )) == null ? '' : __t) +
        '\n  ' +
        ((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
        '\n</div>\n';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["view/base_non_input"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '';
    }
    return __p
    };

    this["Formbuilder"]["templates"]["view/description"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<span class=\'help-block\'>\n  ' +
        ((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.DESCRIPTION)) )) == null ? '' : __t) +
        '\n</span>\n';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["view/duplicate_remove"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape;
      with (obj) {
        __p += '<div class=\'actions-wrapper\'>\n  <a class="js-duplicate ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '" title="Duplicate Field"><i class=\'fa fa-plus-circle\'></i></a>\n  <a class="js-clear ' +
        ((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
        '" title="Remove Field"><i class=\'fa fa-minus-circle\'></i></a>\n</div>';

    }
    return __p
    };

    this["Formbuilder"]["templates"]["view/label"] = function(obj) {
      obj || (obj = {});
      var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
      function print() { __p += __j.call(arguments, '') }
      with (obj) {
        __p += '<label>\n  <span>' +
        ((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.LABEL)) )) == null ? '' : __t) +
        '\n  ';
        if (rf.get(Formbuilder.options.mappings.REQUIRED)) { ;
            __p += '\n    <abbr title=\'required\'>*</abbr>\n  ';
        } ;
        __p += '\n</label>\n';

    }
    return __p
    };