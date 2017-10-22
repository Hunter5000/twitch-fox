/*
  A specific script for non-Twitch followed channels
*/

var followsLoaded = false;

function unfollowAll() {
  setStorage('follows', []);
  getFollows(() => {
    browser.runtime.sendMessage({
      content: "followed"
    });
  });
  updateBadge();
}

function getFollow(_id, callback) {
  /*
    Get a NON-user's followed channel
  */
  twitchAPI('Get Channel by ID', {
    _id: _id
  }, (data) => {
    userFollowIDs.push(data._id);
    userFollows.push(data);
    if (callback) callback()
    else browser.runtime.sendMessage({
      content: "followed"
    });;
  });
}

function getFollows(callback, offset = 0) {
  /*
    Get all of a NON-user's followed channels
    Note: This function is a *large* strain on the Twitch API
  */
  if (!getStorage("nonTwitchFollows")) callback();
  userFollowIDs = [];
  userFollows = [];
  userFollowedStreams = [];
  var follows = getStorage("follows");
  if (!follows.length) callback();
  var responded = 0;
  for (var i = 0; i < follows.length; i++) {
    getFollow(follows[i], () => {
      responded += 1;
      if (responded == follows.length) callback();
    });
  }
}

function initFollows() {
  if (getStorage("nonTwitchFollows")) {
    getFollows(() => {
      browser.runtime.sendMessage({
        content: "followed"
      });
      //Now get the user's followed streams
      startFollowAlarm();
    });
  } else {
    userFollowIDs = [];
    userFollows = [];
    userFollowedStreams = [];
    browser.runtime.sendMessage({
      content: "followed"
    });
  }
}

function importFollows(followsJSON) {
  setStorage("follows", JSON.parse(followsJSON));
  initFollows();
}

/*function importFollowsFromChannel(channel) {
  //Import follows from a channel (ID)
}*/
