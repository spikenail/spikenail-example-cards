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
    // The one who can update list should be able to do any action on card
    allow: true,
    actions: '*',
    roles: '*',
    checkRelation: {
      name: 'list',
      action: 'update'
    }
  }, {
    // The one who can READ list should be able to read card
    allow: true,
    actions: 'read',
    roles: '*',
    checkRelation: {
      name: 'list',
      action: 'read'
    }
  }]
});