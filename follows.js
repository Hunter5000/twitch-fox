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
    if (!data) {
      if (callback) callback();
      return;
    }
    var index = userFollowIDs.indexOf(String(_id));
    if (index > -1) {
      userFollows.splice(index, 1);
      userFollowIDs.splice(index, 1);
    }
    userFollowIDs.push(data._id);
    userFollows.push(data);
    if (callback) callback()
    else browser.runtime.sendMessage({
      content: "followed"
    });
  });
}

function getFollows(offset = 0) {
  /*
    Get all of a NON-user's followed channels
    Note: This function is a *large* strain on the Twitch API
  */
  if (!getStorage("nonTwitchFollows")) return;
  userFollowIDs = [];
  userFollows = [];
  userFollowedStreams = [];
  var follows = getStorage("follows");
  if (!follows.length) return;
  var responded = 0;
  for (var i = 0; i < follows.length; i++) {
    getFollow(follows[i], () => {
      responded += 1;
      if (responded == follows.length) {
        browser.runtime.sendMessage({
          content: "followed"
        });
        startFollowAlarm();
      }
    });
  }
}

function initFollows() {
  if (getStorage("nonTwitchFollows")) getFollows()
  else {
    userFollowIDs = [];
    userFollows = [];
    userFollowedStreams = [];
    browser.runtime.sendMessage({
      content: "followed"
    });
  }
}

function importFollows(followsJSON) {
  var follows = JSON.parse(followsJSON)
  if (!follows.map(follow => isNaN(follow) ? "i" : "").join("")) {
    //Only allow an array of numbers
    setStorage("follows", follows);
    initFollows();
  }
}

function cleanFollows() {
  var follows = getStorage("follows");
  for (var i = 0; i < follows.length; i += 1) {
    var follow = follows[i];
    if (isNan(follow)) {
      follows.splice(i, 1);
      i -= 1;
    }
  }
  //console.log("Follows cleaned");
}

/*function importFollowsFromChannel(channel) {
  //Import follows from a channel (ID)
}*/
