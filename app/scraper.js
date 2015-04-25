#! casperjs
// Libs
var fs = require('fs');

// Consts
var url       = 'http://www.gelbeseiten.de/kino/berlin',
    CSV_FILE  = 'report.csv',
    NEXT_PAGE = '.gs_seite_vor';

var properties = ['name', 'address', 'postalCode', 'locality', 'branch', 'additionalInfo', 'phone', 'email', 'website'];

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
var items         = [],
    doneScrapping = false;

function getItems (parseEntry) {
  var results = [];
  $('.teilnehmer').each(function (index, item) {
    results.push(parseEntry(item));
  });
  return results;
}

function parseEntry (entryElement) {
  function parsePhone ($entry) {
    var phoneNumber1 = $entry.find('.phone .nummer').text(),
        phoneNumber2 = $entry.find('.phone .suffix').text(),
        phoneNumber  = phoneNumber1 + phoneNumber2;

    var matches = phoneNumber.match(/^([^-]+)/);
    return matches[1];
  }

  function parseEmail ($entry) {
    var emailRegex = /^(.*)(?:\.\.\.)(?:\w)/;
    var email = $entry.find('.email .text').text();

    if (emailRegex.test(email)) {
      var matches = email.match(emailRegex);
      return matches[1];
    }

    return email;
  }

  function normalizeEntry (entry) {
    Object.keys(entry).forEach(function (key) {
      entry[key] = entry[key].replace(/[\s,]/g, ' ');
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
  entry.email = parseEmail($entry);

  // Parse website
  entry.website = $entry.find('.website .text').text();

  normalizeEntry(entry);

  return entry;
}

function prepareCSV () {
  var stream = fs.open('report.csv', 'aw');
  stream.writeLine(properties.join());

  stream.flush();
  stream.close();
}

function writeToCSV (item) {

  function toCsv (item) {
    var csv = [];

    properties.forEach(function (key) {
      csv.push(item[key]);
    });

    return csv.join();
  }

  var stream = fs.open('report.csv', 'aw');
  stream.writeLine(toCsv(item));
  stream.flush();
  stream.close();
}

/**
 * Scrap a page of the website
 */
function scrapingWebsite () {
  this.echo('Scraping website...')
  items = items.concat(this.evaluate(getItems, parseEntry));

  // next page
  if (casper.visible(NEXT_PAGE)) {
    casper.echo('Next page found, scrapping next page');
    casper.thenClick(NEXT_PAGE);
    casper.then(scrapingWebsite);
  }
}

casper.start(url, function () {
  this.echo('Preparing environment...');
  if (fs.exists(CSV_FILE)) {
    fs.remove(CSV_FILE);
  }
});

casper.then(scrapingWebsite);

casper.then(function () {
  this.echo(items.length + ' items found. Writing to CSV...');
  prepareCSV();

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

