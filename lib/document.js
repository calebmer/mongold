var _ = require('lodash');

function Document(document) {

  var self = this;

  // If not using `new` syntax, force `new`
  if (!(self instanceof Document)) {
    return new Document(document);
  }

  // Extend using the document
  _.extend(self, document);
}

module.exports = Document;
