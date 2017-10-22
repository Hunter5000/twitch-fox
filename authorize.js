/*
  Declare authorization-related constants
  Check whether the user is authorized on startup or not
  Manage authorization and unauthorization
*/

//TwitchFox registered redirect URI
const redirect_uri = 'https://hunter5000.github.io/twitchfox.html';
//Space-separated permissions that we must obtain from Twitch
const scope = 'user_follows_edit user_read';
//The response type we're looking for from the authorization process
const response_type = 'token';
//The code we will inject into the redirect URI to inform us the token's status
var injection = 'browser.runtime.sendMessage' +
  '({content: window.location.href, type: "OAuth"});';
//Add a listener for new tabs to see if the redirect URI was opened
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && changeInfo.url.indexOf(redirect_uri) != -1) {
    //console.log("Executing script");
    browser.tabs.executeScript(tabId, {
      code: injection
    });
  }
})

//And a listener for receiving a message from the injected code
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "OAuth") {
    browser.tabs.remove(sender.tab.id);
    setStorage('token', parseToken(request.content));
    getAuthorizedUser();
  }
});

function authorize(callback) {
  /*
    Sends the user to the authorization page
  */
  //The URL we must send the user to for authentication
  var url = 'https://api.twitch.tv/kraken/oauth2/authorize?client_id=' +
    client_id + '&redirect_uri=' + redirect_uri + '&response_type=' +
    response_type + '&scope=' + scope;
  browser.tabs.create({
    url: url
  });
}

function deauthorize(callback) {
  /*
    Deletes the token from storage
    So far I can't get real deauthorization working correctly, but this is what
    it would look like:

    var url = 'https://api.twitch.tv/kraken/oauth2/revoke?client_id='+client_id
    +'&token='+token;
    var init = {method: 'POST'};
    fetch(url, init).then((response) => {

    This also isn't working:

    twitchAPI('Revoke Access Token', {
      client_id: client_id,
      token: token
    }, (data) => {
      setStorage('token', '');
      token = ''
      authorizedUser = null;
      callback();
    });
  */
  setStorage('token', '');
  authorizedUser = null;
  userFollowIDs = [];
  userFollows = [];
  userFollowedStreams = [];
  if (getStorage("nonTwitchFollows")) getFollows();
  endAlarm();
  updateBadge();
  callback();
}

function getUserFollows(callback, offset = 0) {
  /*
    Get all of a user's followed channels
  */
  var limit = 100; //Special result limit used for this function only
  if (!offset) {
    userFollowIDs = [];
    userFollows = [];
  }
  twitchAPI('Get User Follows', {
    _id: authorizedUser._id,
    offset: offset,
    limit: limit
  }, (data) => {
    var j = 0;
    for (var i = 0; i < data.follows.length; i += 1) {
      if (userFollowIDs.indexOf(data.follows[i].channel._id) < 0) {
        userFollowIDs.push(data.follows[i].channel._id);
        userFollows.push(data.follows[i]);
        j += 1;
      }
    }
    j = j ? j : limit;
    if (data._total > offset) {
      getUserFollows(callback, offset + j);
    } else {
      //cleanFavorites(callback);
      callback();
    }
  })
}

function getAuthorizedUser() {
  /*
    When called, attempts to use the Twitch API to get the data of the current
    authorized user
  */
  twitchAPI('Get User', {}, (data) => {
    authorizedUser = data;
    browser.runtime.sendMessage({
      content: "initialize"
    });
    //Now get the user's follows
    getUserFollows(() => {
      browser.runtime.sendMessage({
        content: "followed"
      });
      //Now get the user's followed streams
      startFollowAlarm();
    });
  });
}

function parseToken(url) {
  var error = url.match(/[&\?]error=([^&]+)/);
  if (error) {
    //console.log('Error getting access token: ' + error[1]);
    return null;
  } else return url.match(/[&#]access_token=([\w\/\-]+)/)[1];
}
