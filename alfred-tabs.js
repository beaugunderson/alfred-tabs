#!/usr/bin/env node

'use strict';

var et = require('elementtree');
var program = require('commander');
var request = require('request');
var _ = require('lodash');

function alfredTabs(tabs) {
  var root = new et.Element('items');

  tabs.forEach(function (tab) {
    var item = new et.SubElement(root, 'item');

    item.set('uid', tab.title);
    item.set('arg', tab.windowId + ':' + tab.id);
    item.set('autocomplete', tab.title);

    var title = new et.SubElement(item, 'title');
    title.text = tab.title;

    if (tab.url) {
      var subtitle = new et.SubElement(item, 'subtitle');
      subtitle.text = tab.url;
    }
  });

  console.log(new et.ElementTree(root).write());
}

program
  .option('-q, --query', 'Query for a tab')
  .option('-f, --focus', 'Focus a tab')
  .parse(process.argv);

if (program.query) {
  request.get({
    url: 'http://127.0.0.1:10000',
    json: true
  }, function (err, res, windows) {
    if (err) {
      return;
    }

    var tabs = _.flatten(windows.map(function (window) {
      return window.tabs;
    }));

    if (program.args) {
      tabs = tabs.filter(function (tab) {
        return _.all(program.args, function (arg) {
          return tab.title.toLowerCase().indexOf(arg.toLowerCase()) !== -1 ||
                 tab.url.toLowerCase().indexOf(arg.toLowerCase()) !== -1;
        });
      });
    }

    alfredTabs(tabs);
  });
}

if (program.focus) {
  if (!program.args) {
    process.exit(1);
  }

  var windowId = parseInt(program.args[0].split(':')[0], 10);
  var tabId = parseInt(program.args[0].split(':')[1], 10);

  request.post({
    url: 'http://127.0.0.1:10000',
    json: {
      window: windowId,
      tab: tabId
    }
  }, function (err, res, body) {
    if (err) {
      console.error(err);
    }

    console.log('focus', body);
  });
}
