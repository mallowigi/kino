#! casperjs
// Libs
var fs = require('fs');

// Consts
var url      = 'http://www.gelbeseiten.de/kino/berlin',
    CSV_FILE = 'report.csv';

// The casper
var casper = require('casper').create({
  clientScripts: ['node_modules/jquery/dist/jquery.min.js'],
  pageSettings: {
    loadImages: false,
    loadPlugins: false
  },
  logLevel: "info"
});

// The results
var items = [];

function getItems (parseEntry) {
  var results = [];
  $('.teilnehmer').each(function (index, item) {
    results.push(parseEntry(item));
  });
  return results;
}

function parseEntry (entryElement) {
  function parsePhone ($entry) {
    var phoneNumber = $entry.find('.phone .suffix').text();

    var matches = phoneNumber.match(/^([^-]+)/);
    return matches[1];
  }

  function normalizeEntry (entry) {
    Object.keys(entry).forEach(function (key) {
      entry[key] = entry[key].replace(/\s/g, '');
    });
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

  normalizeEntry(entry);

  return entry;
}

function writeToCSV (item) {
  var stream = fs.open('report.csv', 'aw');
  stream.writeLine(JSON.stringify(item));
  stream.flush();
  stream.close();
}

casper.start(url, function () {
  this.echo('Preparing environment...');
  fs.remove(CSV_FILE);
});

casper.then(function () {
  this.echo('Scraping website...')
  items = this.evaluate(getItems, parseEntry);
});

casper.then(function () {
  this.echo(items.length + ' items found. Writing to CSV...');
  items.forEach(function (item) {
    if (item) {
      writeToCSV(item);
    }
  })
})

casper.run(function () {
  this.echo('Finished scraping website.');
  this.exit();
});

