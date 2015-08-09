/*

    ADD IN DATABASE PUBLICATIONS HERE.

    IGNORE THIS FILE IF 'INSECURE' IS STILL INCLUDED.

*/

Meteor.publish('players', function() {
  return Players.find();
});
