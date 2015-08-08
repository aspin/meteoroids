Players = new Mongo.Collection("Players");

Players.allow({
  insert: function(){
    return true;
  },
  update: function(){
    return true;
  },
  remove: function(){
    return true;
  }
});

{
  username: 'tedwu',
  position: Position(x, y),

}
