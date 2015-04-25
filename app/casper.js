#! casperjs
var url = 'http://www.gelbeseiten.de/kino/berlin';
var casper = require('casper').create({
  clientScripts: ['node_modules/jquery/dist/jquery.min.js'],
  pageSettings: {
    loadImages: false,
    loadPlugins: false
  },
  logLevel: "info",
  verbose: true
});

function parseEntry (entryElement) {
  function parsePhone ($entry) {
    var phoneNumber = $entry.find('.phone .suffix').text();

    var matches = phoneNumber.match(/^([^-]+)/);
    return matches[1];
  }

  var $entry = $(entryElement);
  var entry = {};

  // Parse name
  entry.name = $entry.find('[itemprop="name"]').text();

  // Parse address
  entry.address = $entry.find('[itemprop="streetAddress"]').text();

  // Parse postal code
  entry.postalCode = $entry.find('[itemprop="postalCode"]').text();

  // Parse locality
  entry.locality = $entry.find('[itemprop="addressLocality"]').text();

  // Parse branch
  entry.branch = $entry.find('.branchen span').text();

  // Parse additional info
  entry.additionalInfo = $entry.find('.gebuehreninformation').text();

  // Parse telephone number
  entry.phone = parsePhone($entry);

  // Parse email
  entry.email = $entry.find('.email .text').text();

  // Parse website
  entry.website = $entry.find('.website .text').text();

  return entry;
}

casper.start(url);

casper.then(function () {
  var results = this.evaluate(function (parseEntry) {
    var results = [];
    $('.teilnehmer').each(function (index, item) {
      results.push(parseEntry(item));
    });
    return results;
  }, parseEntry);

  return results;
})

casper.run();

