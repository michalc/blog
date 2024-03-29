/** @jsx Preact.h */

var Preact = require('preact');

var USER_ID = 1319998;
var SITE = "stackoverflow.com";
var KEY = "IuEWeQbgKqLACgi0FNMcOQ((";

var SE = (function() {
  var base = 'https://api.stackexchange.com/2.1/';

  function fetch(url) {
    return new Promise((resolve, reject) => {
      function reqListener() {
        resolve(JSON.parse(oReq.responseText));
      }

      var oReq = new XMLHttpRequest();
      oReq.addEventListener('load', reqListener);
      oReq.open('GET', url);
      oReq.send(); 
    });
  }

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
  constructor(props) {
    super(props);
    var cachedReputation = localStorage.getItem('user-' + USER_ID);
    this.state = {
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


var HackerNews = (function() {
  var base = 'https://hn.algolia.com/api/v1/';

  function fetch(url) {
    return new Promise((resolve, reject) => {
      function reqListener() {
        resolve(JSON.parse(oReq.responseText));
      }

      var oReq = new XMLHttpRequest();
      oReq.addEventListener('load', reqListener);
      oReq.open('GET', url);
      oReq.send();
    });
  }

  function fetchItem(itemId) {
    return fetch(base + 'items/' + itemId);
  };

  return {
    fetchItem: fetchItem
  };
})();

class HackerNewsScore extends Preact.Component {
  constructor(props) {
    super(props);
    var itemId = props['item-id'];
    HackerNews.fetchItem(itemId).then((item) => {
      this.setState({
        points: item.points
      });
    });
  }

  render() {
    return (
      <span>
        {this.state.points ? formatNumber(this.state.points) + ' points' : '...'}
      </span>
    );
  }
}

document.addEventListener("DOMContentLoaded", function() {
  var elements = document.getElementsByClassName('hacker-news-score');
  Array.prototype.slice.call(elements).forEach((element) => {
    var itemId = element.getAttribute('data-hacker-news-item-id');
    Preact.render(
      <HackerNewsScore item-id={itemId} />,
      element
    );
  })
});
