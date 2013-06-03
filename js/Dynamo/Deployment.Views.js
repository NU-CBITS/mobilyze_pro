// Mantle.Deployment.Views.js


//On instantiation, this view expects:
//1) a model of class Question from which it renders
//2) an optional key 'userResponseModel' whose value is
//   a model onto which it saves
//   a user's response to this question's responses.
//   if this key is ommitted, it will create it's own.
Dynamo.showProjectView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('showProjectView-');
    this.subViews = [];
    this.position = this.options.position
    this.model.groups.on("add", this.render);
    this.model.groups.on("remove", this.render);
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  addSubView: function(view) {
    this.subViews.push(view);
  },

  attributes: function() {
    return {
      id: "project-"+this.model.cid,
      class: "project"
    }
  },

  events: {
    "click button.save_project": "saveProject"
  },

  saveProject: function() {
    this.model.save(null, {
      success: function(model, response, options) {
        alert("Project Saved Successfully");
      },
      error: function(model, xhr, options) {
        alert("Error Saving Project, please look at console")
        console.warn("Project did not save: ", model, xhr, options);
      }
    });
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
      this._template = templates.show_project;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {

    //render template
    var self, view_class, view;

    console.log('in showProjectView render');

    self = this;
    self.$el.html( self.template({
        position: this.position,
        app: this.model.toJSON()
      })
    );

    $groups = this.$el.find('div.groups:first');

    self.groupsView = new Dynamo.ManageCollectionView({
      collection: this.model.groups,
      chooseExistingViewOptions: {
        collection_name: "Groups",
        chooseOn: "name"
      },
      display:{ show: false, edit: true, del: true },
      editViewClass: Dynamo.EditGroupForProjectView,
      editViewOpts: {
        project: self.model
      },
      enableAddExisting: true,
      getExistingAddablesCollection: function() { return USER_GROUPS }
    });

    $groups.append(self.groupsView.$el)
    self.groupsView.render();

    return this;
  }
});


Dynamo.EditGroupForProjectView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('EditGroupForProjectView-');
    this.subViews = [];
    this.position = this.options.position

    this.template = this.options.template || templates.edit_group_for_project;

    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  events: {
    "click button.add-user" : "addUserToGroupDialog",
    "click button.add-assessment" : "addAssessmentToProjectForGroupDialog",
  },

  addUserToGroupDialog: function(clickEvent) {
    var self = this;
    var possibleUsers = UserCollectionNotInGroup(self.model);
    self.addUserToGroupView = new Dynamo.ChooseOneXelementFromCollectionView({
      collection: possibleUsers,
      chooseOn: "username",
    });

    self.userPopup = renderInDialog(self.addUserToGroupView, {
      title: "Add a User to " + self.model.get_field_value('name')
    });

    self.addUserToGroupView.on("element:chosen", function() {
      self.model.addUser(self.addUserToGroupView.chosen_element);
      self.model.save();
      self.userPopup.dialog("close");
    });

  },

  addAssessmentToProjectForGroupDialog: function(clickEvent) {
    var self = this,
        possibleAssessments = AssessmentCollectionNotInProjectGroup(this.options.project, this.model);

    self.addAssessmentToProjectForGroupView = new Dynamo.ChooseOneXelementFromCollectionView({
      collection: possibleAssessments,
    });

    var title = "Add Assessment to Group "+self.model.get_field_value('name')+" for the Project ";
    self.assessmentPopup = renderInDialog( self.addAssessmentToProjectForGroupView, { title:  title } );

    self.addAssessmentToProjectForGroupView.on("element:chosen", function() {
      self.options.project.addAssessmentToGroup(self.model, self.addAssessmentToProjectForGroupView.chosen_element);
      self.options.project.save();
      self.assessmentPopup.dialog("close");
    });


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
    this.removeSubViews();
    this.$el.remove();
  },

  removeSubViews: function() {
    _.each(this.subViews, function(sub_view) {
      sub_view.remove();
      sub_view = null;
    });
    this.subViews = [];
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) { throw new Error("No Valid Template") };
      this.compiled_template = _.template(this.template, data, settings);
    };
    return this.compiled_template
  },

  initialRender: function() {

  },

  render: function() {
    console.log('in EditGroupForProjectView render');

    var self, view_class, view;

    self = this;
    self.$el.html( self._template({
        position: this.position,
        group: this.model.toJSON()
      })
    );

    // if (!self.usersView) {
    $users = this.$el.find('div.users:first');
    self.usersView = new Dynamo.ManageCollectionView({
      collection: this.model.users,
      display:{ show: true, edit: false, del: false }
    });
    $users.append(self.usersView.$el)
    // };

    self.usersView.render();

    // if (!self.assessmentsView) {
      $assessments = this.$el.find('div.assessments:first');
      self.assessmentsView = new Dynamo.ManageCollectionView({
        collection: AssessmentCollectionForProjectGroup(this.options.project, this.model),
        display:{ show: true, edit: false, del: false }
      });
      $assessments.append(self.assessmentsView.$el)
    // };

    self.assessmentsView.render();

    return this;
  }

});