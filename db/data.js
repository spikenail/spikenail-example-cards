import { ObjectID } from 'mongodb';

const clone = require('lodash.clone');

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
let data = [{
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
  }],
  lists: [{
    _id: new ObjectID('59466e8cc872f08c081598d3'),
    name: 'January',
    cards: [{
      _id: new ObjectID('5947f8d213ae329a49ed822d'),
      title: '1st',
      description: 'day'
    }, {
      _id: new ObjectID('5947f8d213ae329a49ed822e'),
      title: '2nd',
      description: 'day'
    }]
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d4'),
    name: 'February'
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d5'),
    name: 'March'
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d6'),
    name: 'April'
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d7'),
    name: 'May'
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d8'),
    name: 'June'
  }, {
    _id: new ObjectID('59466e8cc872f08c081598d9'),
    name: 'July'
  }, {
    name: 'August'
  }, {
    name: 'September'
  }, {
    name: 'October'
  }, {
    name: 'November'
  }, {
    name: 'December'
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
  }],
  lists: [{
    name: 'AAA'
  }, {
    name: 'BBB'
  }, {
    name: 'CCC'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b89'),
  name: `Private board of Julie's Company`,
  userId: users[3]._id,
  isPrivate: true,
  memberships: [{
    userId: users[4]._id,
    role: 'member'
  }],
  lists: [{
    _id: new ObjectID('593857415e0d351223414458'),
    name: "Stage 0",
    cards: [{
      _id: new ObjectID('595259726f8c2a1cfd36a2f5'),
      title: 'Task one',
      description: 'Create task two'
    }, {
      _id: new ObjectID('595259726f8c2a1cfd36a2f6'),
      title: 'Task two',
      description: 'Create task three'
    }]
  }, {
    _id: new ObjectID('593857415e0d351223414459'),
    name: "Stage 1",
    cards: [{
      _id: new ObjectID('595259726f8c2a1cfd36a2f7'),
      title: 'Buy tomato',
      description: 'red'
    }, {
      _id: new ObjectID('595259726f8c2a1cfd36a2f8'),
      title: 'Buy carrot',
      description: 'orange'
    }, {
      _id: new ObjectID('595259726f8c2a1cfd36a2f9'),
      title: 'Buy knife'
    }]
  }, {
    _id: new ObjectID('593857415e0d35122341445a'),
    name: "Stage 2",
    cards: [{
      _id: new ObjectID('595259726f8c2a1cfd36a2fa'),
      title: 'Www',
      description: 'Aaa'
    }, {
      _id: new ObjectID('595259726f8c2a1cfd36a2fb'),
      title: 'yyy',
      description: 'nnn'
    }]
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b8a'),
  name: `Public board of Julie's Company`,
  isPrivate: false,
  userId: users[3]._id,
  lists: [{
    name: 'XXX',
    cards: [{
      _id: new ObjectID('59527fbeab49df1f8b4f892d'),
      title: 'Test card'
    }]
  }, {
    name: 'YYY',
    cards: [{
      _id: new ObjectID('59527fbeab49df1f8b4f892e'),
      title: 'test card 2'
    }]
  }, {
    name: 'ZZZ'
  }, {
    name: 'GGG'
  }]
}, {
  _id: new ObjectID('592bfc906f39f790cf4b9b7b'),
  name: `Delete me. Private board of Igor's company`,
  userId: users[0]._id,
  isPrivate: true
}];

// Convert tree to plain collections
let lists = [];
let cards = [];
let boards = [];

for (let board of data) {
  if (board.lists) {
    for (let list of board.lists) {
      list.boardId = board._id;
      if (list.cards) {
        // Iterate cards
        for (let card of list.cards) {
          card.listId = list._id;
          cards.push(card);
        }
      }

      let newList = clone(list);
      delete newList.cards;
      lists.push(newList);
    }
  }

  let newBoard = clone(board);
  delete newBoard.lists;
  boards.push(newBoard);
}

// Export collections
export default {
  users: users,
  boards: data,
  collections: {
    users,
    boards,
    lists,
    cards
  }
}