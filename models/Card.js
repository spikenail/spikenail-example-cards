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
    userId: {
      type: 'id'
    },
    listId: {
      type: 'id'
    },
    boardId: {
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
  },{
    allow: true,
    actions: 'read',
    checkRelation: {
      name: 'list',
      action: 'read'
    }
  }]
});