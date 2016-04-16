var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');

// Polyfills and so set globals
require('es6-promise').polyfill();
require('isomorphic-fetch');

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

var user = SE.getUser(USER_ID, SITE, KEY).then(function(user) {
  return user;
  self.setState({
     data: user.reputation
  });
  localStorage.setItem('user-' + USER_ID, user.reputation);
});

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
    user.then(function(user) {
      self.setState({
        data: user.reputation
      });
      localStorage.setItem('user-' + USER_ID, user.reputation);
    });
  },
  render: function() {
    if (!this.state.data) return false;
    return (
      <span className="reputation">
        <i className="fa fa-stack-overflow" /><span className="icon-link-text">{formatNumber(this.state.data)}</span>
      </span>
    );
  }
});


document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(ReputationBox, null),
    document.getElementById('reputation')
  );
});

