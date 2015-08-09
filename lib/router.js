Router.route('/', {
  name: 'meteoroid',
  waitOn: function () {
    return [ Meteor.subscribe('players'),
             Meteor.subscribe('asteroids')];
  }
});
