Asteroids = new Mongo.Collection("asteroids");

Asteroids.allow({
  insert: function() {
    return true;
  },
  update: function() {
    return true;
  },
  remove: function() {
    return true;
  }
});





// {
//   x: x,
//   y: y,
//   game: gameName
// }
