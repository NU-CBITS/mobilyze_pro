// Generated by CoffeeScript 1.3.3
(function() {
  'use strict';
  var previousSync, onlineSync, dualsync, localsync, parseRemoteResponse;
  var storeNameAttribute = 'storeName';

  Backbone.Collection.prototype.syncDirty = function() {
    console.log("In syncDirty");
    var method, model, store, _results;
    store = new Store(_.result(this, storeNameAttribute));
    _results = [];

    var self = this;

    _.each(store.dirtyRecords(), function(store_id) {
      
      model = self.find(function(m) { return (m.dualstorage_id == store_id) });
      if (model) {

        method = ((model.id) ? 'update' : 'create');
        var itemId = store_id;
        onlineSync(method, model, {
          success: function(saved_model, response, options) {
            console.log("syncDirty CB - 1");
            store.cleanItem(itemId, 'dirty');
            itemId = null; //prevent mem leak
          },
          error: function(unsaved_model, xhr, options) {
            console.warn("Unsaved model still dirty:", unsaved_model, xhr, options);
            itemId = null; //prevent mem leak
          }          
        });

      }
      else {

        model = new self.model(store.findItem(store_id));
        model.dualstorage_id = store_id;
        method = ((model.id) ? 'update' : 'create');
        var itemId = store_id;
        onlineSync(method, model, {
          success: function(saved_model, response, options) {
            console.log("syncDirty CB - 2");
            store.cleanItem(itemId, 'dirty');
            itemId = null; //prevent mem leak;
          },
          error: function(unsaved_model, xhr, options) {
            console.warn("Unsaved model still dirty:", itemId, unsaved_model, xhr, options);
            itemId = null; //prevent mem leak
          }          
        });

      };

    });
    
    return _results;
  };

  Backbone.Collection.prototype.syncDestroyed = function() {
    console.log("In syncDestroyed");
    var self, store;
    self = this;
    store = new Store(_.result(this, storeNameAttribute));
    
    _.each(store.destroyedRecords(), function(store_id) {

      model = new self.model({ id : id });
      var itemId = store_id;
      model.destroy({
          success: function(destroyed_model, response, options) {
            store.cleanItem(itemId, 'destroyed');
            itemId = null; //avoid mem leak
          },
          error: function(non_destroyed_model, xhr, options) {
            console.warn("client-destroyed model failed server destroy:", itemId, non_destroyed_model, xhr, options);
            itemId = null; //avoid mem leak 
          }
      });

    });

  };

  Backbone.Collection.prototype.syncDirtyAndDestroyed = function() {
    console.log("In syncDirtyAndDestroyed");
    this.syncDirty(); 
    this.syncDestroyed();
  };


  window.Store = (function() {
    

    function Store(name) {
      this.name = name;
      this.records = this.recordsOf(this.name);
    }

    Store.prototype.sep = '_';

    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    Store.prototype.generateId = function() {
      return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
    };

    Store.prototype.clean = function(model, from) {
      if (!model.dualstorage_id) { 
        
        if (model.get) {
          model.dualstorage_id = model.get("dualstorage_id") || model.id;  
        }
        else {
          model.dualstorage_id = model.id;
        };

        if (model.unset) {
          model.unset("dualstorage_id", {silent: true});  
        };
        
      };

      if (!model.dualstorage_id) {
        console.warn("Store.clean: Still no dualstorage_id for model??", model); 
      };

      var dirtyRecords, dirtyStoreName;
      dirtyStoreName = this.name +"_"+from;
      dirtyRecords = this.recordsOf(dirtyStoreName);

      if (_.include(dirtyRecords, model.dualstorage_id)) {
        console.log('Store ('+this.name+'): Cleaning ', model.dualstorage_id);
        localStorage.setItem(dirtyStoreName, _.without(dirtyRecords, model.dualstorage_id).join(','));
      };

      return model;
    };

    Store.prototype.cleanItem = function(store_id, from) {
      
      var dirtyRecords, dirtyStoreName;
      dirtyStoreName = this.name +"_"+from;
      dirtyRecords = this.recordsOf(dirtyStoreName);

      if (_.include(dirtyRecords, store_id)) {
        console.log('Store ('+this.name+'): Cleaning ', store_id);
        localStorage.setItem(dirtyStoreName, _.without(dirtyRecords, store_id).join(','));
      };

    };

    Store.prototype.clear = function() {

      var id, _i, _len, _ref;
      _ref = this.records;
      
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        localStorage.removeItem(this.name + this.sep + id);
      }
      this.records = [];
      
      return this.save();
    };

    Store.prototype.create = function(model) {
      console.log('creating', model, 'in', this.name);

      if (!_.isObject(model)) { 
        throw new Error("Store.create: model is not an object", model); 
        return model; 
      };
      
      if (!model.dualstorage_id) {
        if (model.id) {
          model.dualstorage_id = model.id;
          console.log("set dualstorage_id equal to id on ", model);
        } else {
		      model.dualstorage_id = this.generateId();
          console.log("model does not have an id; generated dualstorage_id for ", model);
        };	  
      };
      
      if ( !_.isString(model.dualstorage_id) ) { model.dualstorage_id = model.dualstorage_id.toString() };

      localStorage.setItem(this.name + this.sep + model.dualstorage_id, JSON.stringify(model));
      this.records.push(model.dualstorage_id);
      this.save();
      return model;
    };

    Store.prototype.destroy = function(model) {
      console.log('trying to destroy', model, 'in', this.name);
      if (!model.dualstorage_id) { 
        model.dualstorage_id = model.get("dualstorage_id") || model.id;
        model.unset("dualstorage_id", {silent: true});
      }
      if (!model.dualstorage_id) {
        console.warn("Store.destroy: Still no dualstorage_id for model??", model); 
      };

      localStorage.removeItem(this.name + this.sep + model.dualstorage_id);
      this.records = _.reject(this.records, function(record_id) {
        return record_id === model.dualstorage_id;
      });
      this.save();
      return model;
    };   

    Store.prototype.destroyed = function(model) {
      var destroyedRecords;
      destroyedRecords = this.recordsOf(this.name + '_destroyed');
      
      if (model.id) {
        if (!_.include(destroyedRecords, model.id)) {
          destroyedRecords.push(model.id);
          localStorage.setItem(this.name + '_destroyed', destroyedRecords.join(','));
        }        
      };

      return model;
    };

    Store.prototype.destroyedRecords = function() {
      return this.recordsOf(this.name + '_destroyed')
    };

    Store.prototype.dirty = function(model) {
      var dirtyRecords;
      dirtyRecords = this.recordsOf(this.name + '_dirty');
      if (!_.include(dirtyRecords, model.dualstorage_id)) {
        console.log('dirtying', model);
        dirtyRecords.push(model.dualstorage_id);
        localStorage.setItem(this.name + '_dirty', dirtyRecords.join(','));
      }
      return model;
    };

    Store.prototype.dirtyRecords = function() {
      return this.recordsOf(this.name + '_dirty')
    };

    Store.prototype.find = function(model) {
      console.log('finding', model, 'in', this.name);
      return JSON.parse(localStorage.getItem(this.name + this.sep + model.dualstorage_id));
    };

    Store.prototype.findItem = function(store_id) {
      console.log('finding item json', store_id, 'in', this.name);
      return JSON.parse(localStorage.getItem(this.name + this.sep + store_id));
    };

    Store.prototype.findAll = function() {
      var id, _i, _len, _ref, _results;
      console.log('findAlling');
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        _results.push(JSON.parse(localStorage.getItem(this.name + this.sep + id)));
      }
      return _results;
    };

    Store.prototype.hasDirtyOrDestroyed = function() {
      return !_.isEmpty(localStorage.getItem(this.name + '_dirty')) || !_.isEmpty(localStorage.getItem(this.name + '_destroyed'));
    };

    Store.prototype.recordsOf = function(key) {
      var store;
      store = localStorage.getItem(key);
      return (store && store.split(',')) || [];
    };

    Store.prototype.save = function() {
      return localStorage.setItem(this.name, this.records.join(','));
    };

    Store.prototype.update = function(model) {
      console.log('updating', model, 'in', this.name);
      if (!model.dualstorage_id) { 
        model.dualstorage_id = model.get("dualstorage_id") || model.id;
        model.unset("dualstorage_id", {silent: true});
      }
      if (!model.dualstorage_id) {
        console.warn("Store.update: Still no dualstorage_id for model??", model); 
      };
      localStorage.setItem(this.name + this.sep + model.dualstorage_id, JSON.stringify(model));
      if (!_.include(this.records, model.dualstorage_id)) {
        this.records.push(model.dualstorage_id);
      }
      this.save();
      return model;
    };

    return Store;

  })();

  localsync = function(method, model, options) {
    var response, store;
    console.log('In localsync', method, model, options);
    store = new Store(options.storeName);
    response = (function() {
      switch (method) {
        case 'read':
          if (model.dualstorage_id) {
            return store.find(model);
          } else {
            return store.findAll();
          }
          break;
        case 'hasDirtyOrDestroyed':
          return store.hasDirtyOrDestroyed();
        case 'clear':
          return store.clear();
        case 'create':
          if (!(options.add && !options.merge && store.find(model))) {
            model = store.create(model);
            if (options.dirty) {
              return store.dirty(model);
            }
          }
          break;
        case 'update':
          store.update(model);
          if (options.dirty) {
            return store.dirty(model);
          } else {
            return store.clean(model, 'dirty');
          }
          break;
        case 'delete':
          store.destroy(model);
          if (options.dirty) {
            return store.destroyed(model);
          } else {
            if (model.dualstorage_id) {
              return store.clean(model, 'dirty');
            } else {
              return store.clean(model, 'destroyed');
            }
          }
      }
    })();
    if (!options.ignoreCallbacks) {
      if (response) {
        options.success(response);
      } else {
        options.error('Record not found');
      }
    }
    return response;
  };

  parseRemoteResponse = function(object, response) {
    if (!(object && object.parseBeforeLocalSave)) {
      return response;
    }
    if (_.isFunction(object.parseBeforeLocalSave)) {
      return object.parseBeforeLocalSave(response);
    }
  };

  previousSync = Backbone.sync;
  onlineSync = function(method, model, options) { 
    return (model.sync || previousSync).call(this, method, model, options);
  };

  dualsync = function(method, model, options) {
    var error, local, originalModel, success;
    console.log('In dualsync', method, model, options);
    options.storeName = 
      _.result(model.collection, "storeName") || 
      _.result(model.collection, storeNameAttribute) ||
      _.result(model, "storeName") || 
      _.result(model, storeNameAttribute) ||
      "default_store";
    if ( SERVER_CONNECTIVITY.exists() && ( _.result(model, 'remote') || _.result(model.collection, 'remote') ) ) {
      return onlineSync(method, model, options);
    }
    local = _.result(model, 'local') || _.result(model.collection, 'local');
    options.dirty = options.remote === false && !local;
    if (options.remote === false || local) {
      return localsync(method, model, options);
    }
    options.ignoreCallbacks = true;
    success = options.success;
    error = options.error;
    switch (method) {
      
      case 'read':
        if (localsync('hasDirtyOrDestroyed', model, options)) {
          console.log("can't clear", options.storeName, "require sync dirty data first");
          return success(localsync(method, model, options));
        } else {

          if ( SERVER_CONNECTIVITY.exists() ) {

            options.success = function(resp, status, xhr) {
              var i, _i, _len;
              console.log('got remote', resp, 'putting into', options.storeName);
              resp = parseRemoteResponse(model, resp);
              if (!options.add) {
                localsync('clear', model, options);
              }
              if (_.isArray(resp)) {
                for (_i = 0, _len = resp.length; _i < _len; _i++) {
                  i = resp[_i];
                  console.log('trying to store', i);
                  localsync('create', i, options);
                }
              } else {
                localsync('create', resp, options);
              }
              if ( _.isFunction(success) ) { return success(resp, status, xhr); };
              return true;
            };
            options.error = function(resp) {
              console.log('getting local from', options.storeName);
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
            };
            return onlineSync(method, model, options);

          } else {
              console.log('getting local from', options.storeName);
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
          };

        }
        break;

      case 'create':
        if ( SERVER_CONNECTIVITY.exists() ) { 
          options.success = function(resp, status, xhr) {
            localsync(method, resp, options);
            if ( _.isFunction(success) ) { return success(resp, status, xhr); };
            return true;
          };
          options.error = function(resp) {
            options.dirty = true;
            if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
            return localsync(method, model, options);
          };
          return onlineSync(method, model, options);
        }
        else {
          options.dirty = true;
          if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
          return localsync(method, model, options);
        };
        break;

      case 'update':
        if (SERVER_CONNECTIVITY.exists()) {
          if (model.dualstorage_id) {
            originalModel = model.clone();
            options.success = function(resp, status, xhr) {
              localsync('delete', originalModel, options);
              localsync('create', resp, options);
              if ( _.isFunction(success) ) { return success(resp, status, xhr); };
              return true;
            };
            options.error = function(resp) {
              options.dirty = true;
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
            };
            delete model.dualstorage_id;
            model.unset("dualstorage_id", {silent: true});
            return onlineSync('create', model, options);
          } else {
            options.success = function(resp, status, xhr) {
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
            };
            options.error = function(resp) {
              options.dirty = true;
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
            };
            return onlineSync(method, model, options);
          }          
        }
        else {
          options.dirty = true;
          if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
          return localsync(method, model, options);
        }
        break;

      case 'delete':
        if (model.dualstorage_id) {

          return localsync(method, model, options);

        } else {

          if (SERVER_CONNECTIVITY.exists()) {

            options.success = function(resp, status, xhr) {
              localsync(method, model, options);
              if ( _.isFunction(success) ) { return success(resp, status, xhr); };
              return true;
            };
            options.error = function(resp) {
              options.dirty = true;
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);
            };
            return onlineSync(method, model, options);

          } else {

              options.dirty = true;
              if ( _.isFunction(success) ) { return success(localsync(method, model, options)) };
              return localsync(method, model, options);

          };

        };
        break;

    }; //switch

  }; //dualsync

  Backbone.sync = dualsync;

}).call(this);