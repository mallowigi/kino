#! node
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var _ = require('lodash');
var request = require('request');

var $;

//Q.ninvoke(fs, 'readFile', 'page_dump')
//  .then(scrapEntries)
//  .catch(function (err) { throw Error(err)});

//fs.readFile(path.resolve('page_dump'), function (err, data) {
//  if (err) {
//    throw Error(err);
//  }
//  scrapEntries(data);
//})

exports.scrapEntries = function scrapEntries (html) {
  var results = [];
  $ = cheerio.load(html);

  $('.teilnehmer').each(function (index, entryElement) {
    results.push(parseEntry(entryElement));
  });
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
