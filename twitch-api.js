/*
  Provide a method for the Twitch API to be easily accessed
*/

//Related constants
//Preferred version of Twitch API (although currently deprecated)
const accept = 'application/vnd.twitchtv.v5+json';
//Twitch Fox registered client ID
const client_id = 'dzawctbciav48ou6hyv0sxbgflvfdpp';

var authorizedUser; //An object containing the data of the authorized user
var userFollows = []; //Array with followed channel objects of authorized user
var userFollowIDs = []; //Array with IDs of followed channels
var userFollowedStreams = []; //Array with followed stream objects

var results = defaultResults();
var index = 0;

function getResults() {
  return results;
}

function setResults(newResults) {
  results = newResults;
}

function getIndex() {
  return index;
}

function setIndex(newIndex) {
  index = newIndex;
}

function defaultContent() {
  return [];
}

function defaultResults() {
  return [{
    content: defaultContent(),
    type: "",
    endpoint: "",
    opts: {},
    scroll: 0,
    total: 0,
    filter: "",
    cursor: ""
  }];
}

function twitchAPI(endpoint, opts, callback) {
  /*
    "endpoint" expects a string describing the endpoint
    "opts" expects an object that may look like the example below:
    {
      channel: 121059319,
      game: 'Overwatch',
      language: 'en',
      stream_type: 'live',
      limit: '25',
      offset: '0'
    }
    "callback" expects the function to be called after the request is finished
  */
  //console.log(endpoint + JSON.stringify(opts));
  var init = {
    method: 'GET',
    headers: {
      'Accept': accept,
      'Client-ID': client_id,
      'Authorization': 'OAuth ' + getStorage('token')
    }
  };
  var url;
  switch (endpoint) {
    case 'Get User':
      url = 'https://api.twitch.tv/kraken/user?';
      break;
    case 'Get Top Games':
      url = 'https://api.twitch.tv/kraken/games/top?';
      break;
    case 'Get Live Streams':
      url = 'https://api.twitch.tv/kraken/streams/?';;
      break;
    case 'Get Top Videos':
      url = 'https://api.twitch.tv/kraken/videos/top?';
      break;
    case 'Get Top Clips':
      url = 'https://api.twitch.tv/kraken/clips/top?';
      break;
    case 'Get Followed Streams':
      url = 'https://api.twitch.tv/kraken/streams/followed?';
      break;
    case 'Get Followed Videos':
      url = 'https://api.twitch.tv/kraken/videos/followed?';
      break;
    case 'Get Followed Clips':
      url = 'https://api.twitch.tv/kraken/clips/followed?';
      break;
    case 'Get User Follows':
      url = 'https://api.twitch.tv/kraken/users/' + authorizedUser._id +
        '/follows/channels?';
      break;
    case 'Get Channel Videos':
      url = 'https://api.twitch.tv/kraken/channels/' + opts._id + '/videos?';
      delete opts._id;
      break;
    case 'Search Channels':
      url = 'https://api.twitch.tv/kraken/search/channels?';
      break;
    case 'Search Games':
      url = 'https://api.twitch.tv/kraken/search/games?';
      break;
    case 'Search Streams':
      url = 'https://api.twitch.tv/kraken/search/streams?';
      break;
    case 'Follow Channel':
      url = 'https://api.twitch.tv/kraken/users/' + authorizedUser._id +
        '/follows/channels/' + opts._id + '?';
      delete opts._id;
      init.method = "PUT";
      break;
    case 'Unfollow Channel':
      url = 'https://api.twitch.tv/kraken/users/' + authorizedUser._id +
        '/follows/channels/' + opts._id + '?';
      delete opts._id;
      init.method = "DELETE";
      break;
      /*
    case 'Revoke Access Token':
      //This code isn't working
      url = 'https://api.twitch.tv/kraken/oauth2/revoke?';
      init.method = "POST";
      break;
      */
    default:
      break;
  }
  var params =
    Object.entries(opts).map(([key, val]) => `${key}=${val}`).join('&');
  url = url + params;
  fetch(url, init).then((response) => {
    if (response.status == 200) response.json().then((data) => {
      callback(data);
    })
    else if (response.status == 204) callback();
  });
}
