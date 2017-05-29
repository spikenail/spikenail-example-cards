import { MongoDBModel } from 'spikenail';

class User extends MongoDBModel {}

export default new User({
  isViewer: true,
  expose: false,
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
  }
});