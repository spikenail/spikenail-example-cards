const request = require('supertest');

const stringifyObject = require('stringify-object');

const Query = require('graphql-query-builder');

const clone = require('lodash.clone');

import { Spikenail } from 'spikenail'

import {
  toGlobalId,
  fromGlobalId
} from 'graphql-relay';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

const MongoClient = require('mongodb').MongoClient;

let db = null;

import sources from  '../config/sources';

import data from '../db/data';

// Connection URL
const url = sources.test.connectionString;

/**
 * Connect to database
 *
 * @returns {Promise.<void>}
 */
async function connect() {
  db = await MongoClient.connect(url);
}

/**
 * Truncate current database
 */
async function clearDatabase() {
  let collections = await db.listCollections().toArray();

  for (let collection of collections) {
    if (collection.name.startsWith('system.')) {
      continue;
    }

    await db.dropCollection(collection.name);
  }
}

/**
 * Push initial data in the database
 */
async function initDatabase() {
  for (let collectionName of Object.keys(data.collections)) {
    let collectionData = data.collections[collectionName];
    // Insert entries
    let collection = db.collection(collectionName);
    await collection.insertMany(collectionData);
  }
}

beforeAll(async () => {
  await connect();

  await clearDatabase();
  await initDatabase();

  return await Spikenail.start();
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Get X
 * Expect success result and returns data
 *
 * @param name
 * @param id
 * @param token
 * @returns {Promise.<void>}
 */
async function getXQuery(name, id, token = '') {
  let query = `{
    get${capitalizeFirstLetter(name)}(id: "${id}") {
      id
      userId
    }
  }`;

  // TODO: don't put token in header if not specified
  let res = await request(Spikenail.server)
    .post('/graphql')
    .set('authorization', `Bearer ${token}`)
    .send({ query: query })
    .expect('Content-Type', /json/)
    .expect(200);

  return JSON.parse(res.text);
}

/**
 * Read board
 *
 * @param board
 * @param user
 * @returns {Promise.<void>}
 */
async function readBoard(board, user) {
  let id = toGlobalId('board', board._id.toString());
  return await getXQuery('board', id, user.tokens[0].token);
}

/**
 * User should be able to read board
 *
 * @param board
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldReadBoard(board, user) {
  let result = await readBoard(board, user);

  expect(result.data.getBoard.id).toBe(toGlobalId('board', board._id));
}

test('should respond on __schema query', async () => {

  let query = `{
    __schema {
      types {
        name
      }
    }
  }`;

  let res = await request(Spikenail.server)
    .post('/graphql')
    .send({ query: query })
    .expect('Content-Type', /json/)
    .expect(200);

  let data = JSON.parse(res.text);
  expect(data.data['__schema'].types.length).not.toBe(0);
});

/**
 * User should not be able to read board
 *
 * @param board
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldNotReadBoard(board, user) {
  let result = await readBoard(board, user);

  expect(result.data.getBoard).toBeNull();
}

/**
 * Updates board
 * TODO: implement updateX
 *
 * @param board
 * @param user
 * @param input
 * @returns {Promise.<void>}
 */
async function updateBoard(board, user, input) {

  input.id = toGlobalId('board', board._id);
  let token = user.tokens[0].token;

  let query = `mutation {
    updateBoard(input: ${stringifyObject(input, { singleQuotes: false })}) {
      board {
        id
        userId
        name
      }
      errors {
        code
        message
      }
    }
  }`;

  // TODO: don't put token in header if not specified
  let res = await request(Spikenail.server)
    .post('/graphql')
    .set('authorization', `Bearer ${token}`)
    .send({query: query})
    .expect('Content-Type', /json/)
    .expect(200);

  return JSON.parse(res.text);
}

/**
 * Should update board
 *
 * @param board
 * @param user
 */
async function shouldUpdateBoard(board, user) {

  let name = 'New board name';

  let result = await updateBoard(board, user, { name: name });

  expect(result.updateBoard.board.id).toBe(toGlobalId('board', board._id));
  expect(result.updateBoard.board.name).toBe(name);
}

/**
 * Should not update board
 *
 * @param board
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldNotUpdateBoard(board, user) {
  let result = await updateBoard(board, user, { name: "New board name" });

  expect(result.data.updateBoard.board).toBe(null);
  expect(result.data.updateBoard.errors[0].code).toBe("403");
}

/**
 * Run GraphQL query
 *
 * @param query
 * @param user
 * @returns {Promise.<void>}
 */
async function runQuery(query, user) {

  let token = user ? user.tokens[0].token : '';

  // TODO: don't put token in header if not specified
  let res = await request(Spikenail.server)
    .post('/graphql')
    .set('authorization', `Bearer ${token}`)
    .send({ query: query })
    .expect('Content-Type', /json/)
    .expect(200);

  return JSON.parse(res.text);
}

/**
 * Should not remove item X
 *
 * @param item
 * @param name
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldNotRemoveX(item, name, user) {
  let query = buildMutationQuery({
    action: 'remove',
    name: name,
    item: item
  });

  let result = await runQuery(query, user);

  expectAccessError(result);
}

/**
 * Should successful remove item X
 *
 * @param item
 * @param name
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldRemoveX(item, name, user) {
  let query = buildMutationQuery({
    action: 'remove',
    name: name,
    item: item
  });

  let result = await runQuery(query, user);

  expectSuccessfulRemove(result, item);
}

/**
 * Should successful update X
 *
 * @param item
 * @param name
 * @param user
 * @param input
 * @returns {Promise.<void>}
 */
async function shouldUpdateX(item, name, user, input) {
  let query = buildMutationQuery({
    action: 'update',
    name: name,
    item: item,
    input: input
  });

  let result = await runQuery(query, user);

  expectSuccessfulUpdate(result, input, name);
}

/**
 * Should not allow to update X
 *
 * @param item
 * @param name
 * @param user
 * @param input
 * @returns {Promise.<void>}
 */
async function shouldNotUpdateX(item, name, user, input) {
  let query = buildMutationQuery({
    action: 'update',
    name: name,
    item: item,
    input: input
  });

  let result = await runQuery(query, user);

  expectAccessError(result);
}

/**
 * Should create X
 *
 * @returns {Promise.<void>}
 */
async function shouldCreateX(name, user, input) {
  let query = buildMutationQuery({
    action: 'create',
    name: name,
    input: input
  });

  let result = await runQuery(query, user);

  expectSuccessfulCreate(result, input, name);
}

/**
 * Should not create X
 *
 * @returns {Promise.<void>}
 */
async function shouldNotCreateX(name, user, input) {
  let query = buildMutationQuery({
    action: 'create',
    name: name,
    input: input
  });

  let result = await runQuery(query, user);

  expectAccessError(result);
}

/**
 * Build getX query
 *
 * @param item
 * @param name
 * @returns {Promise.<void>}
 */
function buildGetXQuery(item, name) {

  let keys = Object.keys(item);
  keys.splice(keys.indexOf('_id'), 1);

  let query = `{
    get${capitalizeFirstLetter(name)}(id: "${toGlobalId(name, item._id)}") {
      id
      ${keys.join(' ')}
    }
  }`;

  return query;
}

/**
 * Should not get X
 *
 * @param item
 * @param name
 * @param user
 *
 * @returns {Promise.<void>}
 */
async function shouldNotGetX(item, name, user) {
  let query = buildGetXQuery(item, name);

  let result = await runQuery(query, user);

  expect(result.data['get' + capitalizeFirstLetter(name)]).toBe(null);
}

/**
 * Should get X
 *
 * @param item
 * @param name
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldGetX(item, name, user) {
  let query = buildGetXQuery(item, name);
  let result = await runQuery(query, user);
  expect(result.data[Object.keys(result.data)[0]].id).not.toBe(null);
}

/**
 * Expect successful update
 *
 * @param result
 * @param input
 * @param name
 */
function expectSuccessfulUpdate(result, input, name) {
  let item = result.data[Object.keys(result.data)[0]][name];

  for (let prop of Object.keys(input)) {
    expect(item[prop]).toBe(input[prop]);
  }
}

/**
 * Expect successful create
 *
 * @param result
 * @param input
 * @param name
 */
function expectSuccessfulCreate(result, input, name) {
  let item = result.data[Object.keys(result.data)[0]][name];

  for (let prop of Object.keys(input)) {
    expect(item[prop]).toBe(input[prop]);
  }
}

/**
 * Expect successful removing of item
 *
 * @param result
 */
function expectSuccessfulRemove(result) {
  let removedId = result.data[Object.keys(result.data)[0]].removedId;
  expect(removedId).not.toBe(null);
}

/**
 * Builds mutation query in format required by spikenail framework
 *
 * @param args
 */
function buildMutationQuery(args) {
  let input = args.input || {};

  if (args.item) {
    input.id = toGlobalId(args.name, args.item._id);
  }

  let output = '';

  if (args.action == 'remove') {
    output = 'removedId';
  }

  if (args.action === 'update') {
    // Dynamically build output based on input
    output = `${args.name} {
      ${Object.keys(input).join(', ')}
    }`;
  }

  if (args.action === 'create') {
    output = `${args.name} {
      id,
      ${Object.keys(input).join(', ')}
    }`;
  }

  let query = `mutation {
    ${args.action}${capitalizeFirstLetter(args.name)}(input: ${stringifyObject(input, { singleQuotes: false })}) {
      ${output}
      errors {
        code
        field
        message
      }
    }
  }`;

  return query;
}

/**
 * Expect access error
 *
 * @param result
 */
function expectAccessError(result) {
  let errors = result.data[Object.keys(result.data)[0]].errors;
  expect(errors[0].code).toBe("403");
}

/**
 * Test mutation access error
 *
 * @param name
 * @param input
 * @returns {Promise.<void>}
 */
async function testMutationAccessError(name, input) {
  let mutationName = `create${capitalizeFirstLetter(name)}`;

  let query = `mutation {
    ${mutationName}(input: ${input}) {
      clientMutationId
      ${name} {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }`;

  let res = await request(Spikenail.server)
    .post('/graphql')
    // .set('authorization', 'Bearer token-123)
    .send({ query: query })
    .expect('Content-Type', /json/)
    .expect(200);

  let result = JSON.parse(res.text);

  expect(result.data[mutationName].errors[0].code).toBe("403");

  expect(result.data[mutationName][name]).toBeNull();
}

describe('anonymous role', () => {

  let board = data.boards[0];
  let list = board.lists[0];
  let card = list.cards[0];

  let publicBoard = data.boards[3];

  let publicList = publicBoard.lists[0];

  let publicCard = publicList.cards[0];

  // Able to read tests
  test('should be allowed to read public board by getBoard query', async () => {
    let id = toGlobalId('board', data.boards[1]['_id'].toString());

    let query = `{
      getBoard(id: "${id}") {
        id
        userId
        name
      }
    }`;

    let res = await request(Spikenail.server)
      .post('/graphql')
      .send({ query: query })
      .expect('Content-Type', /json/)
      .expect(200);

    let result = JSON.parse(res.text);

    expect(result.data.getBoard.id).toBe(id);
  });

  test('should be allowed to read list of public board by getBoard query', async () => {
    let checkList = clone(publicList);
    delete checkList.cards;
    await shouldGetX(checkList, 'list', null);
  });

  test('should be allowed to read card of public board by getBoard query', async () => {
    await shouldGetX(publicCard, 'card', null);
  });

  // Not able to read tests
  test('should not be allowed to read private board by getBoard query', async () => {
    let id = toGlobalId('board', data.boards[0]['_id'].toString());

    let query = `{
      getBoard(id: "${id}") {
        id
        userId
        name
      }
    }`;

    let res = await request(Spikenail.server)
      .post('/graphql')
      .send({ query: query })
      .expect('Content-Type', /json/)
      .expect(200);

    let result = JSON.parse(res.text);

    expect(result.data.getBoard).toBeNull();
  });

  test('should not be able to read list of private board by getBoard query', async () => {
    // TODO: issue with attempting of getting card property -- use workaround or something
    let checkList = clone(list);
    delete checkList.cards;
    await shouldNotGetX(checkList, 'list', null);
  });

  test('should not be able to read card of private board', async () => {
    await shouldNotGetX(card, 'card', null);
  });

  test('should only see public boards in allBoards query', async () => {
    let query = `{
      viewer {
        allBoards {
          edges {
            node {
              id
              userId
              name
              isPrivate
            }
          }
        }
      }
    }`;

    // The query should return only boards with isPrivate: false
    let res = await request(Spikenail.server)
      .post('/graphql')
      .send({ query: query })
      .expect('Content-Type', /json/)
      .expect(200);

    let result = JSON.parse(res.text);

    let edges = result.data.viewer.allBoards.edges;

    for (let edge of edges) {
      expect(edge.node.isPrivate).toBe(false);
    }
  });

  test('Should only see lists of public boards in readAll query', async () => {
    let query = `{
      viewer {
        allLists {
          edges {
            node {
              id
              name
              boardId
            }
          }
        }
      }
    }`;

    let result = await runQuery(query, null);
    let edges = result.data.viewer.allLists.edges;
    let publicBoardIds = data.boards.map(board => toGlobalId('board', board._id));

    for (let edge of edges) {
      expect(!!~publicBoardIds.indexOf(edge.node.boardId)).toBe(true)
    }
  });

  test('Should only see cards that belongs to public boards', async () => {
    let query = `{
      viewer {
        allCards {
          edges {
            node {
              id
              title
              listId
              description
            }
          }
        }
      }
    }`;

    let result = await runQuery(query, null);

    let edges = result.data.viewer.allCards.edges;

    // Find public boards and collect public cards ids
    let publicCardIds = [];
    data.boards.filter(board => board.isPrivate === false).forEach(board => {
      if (!board.lists) {
        return;
      }

      board.lists.forEach(list => {
        if (!list.cards) {
          return;
        }

        list.cards.forEach(card => {
          publicCardIds.push(card._id.toString());
        })
      });
    });

    for (let edge of edges) {
      expect(
        !!~publicCardIds.indexOf(fromGlobalId(edge.node.id).id)
      ).toBe(true)
    }
  });

  // create tests
  test('should not be allowed to create boards', async () => {
    await testMutationAccessError('board', `{ name: "New Board" }`);
  });

  test('should not be allowed to create LISTs', async () => {
    await testMutationAccessError('list', `{ name: "New List" }`);
  });

  test('should not be allowed to create cards', async () => {
    await testMutationAccessError('card', `{ title: "New Card" }`);
  });

  // update tests
  test('should not be allowed to update board', async () => {
    await shouldNotUpdateX(
      board, 'board', null, { name: 'Updated board name' });
  });

  test('should not be allowed to update list', async () => {
    await shouldNotUpdateX(
      list, 'list', null, { name: 'Updated list name' });
  });

  test('should not be allowed to update card', async () => {
    await shouldNotUpdateX(
      card, 'card', null, { title: 'Updated card title', description: 'Updated description' });
  });

  // remove tests
  test('should not be allowed to remove board', async () => {
    await shouldNotRemoveX(board, 'board', null);
  });

  test('should not be allowed to remove list', async () => {
    await shouldNotRemoveX(list, 'list', null);
  });

  test('should not be allowed to remove card', async () => {
    await shouldNotRemoveX(card, 'card', null);
  });

  // Check that relations setup is correct
  test('relations tree is fine', async () =>  {

    let query = `{
      viewer {
        allBoards {
          edges {
            node {
              id
              isPrivate
              userId
              name
              user {
                id
                name
              }
              lists {
                edges {
                  node {
                    id
                    boardId
                    name
                    board {
                      id
                      name
                    }
                    cards {
                      edges {
                        node {
                          id
                          listId
                          description
                          title
                          list {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    let result = await runQuery(query, null);

    let edges = result.data.viewer.allBoards.edges;

    // Has many
    expect(edges[1].node.lists.edges[0].node.cards.edges[0].node.id).toBeTruthy();

    // Board belongs to user
    expect(edges[0].node.user.id).toBeTruthy();

    //List belongs to board
    expect(edges[1].node.lists.edges[0].node.board).toBeTruthy();

    // Card belongs to list
    expect(edges[1].node.lists.edges[0].node.cards.edges[0].node.list.id).toBeTruthy();
  });

  test('has many does not return wrong items', async () => {

    let query = `{
      viewer {
        allBoards {
          edges {
            node {
              id
              lists {
                edges {
                  node {
                    id
                    boardId
                    name
                  }
                }
              }
            } 
          }
        }
      }
    }`;

    let result = await runQuery(query, null);

    let edges = result.data.viewer.allBoards.edges;

    for (let board of edges) {
      if (!board.node.lists) {
        continue;
      }

      for (let list of board.node.lists.edges) {
        expect(list.node.boardId).toBe(board.node.id);
      }
    }
  });

});

// authenticated role
describe('user role', () => {

  let user = data.users[0];
  let publicBoard = data.boards[3];
  let publicList = publicBoard.lists[0];
  let publicCard = publicList.cards[0];

  let privateBoard = data.boards[2];
  let privateBoardList = privateBoard.lists[0];
  let privateBoardCard = privateBoardList.cards[0];

  // allowed to read tests
  test('should be allowed to read public board by getBoard query', async () => {
    expect(data.boards[3].isPrivate).toBe(false);
    await shouldReadBoard(data.boards[3], data.users[0]);
  });

  test('should be allowed to read LIST of public board by getBoard query', async () => {
    let checkList = clone(publicList);
    delete checkList.cards;
    await shouldGetX(checkList, 'list', user);
  });

  test('should be allowed to read CARD of public board by getBoard query', async () => {
    await shouldGetX(publicCard, 'card', user);
  });

  // should not be allowed to read tests
  test('should NOT be allowed to read foreign private board by getBoard query', async () => {
    expect(privateBoard.isPrivate).toBe(true);
    await shouldNotReadBoard(privateBoard, user);
  });

  test('should not be able to read list of private board by getBoard query', async () => {
    // TODO: issue with attempting of getting card property -- use workaround or something
    let checkList = clone(privateBoardList);
    delete checkList.cards;
    await shouldNotGetX(checkList, 'list', user);
  });

  test('should not be able to read card of private board', async () => {
    await shouldNotGetX(privateBoardCard, 'card', user);
  });

  // Create tests
  test('should be able to create new boards (private by default)', async () => {

    let name = 'My new board';

    let query = `mutation {
      createBoard(input: { name: "${name}" }) {
        board {
          id
          name
          userId
          isPrivate
        }
        errors {
          message
          code
        }
      }
    }`;

    let res = await request(Spikenail.server)
      .post('/graphql')
      .set('authorization', 'Bearer ' + data.users[0].tokens[0].token)
      .send({ query: query })
      .expect('Content-Type', /json/)
      .expect(200);

    let result = JSON.parse(res.text);

    expect(result.data.createBoard.board.id).toBeTruthy();
    expect(result.data.createBoard.board.userId).toBeTruthy();
    expect(result.data.createBoard.board.name).toBe(name);
    expect(result.data.createBoard.board.isPrivate).toBe(true);
  });

  // Should not able to modify data tests
  test('should NOT be able to update foreign public and private boards', async () => {
    await shouldNotUpdateBoard(data.boards[2], data.users[0]);
    await shouldNotUpdateBoard(data.boards[3], data.users[0]);
  });

  test('should NOT be able to delete foreign public and private boards', async () => {
    await shouldNotRemoveX(data.boards[2], 'board', data.users[0]);
    await shouldNotRemoveX(data.boards[3], 'board', data.users[0]);
  });

  test('should NOT be able to create LISTs for foreign (private, public) or not existing board', async () => {

    // Foreign private board
    await shouldNotCreateX('list', data.users[0], {
      name: "My new list",
      boardId: toGlobalId('board', data.boards[2]['_id'])
    });

    // Foreign public board
    await shouldNotCreateX('list', data.users[0], {
      name: "My new list",
      boardId: toGlobalId('board', data.boards[3]['_id'])
    });

    // TODO: boardId is not specified
    // TODO: not existing boardId
  });

  test('should NOT be able to create CARDs for foreign board', async () => {
    let listId = toGlobalId('list', privateBoard.lists[0]._id);
    await shouldNotCreateX('card', data.users[0], { title: 'Can not create this card', listId: listId })
  });
});

describe('board owner', () => {

  let user = data.users[0];

  let ownBoard = data.boards[0];
  let ownList = ownBoard.lists[0];
  let ownCard = ownList.cards[0];

  // Should be able to read tests
  test('should be able to read private board he owns', async () => {
    let id = toGlobalId('board', data.boards[0]['_id'].toString());

    let query = `{
      getBoard(id: "${id}") {
        id
        userId
        name
      }
    }`;

    let res = await request(Spikenail.server)
      .post('/graphql')
      .set('authorization', 'Bearer ' + data.users[0].tokens[0].token)
      .send({ query: query })
      .expect('Content-Type', /json/)
      .expect(200);

    let result = JSON.parse(res.text);

    expect(result.data.getBoard.id).toBe(id);
    expect(result.data.getBoard.userId).toBe(toGlobalId('user', data.users[0]._id.toString()));
  });

  test('should be able to read LIST of the private board he owns', async () => {
    let checkList = clone(ownList);
    delete checkList.cards;
    await shouldGetX(checkList, 'list', user);
  });

  test('should be able to read CARD of the private board he owns', async () => {
    await shouldGetX(ownCard, 'card', user);
  });

  test('Should see both public and private boards he owns in the allBoards query', async () => {
    let query = `{
      viewer {
        allBoards {
          edges {
            node {
              id
              userId
              name
              isPrivate
            }
          }
        }
      }
    }`;

    let result = await runQuery(query, user);

    let edges = result.data.viewer.allBoards.edges;

    let privateCount = 0;
    let publicCount = 0;

    for (let edge of edges) {
      if (edge.node.isPrivate) {
        privateCount++;
      } else {
        publicCount++;
      }
    }

    expect(privateCount).toBeTruthy();
    expect(publicCount).toBeTruthy();
  });

  // TODO: allCards, allLists tests

  //  Should be able to modify data tests
  test('should be able to remove the board he owns', async () => {
    await shouldRemoveX(data.boards[4], 'board', data.users[0]);
  });

  test('should be able to update the board he owns', async () => {
    await shouldUpdateX(data.boards[0], 'board', data.users[0], { name: "New board name" })
  });

  test('should be able to create, update, delete LISTs for his own private board', async () => {
    let boardId = toGlobalId('board', data.boards[0]['_id']);
    await shouldCreateX('list', data.users[0], { name: "My new list", boardId: boardId });

    await shouldUpdateX(ownList, 'list', user, { name: "New name" });

    await shouldRemoveX(ownBoard.lists[3], 'list', user);
  });

  test('should be able to create, update, delete CARDs for his own private board', async () => {
    let listId = toGlobalId('list', ownBoard.lists[0]._id);
    await shouldCreateX('card', user, { title: 'New successful card', listId: listId });

    await shouldUpdateX(ownCard, 'card', user, { title: 'Updated card title' });

    await shouldRemoveX(ownList.cards[2], 'card', user);
  });

});

describe('board member', () => {

  let member = data.users[1];
  let memberBoard = data.boards[0];
  let memberBoardList = memberBoard.lists[0];
  let memberBoardListToRemove = memberBoard.lists[1];
  let memberBoardCard = memberBoardList.cards[0];
  let memberBoardCardToRemove = memberBoardList.cards[1];

  // Able to read tests
  test('should be able to read private board he is added to as a member', async () => {

    let token = data.users[1].tokens[0].token;
    let id = toGlobalId('board', data.boards[0]._id);

    let result = await getXQuery('board', id, token);

    expect(result.data.getBoard.id).toBe(id);
    expect(result.data.getBoard.userId).toBe(toGlobalId('user', data.users[0]._id.toString()));
  });

  test('should be able to read LIST of private board he is added to as a member', async () => {
    let checkList = clone(memberBoardList);
    delete checkList.cards;
    await shouldGetX(checkList, 'list', member);
  });

  test('should be able to read CARD of private board he is added to as a member', async () => {
    await shouldGetX(memberBoardCard, 'card', member);
  });

  // Able to modify data tests
  test('should be able to create LISTs for the private board he is added to', async () => {
    await shouldCreateX('list', member, {
      name: "My new list",
      boardId: toGlobalId('board', memberBoard['_id'])
    });
  });

  test('should be able to remove LISTs of the private board he is added to', async () => {
    await shouldRemoveX(memberBoardListToRemove, 'list', member)
  });

  test('should be able to update LISTs of the private board he is added to', async () => {
    await shouldUpdateX(memberBoardList, 'list', member, {
      name: 'New list name'
    });
    // TODO: test changing of boardId
  });

  test('should be able to create CARDs for the private board he is added as a member', async () => {
    let listId = toGlobalId('list', memberBoardList._id);
    await shouldCreateX('card', member, { title: 'New member card', listId: listId });
  });

  test('should be able to remove CARD of the private board he is added as a member', async () => {
    await shouldRemoveX(memberBoardCardToRemove, 'card', member);
  });

  test('should be able to update CARD of the private board he is added as a member', async () => {
    await shouldUpdateX(memberBoardCard, 'card', member, { title: 'Updated card title'});
  });

  // Should not modify data tests
  test('should NOT be able to delete private board he is added to', async () => {
    await shouldNotRemoveX(data.boards[0], 'board', data.users[1]);
  });
});

describe('board observer', () => {

  let observer = data.users[2];
  let observerBoard = data.boards[0];
  let observerBoardList = observerBoard.lists[0];
  let observerBoardCard = observerBoardList.cards[0];

  test('should be able to read private board he is added to as a observer', async () => {

    let token = data.users[2].tokens[0].token;
    let id = toGlobalId('board', data.boards[0]._id);

    let result = await getXQuery('board', id, token);

    expect(result.data.getBoard.id).toBe(id);
    expect(result.data.getBoard.userId).toBe(toGlobalId('user', data.users[0]._id.toString()));
  });

  test('should be able to read LIST of the private board he is added to as a observer', async () => {
    let checkList = clone(observerBoardList);
    delete checkList.cards;
    await shouldGetX(checkList, 'list', observer);
  });

  test('should be able to read CARD of the private board he is added to as a observer', async () => {
    await shouldGetX(observerBoardCard, 'card', observer);
  });

  // Should not be able to modify data tests
  test('should not be able to edit private board he is added to as a observer', async () => {
    await shouldNotUpdateX(data.boards[0], 'board', data.users[2], { name: "Update attempt" });
  });

  test('should NOT be able to delete private board he is added to as a observer', async () => {
    await shouldNotRemoveX(data.boards[0], 'board', data.users[2]);
  });

  test('should NOT be able to create LIST for board he is added to as an observer', async () => {
    await shouldNotCreateX('list', observer, {
      name: "Observer new list",
      boardId: toGlobalId('board', observerBoard['_id'])
    });
  });

  test('should not be able to create LIST for the private board he is added to as a observer', async () => {
    await shouldNotCreateX('list', observer, {
      name: 'New list',
      boardId: toGlobalId('board', observerBoard._id)
    });
  });

  test('should NOT be able to update LIST of the board he is added to as an observer', async () => {
    // TODO: test response is not easy to read
    await shouldNotUpdateX(observerBoardList, 'list', observer, { name: "List update attempt" });
    // TODO: test list update putting accessible/wrong boardId
  });

  test('should NOT be able to delete LIST of the board he is added to as an observer', async () => {
    await shouldNotRemoveX(observerBoardList, 'list', observer);
  });

  // TODO: Should not be able to Create card
  test('should not be able to create CARD for the private board he is added to as a observer', async () => {
    await shouldNotCreateX('card', observer, {
      title: 'New card',
      listId: toGlobalId('list', observerBoardList._id)
    });
  });

  test('should NOT be able to update CARD of the board he is added to as an observer', async () => {
    // TODO test with wrong listId
    // TODO test with not existing listId

    // observerBoardList
    await shouldNotUpdateX(
      observerBoardList.cards[0], 'card', observer, { title: 'Updated card title', description: 'Updated description' });
  });

  test('should NOT be able to delete CARD of the board he is added to as an observer', async () => {
    await shouldNotRemoveX(observerBoardList.cards[0], 'card', observer);
  });
});