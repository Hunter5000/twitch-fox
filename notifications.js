/*
  Notify the user using audio and desktop notifications
*/

var lastURL = "";
var lastName = "";

function getFollowedStreams(offset = 0) {
  /*
    Get all of a user's followed streams
  */
  var limit = 100; //Special result limit used for this function only
  var j = 0;
  if (!offset) {
    userFollowedStreams = [];
  }
  var twitchCallback = function(data) {
    if (!data) window.setTimeout(() => getFollowedStreams(), 60000);
    for (var i = 0; i < data.streams.length; i += 1) {
      if (userFollowIDs.indexOf(String(data.streams[i].channel._id)) < 0) {
        //For some reason, we don't have this channel marked as followed
        if (authorizedUser) {
          //Assume that Twitch is right, and update our follows!
          getUserFollows(() => {
            browser.runtime.sendMessage({
              content: "followedStreams"
            });
          });
        } else if (getStorage("nonTwitchFollows")) {
          //I have no clue when this would ever happen
          getFollows();
        }
      }
      if (userFollowedStreams.map(stream => stream._id).indexOf(
          data.streams[i]._id) < 0) {
        userFollowedStreams.push(data.streams[i]);
        var notifiedStreams = getStorage("notifiedStreams");
        if (getStorage("notifiedStreams").indexOf(data.streams[i]._id) < 0) {
          //We have not notified the user about this stream yet
          notifiedStreams.push(data.streams[i]._id);
          setStorage("notifiedStreams", notifiedStreams);
          notify(data.streams[i]);
        }
        j += 1;
      }
    }
    j = j ? j : limit;
    if (data._total > offset) {
      getFollowedStreams(offset + j);
    } else {
      //Done
      updateBadge();
      browser.runtime.sendMessage({
        content: "followed"
      });
    }
  }
  if (authorizedUser) {
    twitchAPI('Get Followed Streams', {
      offset: offset,
      limit: limit
    }, (data) => twitchCallback(data));
  } else if (getStorage("nonTwitchFollows")) {
    twitchAPI('Get Live Streams', {
      channel: getStorage("follows").join(","),
      offset: offset,
      limit: limit
    }, (data) => twitchCallback(data));
  } else {
    //We've got no streams to get
    userFollowedStreams = [];
    browser.runtime.sendMessage({
      content: "followed"
    });
  }
}

function notify(stream) {
  //We assume that the channel is followed and the stream is new
  if (getStorage("favorites").indexOf(String(stream.channel._id)) > -1) {
    //Favorited channel
    if (getStorage("favoritesDesktopNotifications"))
      desktopNotification(stream);
    if (getStorage("favoritesAudioNotifications")) setAlarm(stream);
  } else {
    //Regular followed channel
    if (getStorage("nonfavoritesDesktopNotifications"))
      desktopNotification(stream);
    if (getStorage("nonfavoritesAudioNotifications")) setAlarm(stream);
  }
}

function openTwitchPage(url) {
  browser.tabs.create({
    url: url
  });
}

function openPopout(name) {
  browser.windows.create({
    url: "http://player.twitch.tv/?channel=" + name,
    height: 500,
    width: 850,
    type: "popup"
  });
}

function openChat(name) {
  browser.windows.create({
    url: "http:/twitch.tv/" + name + "/chat?popout",
    height: 600,
    width: 340,
    type: "popup"
  });
}

function desktopNotification(stream) {
  if (lastName) return;
  var title = browser.i18n.getMessage("streaming", [
    stream.channel.display_name, stream.channel.game
  ]);
  var logo = stream.channel.logo != null ? stream.channel.logo : "https://" +
    "static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png";

  browser.notifications.create("follow-notification", {
    "type": "basic",
    "iconUrl": logo,
    "title": title,
    "message": stream.channel.status
  });

  lastURL = stream.channel.url;
  lastName = stream.channel.name;
}

browser.notifications.onClicked.addListener(() => {
  //browser.browserAction.openPopup(); //Will work in Firefox 57
  if (getStorage("openTwitchPage")) openTwitchPage(lastURL);
  if (getStorage("openPopout")) openPopout(lastName);
  if (getStorage("openChat")) openChat(lastName);
  lastName = "";
  lastURL = "";
  endAlarm();
})

browser.notifications.onClosed.addListener((notificationId, byUser) => {
  lastName = "";
  lastURL = "";
  if (byUser) endAlarm();
})

function updateBadge() {
  var text = getStorage("favoritesMode") ? userFollowedStreams.map(stream => (
      getStorage("favorites").indexOf(String(stream.channel._id)) > -1) ? "i" :
    "").join("").length : userFollowedStreams.length;
  var title;
  //If the alarm is going, show the stream that triggered the alarm
  if (alarmTarget) title = browser.i18n.getMessage("justStartedStreaming", [
    alarmTarget.channel.display_name, alarmTarget.channel.game
  ]) + "\n" + browser.i18n.getMessage("clickToEndAlarm")
  else {
    //Otherwise, show all followed stuff
    title = userFollowedStreams.map(stream => getStorage("favorites").indexOf(
      String(stream.channel._id)) > -1 ? browser.i18n.getMessage("streaming", [
      stream.channel.display_name, stream.channel.game
    ]) + "\n" : "").join("");
    if (!getStorage("favoritesMode") || userFollowedStreams.length - text > 0) {
      //If it's favorites mode, only show favorited streams
      if (getStorage("favoritesMode")) title += "\n" + browser.i18n.getMessage(
        "nonFavoritesLive", userFollowedStreams.length - text);
      else title += userFollowedStreams.map(stream => getStorage(
          "favorites").indexOf(String(stream.channel._id)) < 0 ?
        "\n" + browser.i18n.getMessage("streaming", [
          stream.channel.display_name, stream.channel.game
        ]) : "").join("");
    }
  }
  title = title.length ? "Twitch Fox\n\n" + title : "Twitch Fox";
  browser.browserAction.setBadgeText({
    text: text ? String(text) : ""
  });
  browser.browserAction.setTitle({
    title: title
  })
}

function onFollowAlarmTrigger() {
  getFollowedStreams();
}

browser.alarms.onAlarm.addListener(alarmInfo => {
  if (alarmInfo.name == "getFollowedStreams") onFollowAlarmTrigger();
});

function startFollowAlarm() {
  browser.alarms.create("getFollowedStreams", {
    delayInMinutes: 1,
    periodInMinutes: getStorage("minutesBetweenCheck")
  });
  onFollowAlarmTrigger();
}

browser.browserAction.setBadgeBackgroundColor({
  color: "#6641A5"
});
