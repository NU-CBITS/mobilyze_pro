//
//
//  Dynamo.Core.Views.js
//
//
//  Dependencies:
//    - Dynamo.Core.js
//    - Dynamo.Core.Models.js


//
// A Global templates object is initialized.
// Each view in the file depends upon a specific key
// w/in this object being defined, but the way in which
// that is done is left up to the user.
//
// For example,
// The question editor currently does this in a 2 step process:
// 1) the templates are injected into the index file as script blocks
// through the CMS and,
// 2) These script blocks are then reads them into the templates object as strings
// through JQUERY
//
templates = {};


//
//
//  InputViews
//
//  These views provide a way of displaying a particular type of individual form input,
//  or a more complex input such as a set of radio boxes / check boxes, or  a jquery slider, etc.
//  They then allow the updated value to be tied back to a model attribute.
//  On instantiation, two methods should be passed to an input view as the getter and setter of the
//  attribute to which they belong. these methods should be called 'getValue' and 'setValue'
//  Requirements:
//    Instances
//    Classes:
//      - viewClassName: All InputView classes must have their class name specified as a class property.
//          this aids in the abstraction away from any one particular type of input when viewing a question.
//
//      - optionsAttributes: InputViews can specify a set of attributes
//          needed in order for the InputView to function correctly.
//          These are the attributes that need to be a key-value
//          pair in a response model's attributes if the response model
//          is to render correctly using the InputView.
//
//      - canHaveResponseValues: A boolean specifying whether this InputView can (must?) accept
//          a discrete set of values as its reply.
//
//

// Dynamo.TextInputView
//  A general purpose way to create a text input
//  form field (whether single line or area)
//  whose value is tied to some Model attribute.
//  As part of its options, it expects:
//    a getter method - to get what the value of the text input should be on render
//    a setter method - called whenever there is a 'new value' event generated from the view.
//    updateOn - if set to 'keyup', it will call the setter method after each character typed.
//               By default, the setter method is only the text-field's 'change' event
Dynamo.TextInputView = Backbone.View.extend(
  //
  //instance properties
  //
  {
    tagName: 'div',
    attributes: {
      width: 'inherit',
      overflow: 'visible'
    },
    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('TextInputView-');
      this.keyup_count = 0;
      this.updateOn = this.options.updateOn || 'change';
      this.closeOn  = this.options.closeOn;
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;
    },
    formType: function() {
      if (!this._field_type) {
        switch(this.options.responseType) {
          case "area":
          case "textarea":  case "text-area":   case "text_area":
          case "textbox":   case "text-box":    case "text_box":
          case "multiline": case "multi-line":  case "multi_line":
            this._field_type = "textarea";
            break;
          case "line":
          case (void 0):      case '':            case null:
          case "textfield":   case "text-field":  case "text_field":
          case "textline":    case "text-line":   case "text_line":
          case "text":
            this._field_type =  "text";
            break;
          default:
            throw 'unhandled field_type "'+this.options.field_type+'"';
        };
      };
      return this._field_type
    },
    events: function() {
      var e = {
            "change textarea" : "setAttribute",
            "change input"    : "setAttribute",
            "keypress input"     : "resizeTextInput",
            "click button.close" : "remove"
      };
      switch(this.updateOn) {
        case 'key':
        case 'keyup':
        case 'keypress':
          e["keyup input"] = "setAttribute";
          e["keyup textarea"] = "setAttribute";
        break;
      };
      switch(this.closeOn) {
        case 'blur':
          e["blur textarea"] = "remove";
          e["blur input"] = "remove";
          break;
      };
      return e;
    },
    setAttribute: function(change_event) {
      console.log('in TextInputView-setAttribute' );
      this.setValue($(change_event.currentTarget).val());
    },
    resizeTextInput: function(e) {
      var $input = $(e.currentTarget);
          $input.attr('size', _.min([255, ($input.val().length+2)]));
    },
    render: function () {
      var self = this,
          html,
          tagAtts = {
            value:  this.getValue()
          };
          if (this.getValue()) {
            tagAtts['size'] = this.getValue().length + 2;
          };
      if (this.options.borderless) { tagAtts['style'] = 'border:0;'; };
      html = t.formInput(this.formType(), self.options.label, tagAtts);
      this.$el.html( html );
      return this;
    }
  },
  //
  //Class Properties
  //
  {
    viewClassName: "TextInputView",
    optionsAttributes: ["label", "responseType"],
    editableOptionsAttributes: ["label"],
    canHaveResponseValues: false
  }
);

// Dynamo.InputGroupView
//  Displays a button group tied to a model attribute.
//  Required:
//    responseType: 'radio', 'checkbox', or 'select'; determines what type
//  The value of the model attribute is set upon each change in selection.
Dynamo.InputGroupView = Backbone.View.extend(
  {
    initialize: function() {
      this.cid = _.uniqueId('InputGroupView-');
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;
      this.groupType = this.options.responseType;
      this.groupOptions = this.options.responseValues || [{value: "value-1", label: "label-1" },{value: "value-2", label: "label-2" }]
      this.template = this.options.template || this.template;
      _.bindAll(this);
      // DO NOT BIND A MODEL CHANGE TO RENDER b/c change is reflected by the field changing by default in html anyway.
    },
    events: {
      "click div.label_and_input" : "setInput",
      "change select"             : "setAttribute",
      "change input"              : "setAttribute"
    },
    setAttribute: function (event) {
      console.log('in Dynamo.InputGroupView-setAttribute cid:'+this.cid);
      this.setValue($(event.currentTarget).val());
    },
    setInput: function(event) {
      var $i = $('input', event.currentTarget);
      $i.attr( 'checked', !$i.is(':checked') );
      this.setValue( $i.val() );
      this.$el.find('div.label_and_input').removeClass('hasSelectedInput');
      this.$el.find('div.label_and_input:has(input:checked)').addClass('hasSelectedInput');
    },
    template: '<div id="<%=id%>" name="<%= name %>_field" class="<%=type%>_group"> <% if (type == "select") { %> <%= t.span(label) %> <select name="<%= name %>"> <% _.each(options, function(o, index) { html_atts = { value: o.value }; if (selected_value == o.value) { html_atts.selected = "selected" }; print( t.formInput("option", o.label, html_atts) ); }); %> </select> <% }; %> <% if (type == "radio" || type == "checkbox") { %> <%= t.div(label) %> <% _.each(options, function(o, index) { html_atts = { name: name, value: o.value}; console.log("option: ", o, "html_atts: ", html_atts); if (selected_value == o.value) { html_atts.checked = "checked" }; print( t.div(t.formInput(type, o.label, html_atts), { class: "label_and_input" } ) ); }); %> <% }; %> </div>',
    _template: function(data, settings) {
      if (!this.compiled_template) {
        if (!this.template) { throw new Error("No valid template found") };
        this.compiled_template = _.template(this.template);
      };
      return this.compiled_template(data, settings);
    },
    render: function () {
      var self = this;
      self.$el.html( self._template({
        id: self.cid,
        name: (self.options.name || (self.groupType+'-group_'+self.cid)),
        label: (self.options.label || ''),
        selected_value: (self.getValue() || ''),
        type: self.groupType,
        options: self.groupOptions
      }) );
      return this;
    }
  },
  //
  //Class Properties
  //
  {
    viewClassName: "InputGroupView",
    optionsAttributes: ["label", "responseType", "responseValues"],
    editableOptionsAttributes: ["label"],
    canHaveResponseValues: true
  }
);

// Dynamo.InputRangeView
//  Allows the user to choose
//  one value from a range of values
//  Required attributes:
//    min_value,
//    max_value,
//    initial_value,
//    step
//    format: (currently limited to 'buttons' and 'slider')
//  Optional attributes:
//    low_end_text,
//    high_end_text
//  The value of the model attribute is set upon
//  each change in the value as selected
//  by the user according to the display_format.
Dynamo.InputRangeView = Backbone.View.extend(
  {

    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('InputSliderView-');
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;

      this.initial_value = parseInt((this.options.initial_value || this.options.min_value || 0));
      this.min_value = parseInt(this.options.min_value || 0);
      this.max_value = parseInt(this.options.max_value || 100);
      this.step = parseInt(this.options.step || 1);
      this.format = this.options.format

      // DO NOT BIND A MODEL CHANGE TO RENDER
      // b/c change is reflected naturally by slider movement.
    },

    setAttribute: function (ui_value) {
      console.log('in Dynamo.InputSliderView-setAttribute cid:'+this.cid);
      this.setValue(ui_value);
      this.$el.find('div.current_value:first').html( ui_value );
    },

    render: function () {
      var self = this, html;

      //build html
      html =  self.showValueHTML(self.initial_value) +
              self.endpointsHTML(self.options.low_end_text, self.options.high_end_text) +
              self.displayTypeHTML(self.format, {
                  min_value: self.min_value,
                  max_value: self.max_value,
                  step: self.step
              });

      //insert html
      this.$el.html(html);

      //post-process html
      switch(self.format) {
        case "buttons":
          $("span.range_buttons button", self.$el).click(function(e) {
            self.setAttribute( $(e.currentTarget).val() );
          });
          break;
        case "slider":
          self.instantiateSlider( self.$el.find("div.slider:first") );
          break;
        default:
          console.warn("No display format specified, defaulting to slider.");
          self.instantiateSlider( self.$el.find("div.slider:first") );
      };

      return this;
    },

    displayTypeHTML: function(format, atts) {

      switch(format) {
        case "buttons":
          return this.buttonsHTML(atts);
          break;
        case "slider":
          return this.sliderHTML();
        default:
          console.warn("No display format specified, defaulting to slider.");
          return this.sliderHTML();
      };

    },

    endpointsHTML: function(min_text, max_text) {
      return "" +
        "<div id='endpoints' style='width:80%; margin-left:10%; margin-right:10%;" +
                                    "font-size:0.9em;font-weight:bold;overflow:auto;'>" +
          "<div class='end_right' style='float:left;'>"+min_text+"</div>" +
          "<div class='end_left' style='float:right;'>"+max_text+"</div>" +
        "</div>"
    },

    instantiateSlider: function(selector) {
      var self = this;
      selector.slider({
        value: self.initial_value,
        min: self.min_value,
        max: self.max_value,
        step: self.step,
        slide: function( event, ui ) {
          self.setAttribute(ui.value)
        }
      });
      $(self.el).find('.ui-slider-handle').height(70);
      $(self.el).find('h2').css('font-size', "1.8em");
      if ( _.isFunction( selector.addTouch ) ) { selector.addTouch() }; //Touchable on pads/phones.
    },

    showValueHTML: function(value) {
      return "<div class='current_value' " +
              "style='width:30%; height:34px; min-height:34px; margin:0 auto; " +
                     "text-align:center; font-size:1.5em; color:black;' >" +
          value +
        "</div>";
    },

    buttonsHTML: function(atts) {
      return "<div style='margin:10px auto; text-align:center;'>" + (
        _.chain(_.range(atts.min_value, (atts.max_value + atts.step ), atts.step))
          .map(function(val) {
            return "<span class='range_buttons' style='margin:10px auto;'>" +
                      "<button value='"+val+"'>"+val+"</button>"+
                    "</span>"
          })
          .reduce(function(memo, snippet){
            return memo + snippet;
          }, "")
          .value()
      ) + "</div>";
    },

    sliderHTML: function() {
      return "<div class='slider' style='width:80%;margin: 2em 10% 10px 10%;height:60px;'></div>"
    },

  },
  //
  //Class Properties
  //
  {
    viewClassName: "InputRangeView",

    optionsAttributes: [
      "format",
      "min_value",
      "max_value",
      "low_end_text",
      "high_end_text",
      "initial_value",
      "step"
    ],

    // these are the attributes that are editable
    // when creating a question with a response
    // with this type of view.
    editableOptionsAttributes: [
      "format",
      "min_value",
      "max_value",
      "low_end_text",
      "high_end_text",
      "initial_value",
      "step"
    ],

    // how a particular editable option
    // will be presented to the user.
    // the default format is a Text Input
    // there is a default set of view options
    // that can be found w/in the render function
    // of the Dynamo.Mantle.Questions.Views
    // editResponseView class.
    editableOptionsInputTypes: {
      "format" : [ 'select',
          {
            responseType: 'select',
            responseValues: [ { label: 'slider',  value: 'slider'  },
                            { label: 'buttons', value: 'buttons' }]
          }
      ]
    },

    canHaveResponseValues: false
  }
);



// Dynamo.InputSliderView
//  Displays a jquery slider tied to a model attribute.
//  Required options:
//    low_end_text,
//    high_end_text,
//    initial_value,
//    min_value,
//    max_value,
//    step
//  The value of the model attribute is set upon
//  each change in the value of the slider.
Dynamo.InputSliderView = Backbone.View.extend(
  {
    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('InputSliderView-');
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;

      this.initial_value = parseInt((this.options.initial_value || this.options.min_value || 0));
      this.min_value = parseInt(this.options.min_value || 0);
      this.max_value = parseInt(this.options.max_value || 100);
      this.step = parseInt(this.options.step || 1);

      // DO NOT BIND A MODEL CHANGE TO RENDER
      // b/c change is reflected naturally by slider movement.
    },
    setAttribute: function (ui_value) {
      console.log('in Dynamo.InputSliderView-setAttribute cid:'+this.cid);
      this.setValue(ui_value);
      this.$el.find('div.current_value:first').html( ui_value );
    },
    render: function () {
      var self = this, $slider;
      this.$el.html(
        "<div class='current_value'>"+
          self.initial_value +
        "</div>" +
          "<div id='endpoints' style='width:80%;margin-left:10%;margin-right:10%;font-size:0.9em; font-weight:bold;overflow:auto;'>" +
            "<div class='end_right' style='float:left;'>"+ this.options.low_end_text +"</div>" +
            "<div class='end_left' style='float:right;'>"+ this.options.high_end_text +"</div>" +
          "</div>" +
        "<div class='slider' style='width:80%;margin-left:10%;margin-right:10%; margin-top:1em; height:60px;'></div>" +
        "<div style='height:10px;'></div>");
      //make the slider;
      $slider = this.$el.find("div.slider:first");
      $slider.slider({
        value: self.initial_value,
        min: self.min_value,
        max: self.max_value,
        step: self.step,
        slide: function( event, ui ) {
          self.setAttribute(ui.value)
        }
      });
      $(this.el).find('.ui-slider-handle').height(70);
      $(this.el).find('h2').css('font-size', "1.8em");

      //add touch support on pads and phones.
      _.isFunction( $slider.addTouch ) ? $slider.addTouch() : undefined;

      return this;
    }
  },
  //
  //Class Properties
  //
  {
    viewClassName: "InputSliderView",

    optionsAttributes: [
      "low_end_text",
      "high_end_text",
      "initial_value",
      "min_value",
      "max_value"
    ],
    editableOptionsAttributes: [
      "low_end_text",
      "high_end_text",
      "initial_value",
      "min_value",
      "max_value"
    ],

    canHaveResponseValues: false
  }
);


//
//
// Aspect Views
//
// These views abstract away a particular type of commonality across any possible
// collection or model.
// e.g. the 'ChooseFromCollectionView' is a user interface
// that lets the user select one model out of a collection,
// regardless of what is contained within the collection
//
//

//  Dynamo.ChooseFromCollectionView
//  expects:
//    - A Dynamo collection of Xelements
//  description:
//    In many circumstances w/in the UI, it may be necessary to select one model from a collection of models.
//    pass this view a collection of models, and it will trigger on itself a backbone event ('element:chosen')
//    when the user clicks on a particular model w/in the collection.  The chosen model will be available from
//    this.chosen_element
//
//  options:
//    - onChoose: callback function (passed the click event) that runs when a user selects an xelement.
//      Default behavior sets this.chosen_element to the chosen model and triggers an 'element:chosen'
//      event on the view.
//    - chooseOn: the attribute of the xelement that should be displayed for the user to choose from.
//      Defaults to 'title'
//    - modelHTML: function that returns what HTML should be displayed for an element. Defaults to
//      a span containing the value of the xelement's 'chooseOn' attribute.
Dynamo.ChooseOneXelementFromCollectionView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    this.chooseOn = (this.options.chooseOn ? this.options.chooseOn : 'title');
    if (this.options.onChoose) { this.chooseXelement = this.options.onChoose };
    if (this.options.modelHTML) { this.modelHTML = this.options.modelHTML };
  },
  events: {
    "click button.create_new" : "createNewXelement",
    "click span.choose_element" : "chooseXelement"
  },
  createNewXelement: function(clickEvent) {
    var mantleClass = Dynamo.typeToModelClass(clickEvent.currentTarget.dataset.xelement_type);
    this.chosen_element = new mantleClass();
    this.trigger("element:chosen");
  },
  chooseXelement: function(clickEvent) {
    var current_guid = clickEvent.currentTarget.dataset.guid;
    this.chosen_element = this.collection.get(current_guid);
    this.trigger("element:chosen");
  },
  modelHTML: function(m) {
    return t.span( m.get_field_value(this.chooseOn) );
  },
  template: function(data, settings) {
    if (!this._template) { this._template = templates.choose_one_xelement };
    return _.template(this._template, data, settings)
  },
  render: function() {
    var self = this;
    var elements = this.collection.map(function(m) { return { id: m.id, html: self.modelHTML(m) }  });
    this.$el.html(
      this.template({
        collection_name: (this.options.collection_name || this.collection.prettyModelName()),
        elements: elements,

        canCreateNew: this.options.canCreateNew,
        xelement_type: this.options.xelement_type,
        element_pretty_name: this.options.element_pretty_name
      })
    );
    return this;
  }
})

// Dynamo.SaveableModelView
//  Any View which has models or data that the user can save
//  can inherit from this view which provides a set of functions
//  related to viewing the current save state,
//  or setting up periodic saving and triggering a save
Dynamo.SaveableModelView = Backbone.View.extend({
  initializeAsSaveable: function(saveableModel) {
    this.saveableModel = saveableModel;
    this.saveableModel.initializeAsSaveable();
    this.saveableModel.on('save_status_change', this.renderSaveStatus);
    this.on('saveable:save_now', this.saveSaveableModel);
  },

  saveableEvents: {
      'focusin'  : "setUserBusy",
      'focusout' : "clearUserBusy"
  },

  // Assumes you have an elment in the view like so:
  // <[some_tag: div, span, etc?] class='save_status'></[some_tag]>
  renderSaveStatus: function() {
    this.$el.find('.save_status:first').removeClass(this.saveableModel.saveStates.join(' '));
    this.$el.find('.save_status:first').addClass(this.saveableModel.currentSaveState());
    this.$el.find('.save_status:first').html(this.saveableModel.currentSaveText());
  },

  saveSaveableModel: function() {
    this.saveableModel.save();
  },

  saveifUserNotBusy: function () {
    if ( !this.isUserBusy() ) { this.trigger('saveable:save_now') };
  },

  // saving / recurrent-saving functions
  startPeriodicModelSaving: function(interval_in_seconds) {
    if (!interval_in_seconds) { throw new Error("startPeriodicModelSaving() interval_in_seconds cannot be "+interval_in_seconds) }
    console.log("in startPeriodicModelSaving in view");
    if (!this._modelSavingActive) {
      console.log("currently model saving NOT Active");
      this.saveableModel.startPeriodicSaving(interval_in_seconds);
      this.on('remove', this.stopPeriodicModelSaving);
      this._modelSavingActive = true;
      console.log("Xel may suggest save at most every "+interval_in_seconds+" seconds.");
    }
  },

  stopPeriodicModelSaving: function() {
    console.log("in stopPeriodicModelSaving in view");
    this.saveableModel.stopPeriodicSaving();
    this._modelSavingActive = false;
  },

  // along with the saveableEvents hash defined above,
  // set a view property which answers the question:
  // "is the user focused on this view right now?"
  clearUserBusy: function () {
    this._userBusy = false;
  },

  isUserBusy: function () {
    return this._userBusy
  },

  setUserBusy: function () {
    this._userBusy = true;
  }

});


Dynamo.BaseUnitaryXelementView = Dynamo.SaveableModelView.extend({

  editTextFieldInPopup: function(field, click_event) {

    var self = this,
        popupView,
        $clicked_on = $(click_event.currentTarget);

    popupView = new Dynamo.TextInputView({
      responseType: 'line',
      updateOn: 'keypress',
      closeOn: 'blur',
      label: '',
      getValue: function() {
        return self.model.get_field_value(field);
      },
      setValue: function(new_value) {
        return self.model.set_field_value(field, new_value);
      }
    });

    $clicked_on.after(popupView.$el);
    popupView.render();

  },

  initializeAsUnitaryXelement: function() {
    // Adds methods related to saving
    this.initializeAsSaveable(this.model);
  },

  // initial_render convenience tracker functions
  initiallyRendered: function() { return (!!this._initialRender); },
  setInitialRender: function() { this._initialRender = true; },
  clearInitialRender: function() { this._initialRender = false; },
  completeRender: function() {
    this.clearInitialRender();
    this.render();
  }

});


//Dynamo.ManageCollectionView (mcw)
//
//On instantiation, mcw expects :
//
//1) A collection
//2) either that:
//    a) All models in the collection each have:
//      - a 'viewClass' attribute which returns a Backbone View Class
//      - an 'editViewClass' attribute which returns a Backbone View Class
//    b) To pass in an apporpriate view class for 'viewClass' and/or 'editViewClass'
//
//3) That those View Classes can be instantiated w/
//   a model from the collection (and nothing else).
//
//4) That those View Classes can also be passed an option, 'position'
//   which is their index in the collection.
//
//options:
//  - addAtIndexHandler: callback function, passed the click event as an argument,
//    responsible for handling the addition of a model to the collection at the appropriate index.
//    the index is available as clickEvent.srcElement.
//    Default behavior is to called when one of the
Dynamo.ManageCollectionView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this);
    this.start_content = this.options.start_content || '';
    this.end_content = this.options.end_content || '';
    this.display = this.options.display || { show: true };
    this.collection.on("reset", this.render);
    this.collection.on("add", this.render);
    this.collection.on("remove", this.render);
  },

  events: function() {
    var self = this, e ={};
    e[("click button.insert."+self.collection.codeModelName())] = "addAtIndexHandler";
    e[("click button.delete."+self.collection.codeModelName())] = "removeElement";
    return e;
  },

  // Default implementation of addAtIndexHandler;
  // Is overridden if view options has specified it's own addAtIndexHandler.
  // Default implementation allows handling the cases when:
  // 1) only newly created elements can be added to the collection
  // 2) existing elements of the same Model class as accepted by the view's
  //    collection (but that are not already a part of it) can also be
  //    added to the collection.
  //
  //    In this case,
  addAtIndexHandler: function(clickEvent) {

    if (this.options.addAtIndexHandler) { return this.options.addAtIndexHandler() };

    if (this.options.enableAddExisting) {
      this.addNewOrExistingAtIndexDialog(clickEvent, this.addNewAtIndex, this.chooseExistingToAddAtIndex);
    } else {
      var index = clickEvent.currentTarget.dataset.collection_index;
      this.addNewAtIndex(index);
    };

  },

  //  When someone clicks 'New [Model Class]' on an instantiation of the
  //  ManageCollectionView, they may want the choice to
  //  create an entirely new [Model Class] instance,
  //  or to select an existing [Model Class] instance.
  //  if the option to add existing [Model Class] instances is enabled,
  //  then this function creates the dialog that allows the user to choose
  //  between the options of 'New' or 'Existing' and
  //  then handles the result of the user's selection.
  addNewOrExistingAtIndexDialog: function(clickEvent, newAtIndexCallback, existingAtIndexCallback) {

    var self = this,
        $btn_clicked = $(clickEvent.currentTarget),
        // Fetch the current index at which we want to insert a question.
        element_index = parseInt($btn_clicked.attr("data-collection_index"));

    //insert dialog
    $btn_clicked.after(""+
      "<div class='add_dialog'>"+
        "<button class='add_new'>New</button>" +
        "<button class='add_existing'>Existing</button>"
      +"</div>");

    //find inserted dialog
    $add_dlg = $btn_clicked.parent().find("div.add_dialog");

    //add_new element handler
    $add_dlg.find("button.add_new").click(function() {
      newAtIndexCallback(element_index);
      //cleanup
      $add_dlg.remove();
      $add_dlg = null;
    });

    //add_existing element handler
    $add_dlg.find("button.add_existing").click(function() {
      existingAtIndexCallback(element_index)
      //cleanup
      $add_dlg.remove();
      $add_dlg = null;
    });

  },

  //Default implementation of addNewAtIndex;
  //called by default addAtIndexHandler can be overridden
  //by passing in an addNewAtIndex method as an option.
  addNewAtIndex: function(element_index) {
    console.log('inserting '+ this.collection.prettyModelName()+' - at location: '+ element_index);
    this.collection.add({}, {at: element_index});
  },

  addExistingAtIndex: function(element, element_index) {
    console.log('inserting '+ this.collection.prettyModelName(),
                "id:", element.id, 'Location: ', element_index);
    this.collection.add(element, { at: element_index });
  },

  //getExistingAddablesCollection is an abstract method
  //meant to be passed in as an option on instantiation or overridden
  //getExistingAddablesCollection is called by 'chooseExistingToAddAtIndex',
  //and should return either a Dynamo.Collection or
  //a Backbone.Collection where:
  //1)  it's models are the same model class accepted by ManageCollectionView's collection.
  //2)  it responds to the property 'codeCollectionName', returning a string
  //3)  it responds to the function 'prettyModelName', returning a string
  //
  //Alternatively, you could perform more complicated logic
  //by overriding the 'chooseExistingToAddAtIndex' or
  //the subsequent call to 'onChoosingModelToAdd' methods to your own ends.
  getExistingAddablesCollection: function() {

    if (this.options.getExistingAddablesCollection) {
      return this.options.getExistingAddablesCollection()
    }

    throw new Error("" +
      "ManageCollectionView:getExistingAddablesCollection is an abstract method "+
      "which must be defined by the user or passed in on instantiation");

  },

  chooseExistingToAddAtIndex: function(element_index) {

    if (this.options.chooseExistingToAddAtIndex) {
      return this.options.chooseExistingToAddAtIndex(element_index, this);
    }


    var self = this,
        $popup,
        existingAddables = self.getExistingAddablesCollection();

    var chooseExistingViewOptions = {
        canCreateNew: false,
        xelement_type: null,
        element_pretty_name: null,
        collection_name: existingAddables.codeCollectionName,
        collection: existingAddables
      }
    if (this.options.chooseExistingViewOptions) {
      chooseExistingViewOptions = _.extend(chooseExistingViewOptions, this.options.chooseExistingViewOptions)
    }

    // Allow the user to choose a Question Group view
    self.chooseExistingModelView = new Dynamo.ChooseOneXelementFromCollectionView(chooseExistingViewOptions);
    self.chooseExistingModelView.on('element:chosen', function() {
      self.onChoosingModelToAdd(self.chooseExistingModelView.chosen_element, element_index);
    });

    self.$popup = renderInDialog(self.chooseExistingModelView, {
      title: "Add a "+self.collection.prettyModelName()+" (in position "+(element_index+1)+")"
    });


    // if ( $('div#popup_container').length == 0 ) {
    //   $('body').append('<div id="popup_container"><div>')
    // };
    // self.$popup = $('div#popup_container');

    // //Show the dialog
    // self.$popup.empty();

    // self.$popup.dialog({
    //   autoOpen: true,
    //   modal: true,
    //   width: "auto",
    //   height: "auto",
    //   title: "Add a "+self.collection.prettyModelName()+" (in position "+(element_index+1)+")",
    //   position: { my: "right top", at: "right top" },

    //   close: function (beforeCloseEvent) {
    //     //Attempt to cleanup / avoid mem leaks.
    //     self.trigger('chooseExistingModelView:close');

    //     if (self.chooseExistingModelView) { self.chooseExistingModelView.remove() };
    //     self.chooseExistingModelView = null;
    //     $chooseQcontainer = null;
    //   }

    // });

    // self.$popup.append( self.chooseExistingModelView.$el );
    // self.chooseExistingModelView.render();

  },

  onChoosingModelToAdd: function(chosen_element, element_index) {

    if (this.options.onChoosingModelToAdd) {
      return this.options.onChoosingModelToAdd(chosen_element, element_index, this)
    };

    if (self.$popup) { $popup.dialog("close"); }
    return this.addExistingAtIndex(chosen_element, element_index);

  },

  removeElement: function(clickEvent) {
    var element_index = clickEvent.currentTarget.dataset.collection_index;
    console.log('removing: '+ this.collection.prettyModelName()+' - at location: '+ element_index);
    this.collection.remove(this.collection.at(element_index));
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.manage_collection_widget;
    }
    return _.template(this._template, data, settings);
  },

  elementTemplate: function(data, settings) {
    if (!this._elementTemplate) {
      this._elementTemplate = templates.collection_widget_element;
    }
    return _.template(this._elementTemplate, data, settings);
  },

  viewClassOr: function(model) {
    if (!!this.options.viewClass) { return this.options.viewClass }
    return model.viewClass();
  },

  editViewClassOr: function(model) {
    if (!!this.options.editViewClass) { return this.options.editViewClass }
    return model.editViewClass();
  },

  render: function() {
    var self = this,
        $elements,
        root_element,
        view_class,
        view_options,
        view;

    this.$el.html(this.template({
      start_content: this.start_content,
      element_code_name: this.collection.codeModelName(),
      element_pretty_name: this.collection.prettyModelName(),
      display: this.display,
      num_elements: self.collection.length,
      end_content: this.end_content
    }));

    $elements = self.$el.find('div.collection_widget:first > div.elements:first');

    self.collection.each(function(model, index) {

      $elements.append(
        self.elementTemplate({
          index: index,
          display: self.display,
          element_code_name: self.collection.codeModelName(),
          element_pretty_name: self.collection.prettyModelName()
        })
      );

      root_element = $elements.children('div.element').last();

      if (self.display.show) {
        view_class = self.viewClassOr(model);
        view_options = self.options.viewOpts || {};
        view_options = _.extend(view_options, {
          model: model,
          position: (index+1)
        });
        view = new view_class(view_options);
        view.setElement( root_element.find("div.show_container:first") );
        view.render();
      };

      if (self.display.edit) {
        view_class = self.editViewClassOr(model);
        view_options = self.options.editViewOpts || {};
        view_options = _.extend(view_options, {
          model: model,
          position: (index+1)
        });
        view = new view_class(view_options);
        view.setElement( root_element.find("div.edit_container:first") );
        view.render();
      };

    });

    return this;
  }

});

Dynamo.ShowGroupView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('Dynamo.ShowGroupView-');
    this.subViews = [];
    this.position = this.options.position
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  addSubView: function(view) {
    this.subViews.push(view);
  },

  attributes: function() {
    return {
      id: "group-"+this.model.cid,
      class: "group"
    }
  },

  remove: function() {
    this.$el.remove();
    this.removeSubViews();
  },

  removeSubViews: function() {
    _.each(this.subViews, function(sub_view) {
      sub_view.remove();
      sub_view = null;
    });
    this.subViews = [];
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.show_group;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {

    //render template
    var self, view_class, view;

    console.log('-> ShowGroupView render');

    self = this;
    self.$el.html( self.template({
        position: this.position,
        group: this.model.toJSON()
      })
    );

    if (!self.usersView) {
      $groups = this.$el.find('div.groups:first');
      self.usersView = new Dynamo.ManageCollectionView({
        collection: this.model.users,
        display:{ show: true, edit: false, del: false },
        enableAddExisting: true,
        getExistingAddablesCollection: this.options.existingUsers
      });
      $groups.append(self.usersView.$el)
    };

    self.usersView.render();

    return this;
  }
});

Dynamo.EditGroupView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('ShowGroupView-');
    this.subViews = [];
    this.position = this.options.position
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  addSubView: function(view) {
    this.subViews.push(view);
  },

  attributes: function() {
    return {
      id: "group-"+this.model.cid,
      class: "group"
    }
  },

  remove: function() {
    this.$el.remove();
    this.removeSubViews();
  },

  removeSubViews: function() {
    _.each(this.subViews, function(sub_view) {
      sub_view.remove();
      sub_view = null;
    });
    this.subViews = [];
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.show_group;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {

    //render template
    var self, view_class, view;

    console.log('-> ShowGroupView render');

    self = this;
    self.$el.html( self.template({
        position: this.position,
        group: this.model.toJSON()
      })
    );

    // if (!self.usersView) {
      $users = this.$el.find('div.users:first');
      self.usersView = new Dynamo.ManageCollectionView({
        collection: this.model.users,
        display:{ show: true, edit: true, del: false }
      });
      $users.append(self.usersView.$el)
    // };

    self.usersView.render();

    return this;
  }
});

//
Dynamo.ShowXelementSimpleView =  Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('ShowXelementSimpleView-');
    this.position = this.options.position
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);
    this.atts_to_display = this.options.atts_to_display || []

  },

  attributes: function() {
    return {
      id: "xelement-"+this.model.cid,
      class: this.model.get_field_value("xelement_type"),
      "data-position": this.position
    }
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) { this.template = templates.show_xelement_simple; }
      this.compiled_template = _.template(this.template);
    };
    return this.compiled_template(data, settings);
  },

  render: function() {
    console.log('-> ShowXelementSimpleView#render');

    var self, view_class, view;
    self = this;

    var atts_values = { title: self.model.get_field_value("title") };

    _.each(this.atts_to_display, function(att) {
      atts_values[att] = self.model.get_field_value(att);
    });

    self.$el.html( self._template({data: atts_values}) );

    return this;
  }

});


Dynamo.ShowUserView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('Dynamo.ShowUserView-');
    this.position = this.options.position
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  attributes: function() {
    return {
      id: "user-"+this.model.cid,
      class: "user"
    }
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.show_user;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {
    console.log('in ShowUserView render');

    //render template
    var self, view_class, view;

    self = this;

    self.$el.html( self.template({
        position: this.position,
        user: this.model.toJSON()
      })
    );

    return this;
  }

});

Dynamo.EditUserView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('ShowUserView-');
    this.position = this.options.position
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  attributes: function() {
    return {
      id: "user-"+this.model.cid,
      class: "user"
    }
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.edit_user;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {

    //render template
    var self, view_class, view;

    console.log('in ShowUserView render');

    self = this;
    self.$el.html( self.template({
        position: this.position,
        user: this.model.toJSON()
      })
    );

    return this;
  }

});



//The purpose of this view is to allow programming that still
//uses backbone for what it is good at:
//separating concerns related to a model and view, 
//and to allow continued use of backbone collections
//
//But to then allow you to seemlessly use Knockout 
//at what it is good at: declarative binding of 
//dom elements to model attributes, with integrated dom manipulation.
ModelBackoutView = Dynamo.ModelBackoutView = Backbone.View.extend({

  initialize: function() {
    _.extend(this, Backbone.Events);
    _.bindAll(this);
    // Because Knockout will sync between model values & DOM elements, 
    // no need to re-render on model change.
  },

  modelAtts: function() {
    var atts;
    if (this.options.modelAttsFn) {
      atts = this.options.modelAttsFn(this.model);
    }
    else {
      atts = this.model.attributes;
    };
    return _.extend({}, atts, {id: this.model.id, cid: this.model.cid });
  },

  createKnockoutModel: function() {
    var self = this, modelAtts;
    //wipe away any previous model:
    self.knockoutModel = null;
    delete self.knockoutModel;

    self.knockoutModel = {};
    self.knockoutModel.view = self;
    //in case you ever want to force a re-computation of a computed,
    //you can place a call to the value of this dummyObservable in the computed,
    //and then call self.knockoutModel.dummyObservable.notifySubscribers();
    //when you want to trigger a recomputation: 
    self.knockoutModel.dummyObservable = ko.observable(null); 

    _.each(this.modelAtts(), function(value, attr_name) {
      
      // Ignore attributes which come from computedAtts, 
      // as those will be handled separately.
      if ( !self.options.computedAtts || !self.options.computedAtts[attr_name]) {
        self.createKnockoutModelAttribute(attr_name, value)  
        self.setBackboneAndKnockoutBindings(attr_name);        
      };

    });

    if (self.options.computedAtts) {
      _.each(self.options.computedAtts, function(computeObj, attr_name) {
        
        if (!computeObj.owner) { computeObj.owner = self.knockoutModel };
        self.knockoutModel[attr_name] = ko.computed(computeObj);
        if (computeObj.write) {
          self.setBackboneAndKnockoutBindings(attr_name);
        };
        
      });
    };    

    self.knockoutModel.save = function() {
      self.triggerSave();
    };

    self.knockoutModel.destroy = function() {
      self.triggerDelete();
    };    

    this.model.on('sync', function(syncArg1, syncArg2, syncArg3) {
      console.log("sync callback is passed:", syncArg1, syncArg2, syncArg3);
      alert('Saved.');
    });

  },

  createKnockoutModelAttribute: function(attr, value) {
    var self = this;
    //maybe in the future?
    if ( !_.isArray(value) && 
         !_.isDate(value) &&
          _.isObject(value) ) { 
      throw new Error("Unhandled case: attribute '"+attr+"'\'s value is an object.")
    };

    console.log("Attr, Value:", attr, value);

    if ( _.isDate(value) ) {
      self.knockoutModel[attr+"_year"] = ko.observable(value.getFullYear());
      self.knockoutModel[attr+"_month"] = ko.observable(value.getMonth());
      self.knockoutModel[attr+"_date"] = ko.observable(value.getDate());
      self.knockoutModel[attr+"_hour"] = ko.observable(value.getHours());
      self.knockoutModel[attr+"_minute"] = ko.observable(value.getMinutes());
      self.knockoutModel[attr] = ko.computed({
        read: function() {
          var s = this;
          return ( new Date(s[attr+"_year"](), 
                            s[attr+"_month"](), 
                            s[attr+"_date"](), 
                            s[attr+"_hour"](), 
                            s[attr+"_minute"]() ) 
                  );                
        },
        write: function(new_time) {
          self.knockoutModel[attr+"_year"](new_time.getFullYear());
          self.knockoutModel[attr+"_month"](new_time.getMonth());
          self.knockoutModel[attr+"_date"](new_time.getDate());
          self.knockoutModel[attr+"_hour"](new_time.getHours());
          self.knockoutModel[attr+"_minute"](new_time.getMinutes());          
        },
        owner: self.knockoutModel
      });
      return self.knockoutModel[attr];
    };

    // An array will benefit from having available add and remove functions.
    if ( _.isArray(value) ) {

      // The default value of an element of the array can be 
      // (and probably should) be passed in as an option.
      var defaultElValue = self.options.arrayDefaults[attr],

          //each element in the knockout array will be more
          //than just a singular value, in order to allow removal
          elConstructor = function(element_value) {
            return {
              value: ko.observable(element_value),
              remove: function() { 
                self.knockoutModel[attr].remove(this)
              }
            }
          };

      // Define each element in the array to be composed of 
      // an instance of the above constructor
      self.knockoutModel[attr] = ko.observableArray(
        _.map(value, function(el) { return new elConstructor(el) })
      );
      
      // Define an add element function for this attribute;
      self.knockoutModel[attr+"_addElement"] = function() {
        var newEl = new elConstructor(defaultElValue)
        self.knockoutModel[attr].push( newEl );
        
        //when this new element changes value,
        //notify subscribers of the array that the value of the array has changed.
        newEl.value.subscribe(function(newElementValue) {
          self.knockoutModel[attr].notifySubscribers(self.knockoutModel[attr]());
        });
      };

        //when any existing element changes value,
        //notify subscribers of the array that the value of the array has changed.
      _.each(self.knockoutModel[attr], function(el) {
        el.value.subscribe(function(newElementValue) {
          self.knockoutModel[attr].notifySubscribers(self.knockoutModel[attr]());
        });
      });

      return self.knockoutModel[attr];
    };

    if (  _.isString(value) || 
          _.isFinite(value) ||  
          _.isBoolean(value) 
       ) {
      console.log("setting "+attr+" to "+value);
      this.knockoutModel[attr] = ko.observable(value);
      return self.knockoutModel[attr];
    };

    if ( _.isNull(value) || 
         _.isUndefined(value)
       ) {
      this.knockoutModel[attr] = ko.observable(false);
      return self.knockoutModel[attr];
    };

  },

  setBackboneAndKnockoutBindings: function(attr_name) {
    var self = this;

    //If any change is made to a model attribute (in backbone), 
    //the knockout model needs to be updated accordingly.
    this.model.on('change:'+attr_name, function() { self.updateKnockoutModelAttribute(attr_name) } )

    //Any changes that knockout will make to the view,
    //We want to make to our backbone model.
    //HOWEVER, we cannot trigger a normal change event on the backbone model,
    //or we will enter an infinite loop due to the needed on-change
    //code above.
    //So, instead, we call set with {silent:true} and 
    //trigger a different event on the backbone model - 'change:fromKnockout';
    this.knockoutModel[attr_name].subscribe(function(newValueFromKnockout) {
      if (typeof(newValueFromKnockout) !== "undefined") {
        var set_obj = {};
        console.log("updating "+attr_name, newValueFromKnockout);
        
        if (_.isArray(newValueFromKnockout)) {
          // Array elements have been wrapped in an object
          // as detailed in the createKnockoutModelAttribute method.
          // in the transition back to backbone, we need to access the original value.
          set_obj[attr_name] =  _.compact(_.map(newValueFromKnockout, function(el) { return el.value() }));
        }
        else {
          set_obj[attr_name] = newValueFromKnockout; 
        };
         
        self.model.set_field_values(set_obj, { silent:true });
        self.model.trigger("change:fromKnockout");
        self.model.trigger("change:fromKnockout:"+attr_name);        
      };
    });
  },

  //a knockout Template is required to 
  //be either passed into the view
  //or defined by the model.
  knockoutTemplate: function() {
    var template = this.options.knockoutTemplate || this.model.get("knockoutTemplate")
    if (template) {
      return template;
    } else {
      throw new Error("No knockout template available.");
    }
  },

  //use the correct Knockout method to make a change
  //to an attribute on the knockout model.
  updateKnockoutModelAttribute: function(attr, value) {
    if (typeof(value) == undefined) { value = this.model.get_field_value(attr) };
    var observableFunction = this.knockoutModel[attr];
    if ( ko.isWriteableObservable(observableFunction) ) {
      observableFunction(value);  
    }
    else {
      console.warn("tried to update non-writeable knockout attr: ", attr, value);
    };
    
  },

  //although rare, it is conceivable we may want to update
  //all Knockout Model attributes under certain conditions.
  updateKnockoutModel: function() {
    var self = this;
    _.each(this.modelAtts(), function(val, attr) {
      self.updateKnockoutModelAttribute(key, val);
    });
  },

  //render function is greatly simplified
  //as the supplied template will do all the 
  //heavy lifting!
  render: function() {
    this.$el.html( this.knockoutTemplate() );
    this.createKnockoutModel();
    ko.applyBindings(this.knockoutModel, this.$el.get(0));
    return this;
  },

  triggerSave: function() {
    this.trigger('model:save');
  },

  triggerDelete: function() {
    this.trigger('model:delete');
  }

});

// ************************************************
//
// View Helper Vars and Functions
//
// ************************************************
//

renderInDialog = function(view, dialog_opts) {
  var $popup, opts;

  opts = {
    autoOpen: true,
    modal: true,
    width: "auto",
    height: "auto",
    position: { my: "right top", at: "right top" },

    close: function (beforeCloseEvent) {
      //Attempt cleanup / avoid mem leaks.
      view.trigger('close');
      view.remove()
      view = null;
    }
  };

  opts = _.extend(opts, dialog_opts);

  // Global Popup Container
  if ( $('div#popup_container').length == 0 ) {
    $('body').append('<div id="popup_container"><div>')
  };

  $popup = $('div#popup_container');
  $popup.empty();
  $popup.dialog(opts);
  $popup.append( view.$el );
  view.render();

  return $popup;
};


// Select the appropriate view class for a for a particular type of form input
viewClassForInputType = function (input_type) {
  var self = this
  switch( input_type ) {
    case "text": case "textarea":
      return Dynamo.TextInputView;
      break;
    case "radio": case "select": case "checkbox":
      return Dynamo.InputGroupView;
      break;
    case "range":
      return Dynamo.InputRangeView;
      break;
    case "slide": case "slider":
      return Dynamo.InputSliderView;
      break;
    default:
      throw "viewClassForInputType: No view class defined for input_type '"+input_type+"'";
      break;
  };
};

function HTMLizeJSON(obj) {
  html = "";
  _.each(obj, function(value, key) {
    if ( _.isObject(value) ) {
      html = html +
            "<div>"+
              "<span class='key'>"+key+"</span>" +
              "<span class='value'><div class='sub_object'>"+(HTMLizeJSON(value))+"</div></span></div>";
    }
    else if ( _.isArray(value) ) {
      html = html + "<div><span class='key'>"+key+"</span>"+"<span class='value'><div class='array'>"+(_.each( value, function(el) { return HTMLizeJSON(el)} ))+"</div></span></div>";
    }
    else {
      html = html + "<div><span class='key'>"+key+"</span>"+"<span class='value'>"+value+"</span></div>";
    }
  })
  return html;
}
