import { MongoDBModel } from 'spikenail';

class Card extends MongoDBModel {}

export default new Card({
  properties: {
    id: {
      type: 'id'
    },
    title: {
      type: String
    },
    description: {
      type: String
    },
    listId: {
      type: 'id'
    },
    list: {
      relation: 'belongsTo'
    },
    board: {
      relation: 'belongsTo'
    }
  },
  acls: [{
    allow: false,
  }, {
    allow: true,
    actions: '*',
    roles: '*',
    checkRelation: {
      name: 'list',
      action: 'update'
    }
  }, {
    allow: true,
    actions: 'read',
    roles: '*',
    checkRelation: {
      name: 'list',
      action: 'read'
    }
  }]
});