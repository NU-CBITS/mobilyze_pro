// Mantle.Deployment.Collections.js

ApplicationCollection = Dynamo.Collection.extend({
  
  model: ApplicationModel,
  codeCollectionName: "applications",
  prettyCollectionName: "Projects",

  url: function() { return Dynamo.TriremeURL+'/xelements?filter={"latest.xelement_type":"application"}' }
  
});