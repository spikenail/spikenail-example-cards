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

// TODO: would it be better to keep everything in single object tree?
let lists = [{
  _id: new ObjectID('593857415e0d351223414458'),
  name: "Stage 0",
  boardId: boards[2]._id
}, {
  _id: new ObjectID('593857415e0d351223414459'),
  name: "Stage 1",
  boardId: boards[2]._id
}, {
  _id: new ObjectID('593857415e0d35122341445a'),
  name: "Stage 2",
  boardId: boards[2]._id
}, {
  name: 'January',
  boardId: boards[0]._id
}, {
  name: 'February',
  boardId: boards[0]._id
}, {
  name: 'March',
  boardId: boards[0]._id
}, {
  name: 'April',
  boardId: boards[0]._id
}, {
  name: 'May',
  boardId: boards[0]._id
}, {
  name: 'June',
  boardId: boards[0]._id
}, {
  name: 'July',
  boardId: boards[0]._id
}, {
  name: 'August',
  boardId: boards[0]._id
}, {
  name: 'September',
  boardId: boards[0]._id
}, {
  name: 'October',
  boardId: boards[0]._id
}, {
  name: 'November',
  boardId: boards[0]._id
}, {
  name: 'December',
  boardId: boards[0]._id
}];

// Export collections
export default {
  users,
  boards,
  lists
}