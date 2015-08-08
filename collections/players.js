Players = new Mongo.Collection("Players");

Players.allow({
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
//   username: 'tedwu',
//   position: (x, y),
//   health: 1000,
//   weapon: 'weaponName',
// }
