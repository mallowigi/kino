#! node
var cheerio = require('cheerio');
var Q = require('q');
var _ = require('lodash');
var request = require('request');

var $;

// Load the page first
var url = 'http://www.gelbeseiten.de/kino/berlin';


function scrapEntries () {
  $ = cheerio.load(this.getHTML());

  $('.teilnehmer').each(function (index, entryElement) {
    console.log(parseEntry(entryElement));
  })
}

function parseEntry (entryElement) {
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

function parsePhone ($entry) {
  var phoneNumber = $entry.find('.phone .suffix').text();

  var matches = phoneNumber.match(/^([^-]+)/);
  return matches[1];
}
