/*
  Initialize all storage variables
*/

//Default storage
const defaults = {
  //Non-settings
  token: '',
  mode: 'about',
  favorites: [],
  follows: [],
  lastVersion: '',
  notifiedStreams: [],
  favoritesMode: false,

  //Settings
  nonTwitchFollows: false,
  tooltips: true,
  showNewUser: true,
  showWhatsNew: true,
  openTwitchPage: false,
  openPopout: false,
  openChat: false,
  favoritesDesktopNotifications: true,
  favoritesAudioNotifications: true,
  nonfavoritesDesktopNotifications: true,
  nonfavoritesAudioNotifications: false,
  alarmInterval: 1,
  limitAlarm: false,
  alarmLength: 10,
  alarmVolume: 20,
  minutesBetweenCheck: 1,
  resultLimit: 12,
  languageCodes: ""
}

var storage = {};

function getStorage(key) {
  return storage[key];
}

function setStorage(key, value, callback) {
  var obj = {};
  obj[key] = value;
  browser.storage.sync.set(obj).then(() => {
    if (key != "mode") {
      updateAlarm();
      browser.runtime.sendMessage({
        content: "initialize"
      });
    }
  });
  storage[key] = value;
  if (callback) callback();
}

function follow(channel) {
  if (getStorage("nonTwitchFollows")) {
    //Add to the followed list
    var follows = getStorage("follows");
    if (follows.indexOf(String(channel._id)) < 0) {
      follows.unshift(String(channel._id));
      setStorage("follows", follows);
      getFollow(String(channel._id));
    }
  } else {
    //Only a provisional follow
    if (userFollowIDs.indexOf(String(channel._id)) < 0) {
      userFollowIDs.unshift(String(channel._id));
      userFollows.unshift(channel);
    }
  }
  //Also have to check if there are any new followed streams
  startFollowAlarm();
  updateBadge();
  browser.runtime.sendMessage({
    content: "followed"
  });
}

function unfollow(channel) {
  if (getStorage("nonTwitchFollows")) {
    //Remove from the followed list
    var follows = getStorage("follows");
    var index = follows.indexOf(String(channel._id));
    if (index > -1) {
      follows.splice(index, 1);
      setStorage("follows", follows);
    }
    //Also have to remove from userFollows(IDs)
    index = userFollowIDs.indexOf(String(channel._id));
    if (index > -1) {
      userFollows.splice(index, 1);
      userFollowIDs.splice(index, 1);
    }
  } else {
    //Only a provisional unfollow
    var index = userFollowIDs.indexOf(String(channel._id));
    if (index > -1) {
      userFollows.splice(index, 1);
      userFollowIDs.splice(index, 1);
    }
  }
  //Also see if we have to remove a followed stream
  index = userFollowedStreams.map(stream => String(stream.channel._id)).indexOf(
    String(channel._id));
  if (index > -1) userFollowedStreams.splice(index, 1);
  updateBadge();
  browser.runtime.sendMessage({
    content: "followed"
  });
}

function favorite(_id, callback) {
  var favorites = getStorage("favorites");
  if (userFollowIDs.indexOf(_id) > -1 && favorites.indexOf(_id) < 0) {
    favorites.unshift(_id);
    setStorage("favorites", favorites);
  }
  updateBadge();
  callback(true);
}

function unfavorite(_id, callback) {
  var favorites = getStorage("favorites");
  var index = favorites.indexOf(_id);
  if (index > -1) {
    favorites.splice(index, 1);
    setStorage("favorites", favorites);
  }
  updateBadge();
  callback(true);
}

function unfavoriteAll() {
  setStorage('favorites', []);
  updateBadge();
  browser.runtime.sendMessage({
    content: "updatePage"
  });
}

/*function cleanFavorites(callback) {
  if (!authorizedUser) callback();
  var favorites = getStorage("favorites");
  for (var i = 0; i < favorites.length; i += 1) {
    if (userFollowIDs.indexOf(favorites[i]) < 0) {
      favorites.splice(i, 1);
      i -= 1;
    }
  }
  setStorage("favorites", favorites);
  updateBadge();
  callback();
}*/

var keys = Object.keys(defaults);

browser.storage.sync.get(null).then((res) => {
  var prop;
  var val;
  for (var i = 0; i < keys.length; i += 1) {
    prop = keys[i];
    if (i + 1 < keys.length) {
      if (res[prop] == null) {
        val = defaults[prop];
        setStorage(prop, val);
      } else {
        storage[prop] = res[prop];
      }
    } else {
      //This is the last setting, so make sure to wake up the other scripts
      val = res[prop] == null ? defaults[prop] : res[prop];
      if (getStorage("token")) {
        setStorage(prop, val, getAuthorizedUser);
      } else if (getStorage("nonTwitchFollows")) {
        setStorage(prop, val, () => initFollows);
      }
    }
  }
})
