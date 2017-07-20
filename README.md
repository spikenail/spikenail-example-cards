# spikenail-example-cards

GraphQL API for Trello-like application built with spikenail framework.

## Installation

```
$ git clone https://github.com/spikenail/spikenail-example-cards
$ cd spikenail-example-cards
$ npm install
```

## Configure the database

Edit `config/sources.js` or specify
`SPIKENAIL_EXAMPLE_CARDS_MONGO_CONNECTION_STRING` environment variable.

## Fill the database with test data

Specify `SPIKENAIL_EXAMPLE_CARDS_MONGO_CONNECTION_STRING_TEST` environment variable.

Run `npm test`.
It will delete all data from the database and fill it with test data from `db/data.js` file.

## Run the server

```
$ npm start
```

Browse to http://localhost:5000/graphql to open in-browser GraphQL IDE