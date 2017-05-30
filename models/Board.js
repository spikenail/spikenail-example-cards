import { MongoDBModel } from 'spikenail';

class Board extends MongoDBModel {}

export default new Board({
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
    isPrivate: {
      type: Boolean,
      default: true
    },
    memberships: {
      type: Array
    },
    lists: {
      relation: 'hasMany'
    },
    user: {
      relation: 'belongsTo'
    }
  },

  acls: [{
    allow: false
  }, {
    allow: true,
    actions: 'create',
    roles: 'user'
  }, {
    allow: true,
    roles: 'owner',
    actions: '*'
  }, {
    allow: true,
    roles: '*',
    actions: 'read',
    scope: { isPrivate: false }
  }, {
    allow: true,
    roles: ['observer', 'member'],
    actions: 'read'
  }],
  roles: {
    member: {
      cond: function(ctx) {
        if (!ctx.currentUser) {
          return false;
        }

        return { 'memberships.userId': ctx.currentUser, 'memberships.role': 'member' }
      }
    },
    observer: {
      cond: function(ctx) {
        if (!ctx.currentUser) {
          return false;
        }

        return {  'memberships.userId': ctx.currentUser, 'memberships.role': 'observer' }
      }
    }
  }
  // TODO: allow memberships to edit?
});