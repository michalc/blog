function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function toQueryString(obj) {
  var str = [];
  for (var key in obj) {
    str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
  }
  return str.join('&');
}

// https://stackoverflow.com/a/6234804/1319998
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

async function getSEUser(userId) {
  const site = "stackoverflow.com";
  const key = "IuEWeQbgKqLACgi0FNMcOQ((";
  const base = 'https://api.stackexchange.com/2.1/';

  const params = {
    site: site,
    key: key,
    pagesize: 10
  };

  response = await (await fetch(base + 'users/' + userId + '?' + toQueryString(params))).json()
  return response.items[0];
};

function renderReputation(element, reputation) {
  element.innerHTML = `
    <span class="reputation">
      <i class="fa fa-stack-overflow"></i><span class="icon-link-text">${escapeHtml(formatNumber(reputation))}</span>
    </span>
  `
}

document.addEventListener("DOMContentLoaded", async function() {
  const user_id = 1319998;

  const element = document.getElementById('reputation');
  if (!element) return;

  const cachedReputation = localStorage.getItem('user-' + user_id);
  if (cachedReputation) renderReputation(element, cachedReputation);

  var user = await getSEUser(user_id);
  renderReputation(element, user.reputation);
  localStorage.setItem('user-' + user_id, user.reputation);
});

document.addEventListener("DOMContentLoaded", function() {
  const elements = document.getElementsByClassName('hacker-news-score');
  const base = 'https://hn.algolia.com/api/v1/';

  Array.from(elements).forEach(async (element) => {
    element.innerText = '...';
    const itemId = element.getAttribute('data-hacker-news-item-id');
    const response = await (await fetch(base + 'items/' + itemId)).json();
    element.innerText = formatNumber(response.points);
  });
});
