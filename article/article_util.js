var _ = require('underscore');

var MONTH_MAPPING = {
  "1": "January",
  "2": "February",
  "3": "March",
  "4": "April",
  "5": "May",
  "6": "June",
  "7": "July",
  "8": "August",
  "9": "September",
  "10": "October",
  "11": "November",
  "12": "December"
};

var util = {};

util.formatDate = function (pubDate) {
  var parts = pubDate.split("-");
  var partCount = parts.length;
  var year  = partCount > 0 ? parts[0] : "";
  var month = partCount > 1 ? MONTH_MAPPING[parts[1].replace(/^0/, "")] : "";
  var day   = partCount > 2 ? parts[2] : "";
  var dateParts = [];
  if (partCount >= 3) {
    dateParts = [month, day, year];
  } else if (parts.length === 2) {
    dateParts = [month, year];
  } else if (parts.length === 1) {
    dateParts = [year];
  }
  return dateParts.join(" ").replace(/\b0+/g, '');
};

util.monthSymToNum = function (sym){
  var num = 1;
  _.find(MONTH_MAPPING, function(ms, idx){
    if(ms==sym){
      num = idx;
      return true;
    }
    return false;
  });

  return num;
};

module.exports = util;
