# Mongold

[![Greenkeeper badge](https://badges.greenkeeper.io/calebmer/mongold.svg)](https://greenkeeper.io/)
A NodeJS MongoDB ORM for the Linked Data age.

## Word of Warning
Mongold is **not ready for production**: The syntax **is not stable**, there is **no documentation**, and the feature set is **incomplete**.

I am still developing this package for use in JSON-LD based APIs I am building, so the package will reflect that use case while being strictly decoupled from the API's business logic.

For now, I encourage you to look at the tests (ugly as they are, they need a refactor), and explore some of the current uses for Mongold and weigh in on things you think would be interesting to see via issues.

Enjoy! Written on the 24th of June 2015.

## Access
> I'm not writing documentation yet, I just want to quickly sketch out a spec

One of the ways Mongold extends the JSON Schema syntax is with the `access` keyword on properties. The `access` keyword specifies who can access the data.

- 0: Anyone can access the data
- 1: Only privileged users (often the owner) can access
- 2: Only the server can access

## A Name of Many Meanings
This package was hard to create a name for. Mongol was taken on NPM and is a package used for Meteor, so a simple '*d*' was added. This is what the it became:

- **Mongo**-ld: as in MongoDB
- Mongo-**ld**: as in Linked Data
- **Mongol**-d: as in Ghengis Khan
- Mon-**gold**: as in gold (*cha-ching*)
