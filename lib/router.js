
// example routing with Iron Router
Router.route('/', {
  name: 'meteoroid',
  waitOn: function () {
    return [Meteor.subscribe("players")];
  }
});
