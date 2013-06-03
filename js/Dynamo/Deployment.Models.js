// Mantle.Deployment.Models.js

ApplicationModel = Dynamo.XelementClass.extend({
  //values:
  codeName: "application",
  prettyName: "Project",

  //functions:
  initialize: function () {
    _.bindAll(this);
    var self = this;

    self.initAsXelement();
    self.set_field_value('xelement_type', 'application');

    //pull out important meta-content attributes;
    self.groups = self.getGroups();
    self.groups_assessments = self.getGroupsAssessments();


    //  Saving an application should update the Application's:
    //  groups, assessments-per-group, and assessments.
    //  why oh why is there no super in JS??
    this.actualSave = this.save;
    this.save = function(key, value, options) {
      self.updateMetaContent();
      self.actualSave(key, value, options);
    };
 
  },

  // defaults: function() { 
  //   return this.defaultsFor('application');
  // },
  
  group_ids: function () {
    return this.metacontent().groups || [] ;
  },

  getGroups: function() {
    var self = this;
    return (new GroupCollection( 
      USER_GROUPS.filter(function(group) { return (_.indexOf(self.group_ids(), group.id) !== -1) }) 
    ));
  },

  getGroupsAssessments: function() {
    return this.metacontent().groups_assessments || {} ;
  },

  groupsAssessmentIds: function(group) {
    if (this.groups_assessments[group.id]) { return this.groups_assessments[group.id] }
    return [];
  },

  addAssessmentToGroup: function(group, assessment) {
    this.groups_assessments[group.id] = _.compact(_.union( this.groups_assessments[group.id] || [] , [assessment.id])); 
    this.trigger('change')
  },

  updateMetaContent: function () {
    var mc = this.metacontent();
    mc.groups = this.groups.map(function(model) { return model.id });
    mc.groups_assessments = this.groups_assessments;
    mc.assessments =  _.chain(this.groups_assessments).map(function(value, key) { return value }).flatten().uniq().value();
    return this.set_field_value('metacontent_external', mc);
  },  

  urlRoot: function() { return Dynamo.TriremeURL+'/xelements' },

  viewClass: function() { return Dynamo.showProjectView; },

});

// Helper Methods:

// Relies on a Global Definition, QUESTION_GROUPS, representing the backbone collection 
// Of all available Question Groups.
AssessmentCollectionForProjectGroup = function(project, group) {
  return (new QuestionGroupCollection( 
            QUESTION_GROUPS.filter(function(qg) { 
              return ( _.indexOf(project.groupsAssessmentIds(group), qg.id) != -1 )
            }) 
  ));
};

// Relies on a Global Definition, QUESTION_GROUPS, representing the backbone collection 
// Of all available Question Groups.
AssessmentCollectionNotInProjectGroup = function(project, group) {
  return  new QuestionGroupCollection( 
            QUESTION_GROUPS.reject( function(qg) { 
                return ( _.indexOf(project.groupsAssessmentIds(group), qg.id) != -1 )
            })
          );
};

// Relies on a Global Definition, USERS, representing the backbone collection 
// of all available USERS.
UserCollectionNotInGroup = function(group) {
  return new Dynamo.UserCollection( USERS.without( group.users.toArray() ) );
};

// Relies on a Global Definition, USER_GROUPS, representing the backbone collection 
// of all available Groups.
GroupsForProject = function(project) {
  return new Dynamo.GroupCollection( USER_GROUPS.without( group.users.toArray() ) );
};