/*

    ADD IN FIXED SERVER DATA HERE.

    e.g. if you need want to insert canned data into a database
    (esp. if it's empty)

*/
Meteor.startup(function () {
  var boundFunction = Meteor.bindEnvironment(function() {
    Meteor.call('removeInactive');
  })
  var t = setInterval(boundFunction, 3000);
  
});
