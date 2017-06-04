const request = require('supertest');

const stringifyObject = require('stringify-object');

const Query = require('graphql-query-builder');

import { Spikenail } from 'spikenail'

import {
  toGlobalId,
} from 'graphql-relay';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

const MongoClient = require('mongodb').MongoClient;

let db = null;

import sources from  '../config/sources';

import data from '../db/data';

// Connection URL
// Use default datasource
const url = sources.default.connectionString;

/**
 * Connect to database
 *
 * @returns {Promise.<void>}
 */
async function connect() {
  console.log('connecting to server');
  db = await MongoClient.connect(url);
}

/**
 * Truncate current database
 */
async function clearDatabase() {
  console.log('clear database');

  let collections = await db.listCollections().toArray();
    console.log('collections', collections);

  for (let collection of collections) {
    if (collection.name.startsWith('system.')) {
      continue;
    }

    console.log('col name', collection.name);
    // Drop collection

    await db.dropCollection(collection.name);
    console.log('dropped:', collection.name);
  }
}

/**
 * Push initial data in the database
 */
async function initDatabase() {
  console.log('init database');

  for (let collectionName of Object.keys(data)) {
    let collectionData = data[collectionName];
    // Insert entries
    let collection = db.collection(collectionName);
    await collection.insertMany(collectionData);
    console.log('inserted data for', collectionName);
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

  console.log('getXQuery', query, 'token', token);

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
 * TODO
 */
function updateX(item, user) {
  // TODO:
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
    updateBoard(input: ${stringifyObject(input)}) {
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

  let token = user.tokens[0].token;

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
 * Should remove item X
 * @param item
 * @param name
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldRemoveX(item, name, user) {

}

/**
 * Builds mutation query in format required by spikenail framework
 *
 * @param args
 */
function buildMutationQuery(args) {

  let output = '';

  if (args.action == 'remove') {
    output = 'removedId';
  }

  let input = args.input || {};

  if (args.item) {
    input.id = toGlobalId(args.name, args.item._id);
  }

  let query = `mutation {
    ${args.action}${capitalizeFirstLetter(args.name)}(input: ${stringifyObject(input)}) {
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
 *
 * @param X
 * @param user
 * @returns {Promise.<void>}
 */
async function shouldDeleteX(X, user) {

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

  console.log(query);

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
  test('should be allowed to read public board by getBoard query', async() => {
    let id = toGlobalId('board', data.boards[1]['_id'].toString());
    console.log('globlid', id );

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

  test('should not be allowed to read private board by getBoard query', async() => {
    let id = toGlobalId('board', data.boards[0]['_id'].toString());
    console.log('globlid', id);

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

  test('should not be allowed to create boards', async() => {
    await testMutationAccessError('board', `{ name: "New Board" }`);
  });

  test('should not be allowed to create lists', async() => {
    await testMutationAccessError('list', `{ name: "New List" }`);
  });

  test('should not be allowed to create cards', async() => {
    await testMutationAccessError('card', `{ title: "New Card" }`);
  });

  // TODO: should not be allowed to update items

  // TODO: should not be allowed to delete items
});

// authenticated role
describe('user role', () => {

  test('should be allowed to read public board by getBoard query', async () => {
    expect(data.boards[3].isPrivate).toBe(false);
    await shouldReadBoard(data.boards[3], data.users[0]);
  });

  test('should NOT be allowed to read foreign private board by getBoard query', async () => {
    expect(data.boards[2].isPrivate).toBe(true);
    await shouldNotReadBoard(data.boards[2], data.users[0]);
  });

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

  test('should NOT be able to update foreign public and private boards', async () => {
    shouldNotUpdateBoard(data.boards[2], data.users[0]);
    shouldNotUpdateBoard(data.boards[3], data.users[0]);
  });

  test('should NOT be able to delete foreign public and private boards', async () => {
    shouldNotRemoveX(data.boards[2], 'board', data.users[0]);
    shouldNotRemoveX(data.boards[3], 'board', data.users[0]);
  });

  // test('should be able to create lists', async () => {
  //   // TODO
  // });
  //
  // test('should be able to create cards', async () => {
  //   // TODO
  // });

  // Should not be able to edit foreign lists

  // Should not be able to delete foreign cards

  // TODO
});



describe('board owner', () => {
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

  // Should be able to delete the board he owns

  // Should be able to update the board he owns

  // Should be able to create, update, delete lists for his own board

  // Should not be able to create lists for foreign board

  // Should be able to create cards for his own board

  // Should not be able to create cards for foreign board

});

describe('board member', () => {
  test('should be able to read private board he is added to as a member', async () => {

    let token = data.users[1].tokens[0].token;
    let id = toGlobalId('board', data.boards[0]._id);

    let result = await getXQuery('board', id, token);

    expect(result.data.getBoard.id).toBe(id);
    expect(result.data.getBoard.userId).toBe(toGlobalId('user', data.users[0]._id.toString()));
  });

  // should be able to edit private board?

  test('should NOT be able to delete private board he is added to', async () => {
    shouldNotRemoveX(data.boards[0], 'board', data.users[1]);
  });

  // should be able to create lists for the private board

});

describe('board observer', () => {

  test('should be able to read private board he is added to as a observer', async () => {

    let token = data.users[2].tokens[0].token;
    let id = toGlobalId('board', data.boards[0]._id);

    let result = await getXQuery('board', id, token);

    expect(result.data.getBoard.id).toBe(id);
    expect(result.data.getBoard.userId).toBe(toGlobalId('user', data.users[0]._id.toString()));
  });

  // should not be able to edit private board he is added to as a observer

});