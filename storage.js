/*
  Initialize all storage variables
*/

//Default storage
const defaults = {
  //Non-settings
  token: '',
  mode: 'about',
  favorites: [],
  lastVersion: '',
  notifiedStreams: [],
  favoritesMode: false,

  //Settings
  tooltips: true,
  showNewUser: true,
  showWhatsNew: true,
  openTwitchPage: false,
  openPopout: false,
  openChat: false,
  favoritesDesktopNotificiations: true,
  favoritesAudioNotificiations: true,
  nonfavoritesDesktopNotifications: true,
  nonfavoritesAudioNotificiations: false,
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

function follow(channel, callback) {
  //Only a provisional follow
  if (userFollowIDs.indexOf(String(channel._id)) < 0) {
    userFollowIDs.unshift(String(channel._id));
    userFollows.unshift(channel);
  }
  //Also have to check if there are any new followed streams
  startFollowAlarm();
  updateBadge();
  callback();
}

function unfollow(channel, callback) {
  //Only a provisional unfollow
  var index = userFollowIDs.indexOf(String(channel._id));
  if (index > -1) {
    userFollows.splice(index, 1);
    userFollowIDs.splice(index, 1);
  }
  //Also see if we have to remove a followed stream
  index = userFollowedStreams.map(stream => String(stream.channel._id)).indexOf(
    String(channel._id));
  if (index > -1) userFollowedStreams.splice(index, 1);
  updateBadge();
  callback();
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
      setStorage(prop, val, getAuthorizedUser);
    }
  }
})
