import { ObjectID } from 'mongodb';

// Users
let users = [{
  _id: new ObjectID('592bee6078d8b58f1656aefa'),
  name: 'Igor',
  tokens: [{
    token: 'igor-secret-token'
  }]
}, {
  _id: new ObjectID('592bf36fa4dd628ff4e1fed4'),
  name: 'Bob',
  tokens: [{
    token: 'bob-secret-token'
  }]
}, {
  _id: new ObjectID('592bf36fa4dd628ff4e1fed5'),
  name: 'Anna',
  tokens: [{
    token: 'anna-secret-token'
  }]
}, {
  _id: new ObjectID('592bf36fa4dd628ff4e1fed7'),
  name: 'Julie',
  tokens: [{
    token: 'julie-secret-token'
  }]
}, {
  _id: new ObjectID('592bf36fa4dd628ff4e1fed6'),
  name: 'Jacob',
  tokens: [{
    token: 'jacob-secret-token'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b86'),
  name: 'Sakura',
  tokens: [{
    token: 'sakura-secret-token'
  }]
}];

// Lets create boards
let boards = [{
  _id: new ObjectID('592bfc906f39f790cf4b9b87'),
  name: `Private board of Igor's Company`,
  userId: users[0]._id,
  isPrivate: true,
  memberships: [{
    userId: users[1]._id,
    role: 'member'
  }, {
    userId: users[2]._id,
    role: 'observer'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b88'),
  name: `Public board of Igor's Company`,
  userId: users[0]._id,
  isPrivate: false,
  memberships: [{
    userId: users[1]._id,
    role: 'member'
  }, {
    userId: users[2]._id,
    role: 'observer'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b89'),
  name: `Private board of Julie's Company`,
  userId: users[3]._id,
  isPrivate: true,
  memberships: [{
    userId: users[4]._id,
    role: 'member'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b8a'),
  name: `Public board of Julie's Company`,
  isPrivate: false,
  userId: users[3]._id
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b7b'),
  name: `Delete me. Private board of Igor's company`,
  userId: users[0]._id,
  isPrivate: true
}];


// Export collections
export default {
  users,
  boards
}