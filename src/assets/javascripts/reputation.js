var React = require('react');
var ReactDOM = require('react-dom');
var fetch = require('whatwg-fetch');
var _ = require('lodash');

// whatwg-fetch polyfill doesn't work if the browser has fetch!
if (window.fetch) fetch = window.fetch;

var USER_ID = 1319998;
var SITE = "stackoverflow.com";
var KEY = "IuEWeQbgKqLACgi0FNMcOQ((";

var SE = (function() {
  var base = 'http://api.stackexchange.com/2.1/';

  function toQueryString(obj) {
    return _.map(obj,function(v,k){
      return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
  };

  function getUser(userId, site, key) {
    var params = {
      site: site,
      key: key,
      pagesize: 10
    };

    return fetch(base + 'users/' + userId + '?' + toQueryString(params)).then(function(response) {
      return response.json();
    }).then(function(response) {
      return response.items[0];
    });
  };

  return {
    getUser: getUser
  };
})();

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

var ReputationBox = React.createClass({
  displayName: 'ReputationBox',
  getInitialState: function() {
    var cachedReputation = localStorage.getItem('user-' + USER_ID);
    return {
      data: cachedReputation || ''
    };
  },
  componentDidMount: function() {
    var self = this;
    SE.getUser(USER_ID, SITE, KEY).then(function(user) {
      self.setState({
        data: user.reputation
      });
      localStorage.setItem('user-' + USER_ID, user.reputation);
    });
  },
  render: function() {
    if (!this.state.data) return false;
    return (
      React.createElement('span', {className: "reputation"}, 
        React.createElement('i', {className: "fa fa-stack-overflow"}),
        React.createElement('span', {className: "icon-link-text"}, formatNumber(this.state.data))
      )
    );
  }
});


document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(ReputationBox, null),
    document.getElementById('reputation')
  );
});

