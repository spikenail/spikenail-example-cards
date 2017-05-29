import { MongoDBModel } from 'spikenail';

class List extends MongoDBModel {}

export default new List({
  properties: {
    id: {
      type: 'id'
    },
    name: {
      type: String
    },
    userId: {
      type: 'id'
    },
    boardId: {
      type: 'id'
    },
    board: {
      relation: 'belongsTo'
    },
    cards: {
      relation: 'hasMany'
    }
  },
  acls: [{
    allow: false
  }, {
    allow: true,
    roles: '*',
    actions: '*',
    checkRelation: {
      name: 'board',
      action: 'read'
    }
  }]
});