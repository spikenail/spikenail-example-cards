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
    actions: 'read',
    checkRelation: {
      name: 'board',
      action: 'read'
    }
  }, {
    allow: true,
    actions: '*',
    roles: '*',
    checkRelation: {
      name: 'board',
      action: 'update'
    }
  }, {
    allow: true,
    actions: '*',
    roles: '*',
    checkRelation: {
      name: 'board',
      roles: ['member'],
      action: 'read'
    }
  }]
});