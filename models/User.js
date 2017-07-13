import { MongoDBModel } from 'spikenail';

class User extends MongoDBModel {}

export default new User({
  isViewer: true,
  properties: {
    id: {
      type: 'id'
    },
    name: {
      type: 'String'
    },
    tokens: {
      type: Array,
      private: true
    }
  },
  acls: [{
    allow: false
  }, {
    allow: true,
    actions: 'read'
  }]
});