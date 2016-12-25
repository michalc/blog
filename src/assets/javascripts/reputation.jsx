/** @jsx Preact.h */

var Preact = require('preact');

// Polyfills and so set globals
require('isomorphic-fetch');

var USER_ID = 1319998;
var SITE = "stackoverflow.com";
var KEY = "IuEWeQbgKqLACgi0FNMcOQ((";

var SE = (function() {
  var base = 'http://api.stackexchange.com/2.1/';

  function toQueryString(obj) {
    var str = [];
    for (var key in obj) {
      str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
    return str.join('&');
  }

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

class ReputationBox extends Preact.Component {
  getInitialState() {
    var cachedReputation = localStorage.getItem('user-' + USER_ID);
    return {
      data: cachedReputation || ''
    };
  }
  componentDidMount() {
    var self = this;
    user.then(function(user) {
      self.setState({
        data: user.reputation
      });
      localStorage.setItem('user-' + USER_ID, user.reputation);
    });
  }
  render() {
    if (!this.state.data) return false;
    return (
      <span className="reputation">
        <i className="fa fa-stack-overflow" /><span className="icon-link-text">{formatNumber(this.state.data)}</span>
      </span>
    );
  }
}

document.addEventListener("DOMContentLoaded", function() {
  Preact.render(
    <ReputationBox />,
    document.getElementById('reputation')
  );
});

