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
    // Anyone who can read board can read list
    allow: true,
    actions: 'read',
    checkRelation: {
      name: 'board',
      action: 'read'
    }
  }, {
    // anyone who can update board is able to do any action on lists
    allow: true,
    actions: '*',
    roles: '*',
    checkRelation: {
      name: 'board',
      action: 'update'
    }
  }, {
    // If we don't want to allow board members to edit board, e.g. rename it.
    // We should additionally allow them to modify lists
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