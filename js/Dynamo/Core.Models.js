//  
//  
//  Dynamo.Core.Models.js
// 
// 
//  Dependencies:
//    - Dynamo.Core.js


// Dynamo.Model
// Although currently no special functionality, all other models should
// at least inherit from this one, and not from Backbone.Model directly for encapsulation.
Dynamo.Model = Backbone.Model.extend({

});


// Dynamo.SaveableModel
// Adds a Bevy of Methods and Functionality related to Saving.
SaveableModel = Dynamo.SaveableModel = Dynamo.Model.extend({
  // Attributes
  saveStates: ['new', 'unsaved_changes', 'current'],
  codeName: 'saveable',
  prettyName: 'Saveable Model',

  initializeAsSaveable: function() {
    this.on('change', this.logChange);
    this.on('change', this.setUnsavedChanges);
    this.on('sync',   this.clearUnsavedChanges);
  },

  logChange: function () { 
    console.log("Xelement<cid="+this.cid+"> - "+this.prettyName+" changed");
  },
  
  currentSaveState: function() {
    if (this.isNew()) { return 'new' };
    if (this.hasUnsavedChanges()) {return 'unsaved_changes' };
    return 'current';
  },

  currentSaveText: function() {
    switch (this.currentSaveState()) {
      case 'new':
        return 'Unsaved';
      case 'unsaved_changes':
        return 'Unsaved changes'
      case 'current':
        return 'All changes saved'
    };
  },

  startPeriodicSaving: function(interval_in_seconds) {
    console.log('started Periodic saving at the model level every '+interval_in_seconds+' seconds');
    var self = this, saveIntervalID;
    if (!this.currentSaveIntervalID) {
      this.currentSaveIntervalID = setInterval(self.suggestSaveIfChanged, interval_in_seconds*1000);
    } else {
      console.warn("Attempted to initiate interval-initiated-save of Model<cid: "+this.cid+">"+
        " but it is already being saved at an interval.  Command Ignored. Current Interval ID is: "+ this.currentSaveIntervalID);
    } 
    this.on('change', this.setUnsavedChanges); 
    this.on('destroy', this.stopPeriodicSaving);
  },

  stopPeriodicSaving: function() {
    console.log('stopping scheduled saving at the model level');
    clearInterval(this.currentSaveIntervalID);
    this.currentSaveIntervalID = null;
  },

  hasUnsavedChanges: function() {
    return !!this._unsavedChanges;
  },

  setUnsavedChanges: function() {
    if (this._unsavedChanges != true) { this.trigger('save_status_change') };
    this._unsavedChanges = true;
  },

  clearUnsavedChanges: function() {
    if (this._unsavedChanges != false) { this.trigger('save_status_change') };
    this._unsavedChanges = false;
  },

  suggestSaveIfChanged: function() {
    console.log("in suggestSaveIfChanged; this._unsavedChanges= "+ this._unsavedChanges);
    if (this.hasUnsavedChanges()) {
      console.log("Suggesting Xelements Save on:");
      console.log(this);
      this.trigger('ModelSaysSave');
    };
  }

});

ReadOnlyModel = Dynamo.ReadOnlyModel = Dynamo.Model.extend({
  codeName: 'read_only',
  prettyName: 'Read-Only Model',

  sync: ReadOnlySync

});



User = Dynamo.User = Dynamo.Model.extend({

  codeName: 'user',
  prettyName: 'User',
  idAttribute: "guid",

  initialize: function() {
    return _.bindAll(this);
  },

  defaults: {
    username: "guest_user",
    created_at: new Date(),
    group_id: "DEFAULT_GROUP_GUID"
  },

  get_field_value: function(attribute) {
    return this.get(attribute);
  },  

  set_field_value: function() {
    return this.set(arguments);
  },

  viewClass: function() { return Dynamo.ShowUserView; },

  editViewClass: function() { return Dynamo.EditUserView; },
  
  urlRoot: function() { return Dynamo.TriremeURL+'/users' },

});

Group = Dynamo.Group = Dynamo.Model.extend({

  codeName: 'group',
  prettyName: 'Group',
  idAttribute: "guid",

  initialize: function() {
    _.bindAll(this);
    var self = this;

    var user_ids = self.get_field_value('users');

    this.users = new Dynamo.UserCollection( USERS.filter(function(user) {
      return (_.indexOf(user_ids, user.id) != -1)
    }));

    this.actualSave = this.save;
    this.save = function(key, value, options) {
      //add before-save callbacks
      self.updateUsers();
      self.actualSave(key, value, options);
    };

  },

  defaults: {
    name: "Default Group",
    created_at: new Date(),
  },

  addUser: function(user, index) {
    return (index) ? this.users.add(user, {at: index}) : this.users.add(user);
  },

  get_field_value: function(attribute) {
    return this.get(attribute);
  },  

  set_field_value: function(attributes, options) {
    return this.set(attributes, options);
  },

  updateUsers: function () {
    var users_array = this.users.map(function(model) { return model.id });
    this.set({'users': users_array});
    return this.users
  },  
  
  urlRoot: function() { return Dynamo.TriremeURL+'/groups' },

  viewClass: function() { return Dynamo.ShowGroupView; },

  editViewClass: function() { return Dynamo.EditGroupView; }


});


//This is not directly a model, but is instead a base object to mix into each
//Xelement Class that might exist.
XelementRoot = Dynamo.XelementRoot = {

  codeName: 'xelement',
  prettyName: 'Xelement',
  idAttribute: 'guid',


  defaultsFor: function(xelement_type) {
    var defaults = {},
    types = XELEMENT_BASE.get(xelement_type)["1"].content_types,
    defaults_as_strings = XELEMENT_BASE.get(xelement_type)["1"].default_values;
    _.each(types, function(type_value, attribute_key) {
        defaults[attribute_key] = stringToXelementType(type_value, defaults_as_strings[attribute_key]);
    });
    return {
      title: "new "+xelement_type,
      xelement_type: xelement_type,
      xel_data_types: types,
      xel_data_values: defaults
    };
  },

  get_fields_as_object: function() {
    var fields = {
      id : this.id,
      cid : this.cid
    };
    _.extend(fields, this.get("xel_data_values") );
    return fields;
  },  

  metacontent: function() {

    return this.get_field_value('metacontent_external');

  },
  
  // url: function() { return Dynamo.TriremeURL+'/xelements' },
  urlRoot: function() {
    return Dynamo.TriremeURL+'/xelements' 
  },

  viewClass: function() { return Dynamo.ShowXelementSimpleView; }

};


UnitaryXelement = Dynamo.UnitaryXelement = Dynamo.SaveableModel.extend( _.extend({}, Dynamo.XelementRoot, {

  codeName: 'unitary_xelement',
  prettyName: 'Xelement',

  initAsXelement: function() {
    this.stringifyAllValues();
    this.initializeAsSaveable();
  },

  get_field_type: function(attribute) {
    var field_types = this.get('xel_data_types');
    return field_types[attribute];
  },

  get_field_value: function(attribute) {
    var value, field_values = this.get('xel_data_values');
    switch ( this.get_field_type(attribute) ) {
      case "array":
        value = JSONparseNested(field_values[attribute]);
        break; 
      case "json":
        value = convertFalses(JSONparseNested(field_values[attribute]));
        break;
      case "datetime":
        value = new Date(field_values[attribute]);
        break;
      default:
        value = field_values[attribute];
    };    
    return value;
  },

  set_field_values: function(set_obj, options) {
    var self = this;
    _.each(set_obj, function(val, key) {
      self.set_field_value(key, val, options);
    });
  },

  set_field_value: function(attribute, new_value, options) {
    var field_values = this.get('xel_data_values');
    switch ( this.get_field_type(attribute) ) {
      case "array":
      case "json":
        if (_.isString(new_value)) {
          field_values[attribute] = new_value;
        } 
        else {
          field_values[attribute] = JSON.stringify(new_value);
        };
        break;
      default:
        field_values[attribute] = new_value;
    };
    if (options && !options.silent) {
      this.trigger('change');
      this.trigger('change:xel_data_values');
      this.trigger('change:xel_data_values:'+attribute);
    };
    return this;
  },

  stringifyAllValues: function() {
    var self = this;
    _.each(this.get('xel_data_values'), function(value, key) {
      self.set_field_value(key, value);
    });
  }

}));


// A client-side Xelement is NOT saveable!
// From the perspective of a Unitary Xelement, 
// a ClientSide Xelement's attributes are those that 
// comprise the xel_data_values key in a UnitaryXelement
ValuesOnlyXelement = Dynamo.ValuesOnlyXelement = Dynamo.ReadOnlyModel.extend( _.extend({}, Dynamo.XelementRoot, {

  codeName: 'values_only_xelement',
  prettyName: 'Xelement',

  idAttribute: 'guid',
  urlRoot: Dynamo.TriremeURL+'/xelements',
  converted_atts: [
      "active_membership", 
      "authorization_rule_guids_list", 
      "data_collections", 
      "metacontent_external", 
      "methods"
  ],
  removed_atts: [
    "metacontent_internal", 
    "required_xelement_ids" 
  ],
  sync: ReadOnlySync,

  initAsXelement: function() {},

  defaultsFor: function(xelement_type) {
    switch (xelement_type) {
      case "question_group":
        return {
          active_membership: [],
          authorization_rule_guids_list: [],
          content: "",
          content_description: "Question Group Default Description",
          created_at: (new Date()),
          data_collections: [],
          days_in_treatment: null,
          is_presentational: true,
          is_standalone: true,
          metacontent_external: {
            metadata: {},
            questions: [],
          },
          methods: {},
          produces_instantiated_data: false,
          replace_remote_version: false,
          title: "new question",
          transmittable_to_client_at: (new Date()),
          version_id: null,
          views: {},
          xelement_type: "question"
        }; 
        break;    
      case "question":
        return {
          active_membership: [],
          authorization_rule_guids_list: [],
          content: "",
          content_description: "Provides question functionality.",
          created_at: (new Date()),
          data_collections: [],
          days_in_treatment: null,
          is_presentational: true,
          is_standalone: true,
          metacontent_external: {
            metaContent: {},
            responseGroup: []
          },
          methods: {},
          produces_instantiated_data: true,
          replace_remote_version: false,
          title: "new question",
          transmittable_to_client_at: (new Date()),
          version_id: null,
          views: {},
          xelement_type: "question"
        };
        break;
      case "question_about_data":
        return {
          active_membership: [],
          authorization_rule_guids_list: [],
          content: "",
          content_description: "Provides question functionality.",
          created_at: (new Date()),
          data_collections: [],
          days_in_treatment: null,
          is_presentational: true,
          is_standalone: true,
          metacontent_external: {
            responseAttributeDefinitions: [],
          },
          methods: {},
          produces_instantiated_data: true,
          replace_remote_version: false,
          title: "NewQuestion",
          transmittable_to_client_at: (new Date()),
          version_id: null,
          views: {},
          xelement_type: "question_about_data"
        };
        break;        
      default:
        throw new Error("ValuesOnlyXelement.defaultsFor: No defaults specified");
    };
  },

  get_field_type: function(attribute) {
    throw new Error("For the moment, we can't do this!!");
  },

  get_field_value: function(attribute) {
    return this.get(attribute);
  },  

  set_field_value: function(attribute, new_value) {
    return this.set(attribute, new_value); 
  },

  parseBeforeLocalSave: function(resp) {
    return this.parse(resp);
  },

  parse: function(resp) {
    var self = this;
    console.log("In ValuesOnlyXelement.parse", resp);
    if ( !_.isObject(resp) ) {
      throw new Error("ValuesOnlyXelement.parse: Unexpected response from server.");
    };
    if ( resp.xel_data_values ) {
      var atts = {};
      
      atts.guid = resp.guid;

      _.each(resp.xel_data_values,  function(value, key) { //each function
        if ( _.indexOf(self.removed_atts, key) === -1 ) {

          if ( _.indexOf(self.converted_atts, key) !== -1 ) {
            atts[key] = convertFalses( JSONparseNested( value ) );
          } else {
            atts[key] = value;
          };

        };
      });

      console.log("returning atts: ", atts);
      return atts;
    }
    else {
      console.log("returning original response");
      return resp; 
    };
  }

}));


//Data
//modified from Data class in Backhand.js
//expects: 
//- a trireme_root_url 
//- an xelement_id // 
//- a user_id //
//- a group_id
Data = Dynamo.Data = Dynamo.SaveableModel.extend({

  codeName: 'data',
  prettyName: 'Data',
  idAttribute: "instance_id",

  initialize: function() {
    
    _.bindAll(this);

    // if (this.collection) {
    //   var c = this.collection;
    //   if ( !this.get('server_url')    ) { this.set('server_url',    c.server_url()  )  };
    //   if ( !this.get('xelement_id')   ) { this.set('xelement_id',   c.xelement_id() )  };
    //   if ( !this.get('user_id')       ) { this.set('user_id',       c.user_id()     )  };
    //   if ( !this.get('group_id')      ) { this.set('group_id',      c.group_id()    )  }; 
    // };

    this.initializeAsSaveable();

    if (this.defaultDataAtts) {

      var defaultAttsObject;

      if ( _.isFunction(this.defaultDataAtts) ) {
        defaultAttsObject = this.defaultDataAtts();
      }
      else {
        defaultAttsObject = this.defaultDataAtts;
      };
      
      var self = this;
      _.each(defaultAttsObject, function(valArray, key) {
        self.set_field(key, valArray[0], valArray[1], { silent:true });
      });

    };

    return true;

  },

  defaults: function() {
    return {
      names: [],
      datatypes: [],
      values: [],
      created_at: (new Date()).toString()
    };
  },

  // get_fields
  // Returns all of the data's fields as an array of 3-element arrays,
  // Each element array being the name, type and value of a field:
  // [ [field_1_name, field_1_type, field_1_value], [field_2_name, field_2_type, field_2_value], ...]
  get_fields: function() {
    return _.zip(this.get('names'), this.get('datatypes'), this.get('values'));
  },

  get_fields_as_object: function() {
    var self = this;
    return _.object(self.get('names'), _.map(self.get('names'), function(n) { return self.get_field_value(n) }) )
  },

  // get_field
  // Finds a data's field by name and returns it's type and value as a 2-element an array.
  // If not found, returns an array of [ undefined, undefined ] 
  get_field: function(name) {
    var i = _.indexOf(this.get('names'), name);
    if ( i == -1 ) { return [ void 0, void 0 ] };
    var datatypes = this.get('datatypes'),
        values = this.get('values');
    return [ datatypes[i], values[i] ];
  },

  // get_field_type
  // Finds a data's field by name and returns it's type
  // If not found, returns undefined
  get_field_type: function(name) {
    var i = _.indexOf(this.get('names'), name);
    if ( i == -1 ) { return void 0 };
    var datatypes = this.get('datatypes');
    return datatypes[i];
  },  

  get_field_value: function(attr_name) {
    var i, value, values;

    i = _.indexOf(this.get('names'), attr_name);
    if ( i == -1 ) { return void 0 };
    
    values = this.get('values');
    
    switch ( this.get_field_type(attr_name) ) {
      case "array":
        value = JSONparseNested(values[i]);
        break; 
      case "json":
        value = convertFalses(JSONparseNested(values[i]));
        break;
      case "datetime":
        value = new Date(values[i]);
        break;
      default:
        value = values[i];
    };    

    console.log("Value: ", value);
    return value;

  },

  // remove_field
  // Removes a field from Data and returns it;
  // Returns false if the field was not found
  remove_field: function(name) {
    var removed = [],
        names = this.get('names'), 
        datatypes = this.get('datatypes'), 
        values = this.get('values'),
        i = _.indexOf(names, name);
    
    if ( i == -1 ) { return false };
    
    //Splice out an array value:
    _.each([names, datatypes, values], function(a, index) {
      removed[index] = a.splice(i, 1);
    });

    return removed;
  },

  set_field_values: function(set_obj, options) {
    var field_type, self = this;
    _.each(set_obj, function(val, key) {
      field_type = self.get_field_type(key) || "string";
      self.set_field(key, field_type, val, options);
    });
  },

  // set_field
  // Mimicks the behavior of Backbone's "model.set" for a data field.
  // If the model has a validate method, it will be validated before 
  // the attributes are set; No changes will occur if the validation fails, 
  // and set will return false. 
  // Otherwise, set returns a reference to the model.
  set_field: function(name, type, value, options) {
    var names = this.get('names'), 
        datatypes = this.get('datatypes'), 
        values = this.get('values'),
        field_index = _.indexOf(names, name);

    if (value && !_.isString(value)) {
      switch(type) {
        case "array":
          //TO FIX: this is a quick momentary hack we need to fix.
          value = value;
          break; 
        case "json":
          value = JSON.stringify(value);
          break;
        default:
          value = value.toString();
      };    
    };

    if ( field_index == -1 ) { 
      names.push(name);
      datatypes.push(type);
      values.push(value);
      if (options && !options.silent) { this.trigger('change:'+name); };
      return this.set({ 'names': names, 'datatypes': datatypes, 'values': values }, options);
    };

    datatypes[field_index] = type;
    values[field_index] = value;
    if (options && !options.silent) { this.trigger('change:'+name); };
    return this.set({'datatypes': datatypes, 'values': values }, options);
  },

  server_url: function() {
    if (this.get("server_url")) { return this.get("server_url") }
    if (this.collection && _.result(this.collection, 'server_url') ) { return _.result(this.collection, 'server_url'); }
    if (Dynamo.TriremeURL) { return Dynamo.TriremeURL }
    throw new Error("No URL available for UserData; cid:"+this.cid)
  },

  //  The URL to which this data should post.
  urlRoot: function() {
    return  this.server_url() + 
            "/data/groups/" + this.get('group_id') + 
            "/users/" + this.get('user_id') + 
            "/xelements/" + this.get('xelement_id');
  }

});

//GroupWide Data
//expects: 
//- a trireme_root_url 
//- an xelement
//- a group object
GroupWideData = Dynamo.GroupWideData = Backbone.Model.extend({

  initialize: function() {
    _.bindAll(this);
    var self = this;

    if ( !this.get('server_url')    ) { throw new Error("no server_url");   };
    if ( !this.get('xelement_id')   ) { throw new Error("no xelement_id");  };
    if ( !this.get('group_id')      ) { throw new Error("no group_id");     }; 

    this.group = USER_GROUPS.get( this.get('group_id') );
    if (!this.group) { throw new Error( "no group found for group_id:"+this.get('group_id') ) }; 

    this.buildUserCollections();

    return true;
  },

  buildUserCollections: function() {
    var self = this;
    this.collections = [];
    this.group.users.each(function(user) {
      var UserData = new Dynamo.DataCollection(null, {
        server_url: self.get('server_url'),
        xelement_id: self.get('xelement_id'),
        user_id: user.id,
        group_id: self.get('group_id')
      });

      UserData.fetch({async:false});
      UserData.on('add',    function() { self.trigger('change') });
      UserData.on('remove', function() { self.trigger('change') });
      UserData.on('reset',  function() { self.trigger('change') });
      self.collections.push(UserData);
    });
  },

  fetchUserCollections: function(fetch_options) {
    var options = _.extend({async:false, silent: true}, fetch_options);
    _.each(this.collections, function(c) { c.fetch(options); });
    this.trigger('change');
  },

  forUser: function(user_id) {
    return _.find(this.collections, function(ud_collection) {
      
      if (ud_collection.first()) {
        return (ud_collection.first().get('user_id') == user_id) 
      }
      else {
        return false;
      };
      
    });
  },

  perUser: function(perUserCollectionFn) {
    var result = _.chain(this.collections)
                  .map(function(collection) { 
                    var val = perUserCollectionFn(collection) 
                    if (_.isFunction(val)) {
                      console.warn("perUser returning a function, NOT a value - possible typo?");
                    };
                    return val;
                  })
                  .flatten()
                  .compact()
                  .value();
    return new Backbone.Collection( result );
  },

  where: function(filterFn) {
    var result = _.chain(this.collections)
                  .map(function(c) { return c.filter(filterFn) })
                  .flatten()
                  .compact()
                  .value();

    return new Backbone.Collection( result );
  },

  length: function() {

    return _.chain(this.collections)
            .map( function(c) { return c.length })
            .reduce( function(memo, num) { return memo + num; }, 0)
            .value();

  }

});

// Underscore methods that we want to implement on GroupWideData.
var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
  'detect', 'filter',  'select', 'reject', 'every', 'all', 'some', 'any',
  'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
  'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
  'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

// Mix in each Underscore method as a proxy to `GroupWideData#collections`.
_.each(methods, function(method) {
  Dynamo.GroupWideData.prototype[method] = function() {
    return _[method].apply(_, [this.collections].concat(_.toArray(arguments)));
  };
});

// Same as Data, but doesn't save to a server.
Dynamo.TempData = Dynamo.Data.extend({
  codeName: 'temp_data',
  prettyName: 'Data',

  sync: PseudoSync
  
});


Dynamo.typeToModelClass = function(xelement_type) {
  switch(xelement_type) {
    case 'question_group':
      return Dynamo.QuestionGroupModel;
      break;
    case 'question':
      return Dynamo.QuestionModel;
      break;
    case 'guide':
      return Dynamo.GuideModel;
      break;
    case 'static_html': case 'slide':
      return Dynamo.SlideModel;
      break;            
    default:
      throw "undefined class for xelement_type '"+xelement_type+"'";
  };
}