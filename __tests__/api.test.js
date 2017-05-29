const request = require('supertest');

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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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
  // TODO
});

describe('board owner', () => {
  // TODO
});

describe('board member', () => {
  // TODO
});

describe('board observer', () => {
  // TODO
});