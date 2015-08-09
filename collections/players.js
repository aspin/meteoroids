if (Meteor.isServer) {
  Players = new Mongo.Collection("Players", {connection:null});
} else {
  Players = new Mongo.Collection("Players");
}

Meteor.methods({
  addPlayer: function(id, x, y, rotation) {
    if (Players())
    Players.insert({
      _id: id,
      x: x,
      y: y,
      rotation: rotation,
      createdAt: new Date()
    });
  },
  updatePlayer: function(id, x, y, rotation) {
    Players.update({_id: id}, {
      x: x,
      y: y,
      rotation: rotation,
      createdAt: new Date()
    });  
  }
});

// }
// Players.allow({
//   insert: function(){
//     return true;
//   },
//   update: function(){
//     return true;
//   },
//   remove: function(){
//     return true;
//   }
// });
// 
// {
//   username: 'tedwu',
//   position: Position(x, y),
// 
// }
