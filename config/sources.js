export default {
  'default': {
    adapter: 'mongo',
    connectionString: process.env.SPIKENAIL_EXAMPLE_CARDS_MONGO_CONNECTION_STRING
  },
  'test': {
    adapter: 'mongo',
    connectionString: process.env.SPIKENAIL_EXAMPLE_CARDS_MONGO_CONNECTION_STRING_TEST
  }
}