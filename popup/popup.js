/*
  Build the user interface, including streams, games, clips, videos, and their
  followed equivalents.
  Use the Twitch API to perform searches
  Allow the user to authorize and deauthorize their account with Twitch
*/

var bp = browser.extension.getBackgroundPage();
var mode;
var showNewUser;
var showWhatsNew;
var version = browser.runtime.getManifest().version;

var settings = document.getElementById("settings");
var back = document.getElementById("back");
var foward = document.getElementById("forward");
var searchBar = document.getElementById("searchBar");
var search = document.getElementById("search");
var searchBox = document.getElementById("searchBox");
var refresh = document.getElementById("refresh");
var exitSearch = document.getElementById("exitSearch");
var avatar = document.getElementById("avatar");
var login = document.getElementById("login");
var loginText = document.getElementById("loginText");
var contentArea = document.getElementById("contentArea");
var aboutPage = document.getElementById("aboutPage");
var aboutWhatsNewButton = document.getElementById("aboutWhatsNewButton");
var aboutTellMoreButton = document.getElementById("aboutTellMoreButton");
var addonPage = document.getElementById("addonPage");
var githubPage = document.getElementById("githubPage");
var steamPage = document.getElementById("steamPage");
var screenLock = document.getElementById("screenLock");
var enlargedPreview = document.getElementById("enlargedPreview");
var enlargedContent = "";
var newEnlarged;
var oldEnlarged;

function delimitNumber(num = 0) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g,
    browser.i18n.getMessage("delimiter"));
}

function setMode(newMode) {
  /*
    Set the mode in both the script and the storage
  */
  mode = newMode;
  bp.setStorage('mode', newMode);
}

function initialize() {
  /*
    Initalizes the popup interface, essentially ensuring that all non-dynamic
    content (streams, games, etc.) is properly diplayed.
    Includes internationalization, proper tooltips, etc.
  */

  //console.log("initalize()");

  //Get the storage data for a few popup-specific things

  if (bp.getStorage('lastVersion') != version) {
    bp.setStorage('lastVersion', version);
    setMode("about");
    bp.setStorage('showWhatsNew', true);
  }

  //End alarm if it's on
  bp.endAlarm();

  mode = bp.getStorage('mode');
  showNewUser = bp.getStorage('showNewUser');
  showWhatsNew = bp.getStorage('showWhatsNew');

  //Login/logout
  if (bp.authorizedUser) {
    loginText.textContent = browser.i18n.getMessage("logout");
    avatar.classList.remove("noAccess");
    avatar.style.backgroundImage = 'url("' + bp.authorizedUser.logo + '")';
  } else {
    loginText.textContent = browser.i18n.getMessage("login");
    avatar.classList.add("noAccess");
    avatar.style.backgroundImage = '';
  }

  if (!bp.getStorage("tooltips")) {
    document.getElementById("styleLink").href = "noTooltips.css";
  }

  //Tooltips
  var tooltips = document.getElementsByClassName("tooltip");
  for (var i = 0; i < tooltips.length; i += 1) {
    var tooltip = tooltips[i];
    if (!tooltip.id) continue;
    if (tooltip.id.substring(0, 8) == "followed") {
      if (bp.authorizedUser || (bp.getStorage("nonTwitchFollows") && (
          tooltip.id == "followedStreamsTip" || tooltip.id ==
          "followedChannelsTip"))) {
        tooltip.textContent = browser.i18n.getMessage(tooltip.id);
        tooltip.parentElement.classList.remove("noAccess");
      } else {
        tooltip.textContent = browser.i18n.getMessage("noAccessTip");
        tooltip.parentElement.classList.add("noAccess");
      }
    } else if (tooltip.id == "loginTip") {
      if (bp.authorizedUser) {
        tooltip.textContent = browser.i18n.getMessage("logoutTip");
      } else {
        tooltip.textContent = browser.i18n.getMessage(tooltip.id);
      }
    } else if (tooltip.id == "avatarTip") {
      if (bp.authorizedUser) tooltip.textContent = browser.i18n.getMessage(
        tooltip.id, bp.authorizedUser.display_name);
    } else {
      tooltip.textContent = browser.i18n.getMessage(tooltip.id);
    }
  }

  //About tab
  var versionSpan = document.getElementById("version");
  versionSpan.textContent = browser.i18n.getMessage(versionSpan.id, version);
  var aboutTextNewUser = document.getElementById("aboutTextNewUser");
  var aboutTextWhatsNew = document.getElementById("aboutTextWhatsNew");
  var aboutTextAbout = document.getElementById("aboutTextAbout");

  if (showNewUser) {
    aboutTextNewUser.classList.remove("hide");
    aboutTextWhatsNew.classList.add("hide");
    aboutTextAbout.classList.add("hide");
  } else if (showWhatsNew) {
    aboutTextNewUser.classList.add("hide");
    aboutTextWhatsNew.classList.remove("hide");
    aboutTextAbout.classList.add("hide");
  } else {
    aboutTextNewUser.classList.add("hide");
    aboutTextWhatsNew.classList.add("hide");
    aboutTextAbout.classList.remove("hide");
  }

  var aboutTexts = document.getElementsByClassName("aboutText");
  for (var i = 0; i < aboutTexts.length; i += 1) {
    var aboutText = aboutTexts[i];
    aboutText.textContent = browser.i18n.getMessage(aboutText.id, version);
    /*aboutText.textContent = aboutText.classList.contains("version") ?
    aboutText.textContent = browser.i18n.getMessage(aboutText.id, version) :
    browser.i18n.getMessage(aboutText.id);*/
  }

  var aboutButtons = document.getElementsByClassName("aboutButton");
  for (var i = 0; i < aboutButtons.length; i += 1) {
    var aboutButton = aboutButtons[i];
    if (aboutButton.id == "aboutWhatsNewButton" && !showWhatsNew) {
      //Special case where we jump straight from new user screen to general
      //about screen
      aboutButton.textContent = browser.i18n.getMessage("aboutTellMoreButton");
    } else {
      aboutButton.textContent = browser.i18n.getMessage(aboutButton.id,
        version);
    }
  }

  //var email = document.getElementById("email");
  var discord = document.getElementById("discord");
  //email.textContent = browser.i18n.getMessage(email.id, "email@site.com");
  discord.textContent = browser.i18n.getMessage(discord.id, "Hunter#3581")

  //Select current tab
  if (document.getElementById(mode).classList.contains("noAccess")) {
    //You don't want people to remain on a tab after it becomes unusable
    document.getElementById(mode).classList.remove("selected");
    bp.setResults(bp.defaultResults());
    setMode("games");
  }
  document.getElementById(mode).classList.add("selected");

  //Show about page if it is the tab, hide otherwise
  updateTab();
}

function addTooltip(parent, noDisable) {
  var tooltip = document.createElement("span");
  tooltip.classList.add("tooltip");
  if (noDisable) tooltip.classList.add("noDisable");
  parent.appendChild(tooltip);
  return tooltip;
}

function addCard(content, type) {
  switch (type) {
    case "game":
      var game = content.game ? content.game : content;
      var id = "GAME!" + game._id;
      if (document.getElementById(id)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "game");
      contentDiv.id = id;

      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "game");
      contentBack.style.backgroundImage = 'url("' + game.box.medium + '")'
      contentDiv.appendChild(contentBack);

      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "game");
      contentBack.appendChild(hoverBack);

      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);

      var clickBack = document.createElement("div");
      clickBack.classList.add("clickBack", "game")

      addTooltip(clickBack).textContent = browser.i18n.getMessage(
        "gameStreamsTip", game.name);

      hideUntilHover.appendChild(clickBack);

      contentBack.addEventListener("click", (e) => {
        if (e.target.classList.contains("clickBack") ||
          e.target.parentElement.classList.contains("clickBack")) {
          //Get Live Streams
          getApiResults("Get Live Streams", {
            game: game.name
          }, true);
        }
      })

      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "game", "twitch");
      twitchButton.addEventListener("click", () => {
        var url = "https://www.twitch.tv/directory/game/" + game.name;
        browser.tabs.create({
          url: url
        });
      });
      addTooltip(twitchButton).textContent = browser.i18n.getMessage(
        "openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);

      /*var streamsButton = document.createElement("div");
      streamsButton.classList.add(
        "contentButton", "side", "game", "smallStreams");
      streamsButton.addEventListener("click", () => {
        //Get Live Streams
        getApiResults("Get Live Streams", {
          game: game.name
        }, true);
      })
      addTooltip(streamsButton).textContent = browser.i18n.getMessage(
        "gameStreamsTip", game.name);
      hideUntilHover.appendChild(streamsButton);*/

      var videosButton = document.createElement("div");
      videosButton.classList.add(
        "contentButton", "side", "game", "smallVideos");
      videosButton.addEventListener("click", () => {
        //Get Top Videos
        getApiResults("Get Top Videos", {
          game: game.name
        }, true);
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage(
        "gameVideosTip", game.name);
      hideUntilHover.appendChild(videosButton);

      var clipsButton = document.createElement("div");
      clipsButton.classList.add("contentButton", "side", "game", "smallClips");
      clipsButton.addEventListener("click", () => {
        //Get Top Clips
        getApiResults("Get Top Clips", {
          game: game.name
        }, true);
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage(
        "gameClipsTip", game.name);
      hideUntilHover.appendChild(clipsButton);

      var gameTitle = document.createElement("span");
      gameTitle.classList.add("gameTitle");
      contentDiv.appendChild(gameTitle);

      var bottomTextTop = document.createElement("div");
      bottomTextTop.classList.add("bottomText", "gameTop");
      bottomTextTop.textContent = game.name;
      gameTitle.appendChild(bottomTextTop);
      addTooltip(gameTitle, true).textContent = game.name;

      if (content.viewers) {
        var bottomTextBottom = document.createElement("div");
        bottomTextBottom.classList.add("bottomText", "gameBottom");
        bottomTextBottom.textContent = browser.i18n.getMessage("viewersOnGame",
          delimitNumber(content.viewers));
        contentDiv.appendChild(bottomTextBottom);
      }

      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = game.name;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);

      break;
    case "stream":
      var id = "STREAM!" + content._id;
      if (document.getElementById(id) || (mode == "followedStreams" &&
          bp.getStorage("favoritesMode") && bp.getStorage("favorites").indexOf(
            String(content.channel._id)) < 0)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "stream");
      contentDiv.id = id;

      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "stream");
      contentBack.style.backgroundImage =
        'url("' + content.preview.large + '")';
      contentDiv.appendChild(contentBack);

      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "stream");
      contentBack.appendChild(hoverBack);

      var status = document.createElement("div");
      status.classList.add("status", "stream");
      status.textContent = content.channel.status;
      contentBack.appendChild(status);

      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);

      if (bp.getStorage("openTwitchPage") || bp.getStorage("openPopout") ||
        bp.getStorage("openChat")) {
        var clickBack = document.createElement("div");
        clickBack.classList.add("clickBack", "stream")

        addTooltip(clickBack).textContent = browser.i18n.getMessage(
          "performActions");

        hideUntilHover.appendChild(clickBack);

        contentBack.addEventListener("click", (e) => {
          if (e.target.classList.contains("clickBack")) {
            //Do the stuff
            if (bp.getStorage("openTwitchPage"))
              bp.openTwitchPage(content.channel.url);
            if (bp.getStorage("openPopout"))
              bp.openPopout(content.channel.name);
            if (bp.getStorage("openChat")) bp.openChat(content.channel.name);
          }
        });
      }

      var created_at = new Date(content.created_at);

      var uptime_ms = Date.now() - created_at;
      var uptime_hr = Math.floor(uptime_ms / 3600000);
      var uptime_min = Math.floor((uptime_ms - (uptime_hr * 3600000)) / 60000);
      var uptime_s = Math.floor((uptime_ms - (uptime_hr * 3600000) -
        (uptime_min * 60000)) / 1000);
      uptime_min = uptime_min < 10 && uptime_hr > 0 ?
        "0" + uptime_min : uptime_min;
      uptime_hr = uptime_hr > 0 ? uptime_hr + ":" : uptime_hr;
      uptime_s = uptime_s < 10 ? ":0" + uptime_s : ":" + uptime_s;

      var uptime = document.createElement("div");
      uptime.classList.add("uptime");
      uptime.textContent = uptime_hr + uptime_min + uptime_s;

      var hours = created_at.getHours();
      var ampm = "AM";
      if (hours > 12) {
        hours -= 12;
        ampm = "PM";
      }
      var minutes = created_at.getMinutes();
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var seconds = created_at.getSeconds();
      seconds = seconds < 10 ? "0" + seconds : seconds;

      var uptimeIcon = document.createElement("div");
      uptimeIcon.classList.add("uptimeIcon");
      addTooltip(uptimeIcon, true).textContent = browser.i18n.getMessage(
        "streamUptimeTip", [created_at.getMonth() + 1, created_at.getDate(),
          created_at.getFullYear(), hours, minutes, seconds, ampm
        ]);

      uptime.appendChild(uptimeIcon);
      contentBack.appendChild(uptime);

      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "stream", "twitch");
      twitchButton.addEventListener("click", () => {
        var url = content.channel.url;
        browser.tabs.create({
          url: url
        });
      });
      addTooltip(twitchButton).textContent = browser.i18n.getMessage(
        "openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);

      var popoutButton = document.createElement("div");
      popoutButton.classList.add("contentButton", "bottom", "stream", "popout");
      popoutButton.addEventListener("click", () => {
        browser.windows.create({
          url: "http://player.twitch.tv/?channel=" + content.channel.name,
          height: 500,
          width: 850,
          type: "popup"
        });
      })

      addTooltip(popoutButton).textContent = browser.i18n.getMessage(
        "openPopooutTip");
      hideUntilHover.appendChild(popoutButton);

      var chatButton = document.createElement("div");
      chatButton.classList.add("contentButton", "bottom", "stream", "chat");
      chatButton.addEventListener("click", () => {
        browser.windows.create({
          url: "http:/twitch.tv/" + content.channel.name + "/chat?popout",
          height: 600,
          width: 340,
          type: "popup"
        });
      })
      addTooltip(chatButton).textContent = browser.i18n.getMessage(
        "openChatTip", content.channel.display_name);
      hideUntilHover.appendChild(chatButton);

      var enlargeButton = document.createElement("div");
      enlargeButton.classList.add(
        "contentButton", "bottom", "stream", "enlarge");
      enlargeButton.addEventListener("click", () => {
        if (oldEnlarged && oldEnlarged.id != enlargedPreview.id) {
          screenLock.removeChild(oldEnlarged);
        }
        var rect = contentBack.getBoundingClientRect();
        newEnlarged = enlargedPreview.cloneNode();
        newEnlarged.id = "newEnlarged";
        contentDiv.classList.add("hidden");
        enlargedContent = contentDiv.id;
        enlargedPreview.style.backgroundImage =
          'url("' + content.preview.large + '")';
        enlargedPreview.style.left = rect.left + "px";
        enlargedPreview.style.top = rect.top + "px";
        enlargedPreview.style.transform =
          "translate(" + (-rect.left) + "px," + (131 - rect.top) + "px)";
        enlargedPreview.classList.add("enlarged");
        screenLock.classList.remove("hidden");
      })
      addTooltip(enlargeButton).textContent =
        browser.i18n.getMessage("enlargeTip");
      hideUntilHover.appendChild(enlargeButton);

      var followed = bp.userFollowIDs.indexOf(String(content.channel._id)) > -1;

      var favoriteButton = document.createElement("div");
      var favorited = bp.getStorage("favorites").indexOf(String(
        content.channel._id)) > -1;
      favoriteButton.classList.add(
        "contentButton", "bottom", "stream", favorited ? "unfavorite" :
        "favorite");
      if (!followed) favoriteButton.classList.add("noAccess")
      else
        favoriteButton.addEventListener("click", () => {
          if (favorited) bp.unfavorite(String(content.channel._id), updatePage)
          else bp.favorite(String(content.channel._id), updatePage);
        });
      addTooltip(favoriteButton).textContent = browser.i18n.getMessage(
        followed ? (favorited ? "unfavoriteTip" : "favoriteTip") :
        "cantFavoriteTip", content.channel.display_name);
      hideUntilHover.appendChild(favoriteButton);

      var followButton = document.createElement("div");
      followButton.classList.add("contentButton", "bottom", "stream",
        followed ? "unfollow" : "follow");
      if (!bp.authorizedUser && !bp.getStorage("nonTwitchFollows"))
        followButton.classList.add("noAccess")
      else
        followButton.addEventListener("click", () => {
          if (followed) followApi("Unfollow Channel", content.channel)
          else followApi("Follow Channel", content.channel);
        })
      addTooltip(followButton).textContent = browser.i18n.getMessage(
        followButton.classList.contains("noAccess") ? "noAccessTip" :
        (followed ? "unfollowTip" : "followTip"), content.channel.display_name);

      hideUntilHover.appendChild(followButton);

      var videosButton = document.createElement("div");
      videosButton.classList.add(
        "contentButton", "side", "stream", "smallVideos");
      videosButton.addEventListener("click", () => {
        //Get Channel Videos
        getApiResults("Get Channel Videos", {
          _id: content.channel._id
        }, true);
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage(
        "channelVideosTip", content.channel.display_name);
      hideUntilHover.appendChild(videosButton);

      var clipsButton = document.createElement("div");
      clipsButton.classList.add(
        "contentButton", "side", "stream", "smallClips");
      clipsButton.addEventListener("click", () => {
        //Get Top Clips in channel
        getApiResults("Get Top Clips", {
          channel: content.channel.name
        }, true);
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage(
        "channelClipsTip", content.channel.display_name);
      hideUntilHover.appendChild(clipsButton);

      if (content.game) {
        var cornerGame = document.createElement("div");
        cornerGame.classList.add("cornerGame");
        cornerGame.style.backgroundImage =
          'url("https://static-cdn.jtvnw.net/ttv-boxart/' + content.game +
          '-52x72.jpg")';

        addTooltip(cornerGame, true).textContent = bp.getStorage("tooltips") ?
          browser.i18n.getMessage("gameStreamsTip", content.game) :
          content.game;
        cornerGame.addEventListener("click", () => {
          //Get Live Streams
          getApiResults("Get Live Streams", {
            game: content.game
          }, true);
        });

        contentDiv.appendChild(cornerGame);
      }

      var displayName = document.createElement("span");
      displayName.classList.add("displayName");
      contentDiv.appendChild(displayName);

      var bottomText = document.createElement("div");
      bottomText.classList.add("bottomText", "stream");
      bottomText.textContent = browser.i18n.getMessage(
        "viewersOn", [delimitNumber(content.viewers),
          content.channel.display_name
        ]);
      displayName.appendChild(bottomText);

      var name = content.channel.name ==
        content.channel.display_name.toLowerCase() ? "" :
        " (" + content.channel.name + ")";
      addTooltip(displayName, true).textContent = content.channel.display_name +
        name;

      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = content.game + content.channel.display_name +
        content.channel.name + content.channel.status;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);

      break;
    case "video":
    case "clip":
      var id = type == "video" ? content._id : content.tracking_id;
      id = type == "video" ? "VIDEO!" + id : "CLIP!" + id;
      if (document.getElementById(id)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "stream");
      contentDiv.id = id;

      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "stream");
      var backImage = type == "video" ? content.preview.large :
        content.thumbnails.medium;
      contentBack.style.backgroundImage =
        'url("' + backImage + '")';
      contentDiv.appendChild(contentBack);

      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "stream");
      contentBack.appendChild(hoverBack);

      var title = document.createElement("div");
      title.classList.add("status", "stream");
      title.textContent = content.title;
      contentBack.appendChild(title);

      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);

      var seconds = type == "video" ? content.length : content.duration;
      var hours = Math.floor(seconds / 3600);
      var minutes = Math.floor(seconds % 3600 / 60);
      seconds = Math.floor(seconds % 3600 % 60);

      minutes = minutes < 10 && hours > 0 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      hours = hours < 1 ? "" : hours + ":";

      var uptime = document.createElement("div");
      uptime.classList.add("uptime");
      uptime.textContent = hours + minutes + ":" + seconds;

      var created_at = new Date(content.created_at);

      hours = created_at.getHours();
      var ampm = "AM";
      if (hours > 12) {
        hours -= 12;
        ampm = "PM";
      }
      minutes = created_at.getMinutes();
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = created_at.getSeconds();
      seconds = seconds < 10 ? "0" + seconds : seconds;

      var uptimeIcon = document.createElement("div");
      uptimeIcon.classList.add("uptimeIcon");
      addTooltip(uptimeIcon, true).textContent = browser.i18n.getMessage(
        "durationTip", [created_at.getMonth() + 1, created_at.getDate(),
          created_at.getFullYear(), hours, minutes, seconds, ampm
        ]);
      uptime.appendChild(uptimeIcon);

      contentBack.appendChild(uptime);

      var chatButton = document.createElement("div");
      chatButton.classList.add("contentButton", "bottom", "stream", "chat", "hidden");
      hideUntilHover.appendChild(chatButton);

      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "stream", "twitch");
      twitchButton.addEventListener("click", () => {
        var url = content.url;
        browser.tabs.create({
          url: url
        });
      });
      addTooltip(twitchButton).textContent = browser.i18n.getMessage(
        "openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);

      var popoutButton = document.createElement("div");
      popoutButton.classList.add("contentButton", "bottom", "stream", "popout");
      popoutButton.addEventListener("click", () => {
        browser.windows.create({
          url: type == "video" ? "http://player.twitch.tv/?video=" + content._id : content.embed_url,
          height: 500,
          width: 850,
          type: "popup"
        });
      })

      addTooltip(popoutButton).textContent = browser.i18n.getMessage(
        "openPopooutTip");
      hideUntilHover.appendChild(popoutButton);

      var enlargeButton = document.createElement("div");
      enlargeButton.classList.add(
        "contentButton", "bottom", "stream", "enlarge");
      enlargeButton.addEventListener("click", () => {
        if (oldEnlarged && oldEnlarged.id != enlargedPreview.id) {
          screenLock.removeChild(oldEnlarged);
        }
        var rect = contentBack.getBoundingClientRect();
        newEnlarged = enlargedPreview.cloneNode();
        newEnlarged.id = "newEnlarged";
        contentDiv.classList.add("hidden");
        enlargedContent = contentDiv.id;
        enlargedPreview.style.backgroundImage =
          'url("' + backImage + '")';
        enlargedPreview.style.left = rect.left + "px";
        enlargedPreview.style.top = rect.top + "px";
        enlargedPreview.style.transform =
          "translate(" + (-rect.left) + "px," + (131 - rect.top) + "px)";
        enlargedPreview.classList.add("enlarged");
        screenLock.classList.remove("hidden");
      })
      addTooltip(enlargeButton).textContent =
        browser.i18n.getMessage("enlargeTip");
      hideUntilHover.appendChild(enlargeButton);

      var thisChannel = type == "video" ? content.channel : content.broadcaster;

      var followed = bp.userFollowIDs.indexOf(String(thisChannel._id)) > -1;

      var favoriteButton = document.createElement("div");
      var favorited = bp.getStorage("favorites").indexOf(String(
        thisChannel._id)) > -1;
      favoriteButton.classList.add(
        "contentButton", "bottom", "stream", favorited ? "unfavorite" :
        "favorite");
      if (!followed) favoriteButton.classList.add("noAccess")
      else
        favoriteButton.addEventListener("click", () => {
          if (favorited) bp.unfavorite(String(thisChannel._id), updatePage)
          else bp.favorite(String(thisChannel._id), updatePage);
        })
      addTooltip(favoriteButton).textContent = browser.i18n.getMessage(
        followed ? (favorited ? "unfavoriteTip" : "favoriteTip") :
        "cantFavoriteTip", thisChannel.display_name);
      hideUntilHover.appendChild(favoriteButton);

      var followButton = document.createElement("div");
      followButton.classList.add("contentButton", "bottom", "stream",
        followed ? "unfollow" : "follow");
      if (!bp.authorizedUser && !bp.getStorage("nonTwitchFollows"))
        followButton.classList.add("noAccess")
      else
        followButton.addEventListener("click", () => {
          if (followed) followApi("Unfollow Channel", thisChannel)
          else followApi("Follow Channel", thisChannel);
        })
      addTooltip(followButton).textContent = browser.i18n.getMessage(
        followButton.classList.contains("noAccess") ? "noAccessTip" :
        (followed ? "unfollowTip" : "followTip"), thisChannel.display_name);
      hideUntilHover.appendChild(followButton);

      var videosButton = document.createElement("div");
      videosButton.classList.add(
        "contentButton", "side", "stream", "smallVideos");
      videosButton.addEventListener("click", () => {
        //Get Channel Videos
        getApiResults("Get Channel Videos", {
          _id: type == "video" ? thisChannel._id : thisChannel.id
        }, true);
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage(
        "channelVideosTip", thisChannel.display_name);
      hideUntilHover.appendChild(videosButton);

      var clipsButton = document.createElement("div");
      clipsButton.classList.add(
        "contentButton", "side", "stream", "smallClips");
      clipsButton.addEventListener("click", () => {
        //Get Top Clips in channel
        getApiResults("Get Top Clips", {
          channel: thisChannel.name
        }, true);
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage(
        "channelClipsTip", thisChannel.display_name);
      hideUntilHover.appendChild(clipsButton);

      if (content.game) {
        var cornerGame = document.createElement("div");
        cornerGame.classList.add("cornerGame");
        cornerGame.style.backgroundImage =
          'url("https://static-cdn.jtvnw.net/ttv-boxart/' + content.game +
          '-52x72.jpg")';
        addTooltip(cornerGame, true).textContent = bp.getStorage("tooltips") ?
          browser.i18n.getMessage("gameStreamsTip", content.game) :
          content.game;
        cornerGame.addEventListener("click", () => {
          //Get Live Streams
          getApiResults("Get Live Streams", {
            game: content.game
          }, true);
        });
        contentDiv.appendChild(cornerGame);
      }

      var displayName = document.createElement("span");
      displayName.classList.add("displayName");
      contentDiv.appendChild(displayName);

      var bottomText = document.createElement("div");
      bottomText.classList.add("bottomText", "stream");
      bottomText.textContent = browser.i18n.getMessage(
        "viewsOn", [delimitNumber(content.views),
          thisChannel.display_name
        ]);
      displayName.appendChild(bottomText);
      var name = thisChannel.name == thisChannel.display_name.toLowerCase() ?
        "" : " (" + thisChannel.name + ")";
      addTooltip(displayName, true).textContent = thisChannel.display_name +
        name;

      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = content.game + thisChannel.display_name +
        thisChannel.name + content.title;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);
      break;
    case "channel":
      var channel = content.channel ? content.channel : content;
      var id = "CHANNEL!" + channel._id;
      if (document.getElementById(id) || (mode == "followedChannels" &&
          bp.getStorage("favoritesMode") && bp.getStorage("favorites").indexOf(
            String(channel._id)) < 0)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "channel");
      contentDiv.id = id;

      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "channel");
      var logo = channel.logo != null ? channel.logo : "https://" +
        "static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png";
      contentBack.style.backgroundImage =
        'url("' + logo + '")';
      contentDiv.appendChild(contentBack);

      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "channel");
      contentBack.appendChild(hoverBack);

      var topName = document.createElement("div");
      topName.classList.add("topName");
      topName.textContent = channel.display_name;
      contentBack.appendChild(topName);

      var name = channel.name == channel.display_name.toLowerCase() ? "" :
        " (" + channel.name + ")";
      addTooltip(topName, true).textContent = channel.display_name + name;

      var status = document.createElement("div");
      status.classList.add("status", "channel");
      status.textContent = channel.description;
      contentBack.appendChild(status);

      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);

      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "channel",
        "twitch");
      twitchButton.addEventListener("click", () => {
        var url = channel.url;
        browser.tabs.create({
          url: url
        });
      });
      addTooltip(twitchButton).textContent = browser.i18n.getMessage(
        "openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);

      var chatButton = document.createElement("div");
      chatButton.classList.add("contentButton", "bottom", "channel", "chat");
      chatButton.addEventListener("click", () => {
        browser.windows.create({
          url: "http:/twitch.tv/" + channel.name + "/chat?popout",
          height: 600,
          width: 340,
          type: "popup"
        });
      })
      addTooltip(chatButton).textContent = browser.i18n.getMessage(
        "openChatTip", channel.display_name);
      hideUntilHover.appendChild(chatButton);

      var followed = bp.userFollowIDs.indexOf(String(channel._id)) > -1;

      var favoriteButton = document.createElement("div");
      var favorited = bp.getStorage("favorites").indexOf(String(channel._id)) >
        -1;
      favoriteButton.classList.add(
        "contentButton", "bottom", "channel", favorited ? "unfavorite" :
        "favorite");
      if (!followed) favoriteButton.classList.add("noAccess")
      else
        favoriteButton.addEventListener("click", () => {
          if (favorited) bp.unfavorite(String(channel._id), updatePage)
          else bp.favorite(String(channel._id), updatePage);
        })
      addTooltip(favoriteButton).textContent = browser.i18n.getMessage(
        followed ? (favorited ? "unfavoriteTip" : "favoriteTip") :
        "cantFavoriteTip", channel.display_name);
      hideUntilHover.appendChild(favoriteButton);

      var followButton = document.createElement("div");
      followButton.classList.add("contentButton", "bottom", "channel",
        followed ? "unfollow" : "follow");
      if (!bp.authorizedUser && !bp.getStorage("nonTwitchFollows"))
        followButton.classList.add("noAccess")
      else
        followButton.addEventListener("click", () => {
          if (followed) followApi("Unfollow Channel", channel)
          else followApi("Follow Channel", channel);
        })
      addTooltip(followButton).textContent = browser.i18n.getMessage(
        followButton.classList.contains("noAccess") ? "noAccessTip" :
        (followed ? "unfollowTip" : "followTip"), channel.display_name);
      hideUntilHover.appendChild(followButton);

      var videosButton = document.createElement("div");
      videosButton.classList.add(
        "contentButton", "side", "channel", "smallVideos");
      videosButton.addEventListener("click", () => {
        //Get Channel Videos
        getApiResults("Get Channel Videos", {
          _id: channel._id
        }, true);
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage(
        "channelVideosTip", channel.display_name);
      hideUntilHover.appendChild(videosButton);

      var clipsButton = document.createElement("div");
      clipsButton.classList.add(
        "contentButton", "side", "channel", "smallClips");
      clipsButton.addEventListener("click", () => {
        //Get Top Clips in channel
        getApiResults("Get Top Clips", {
          channel: channel.name
        }, true);
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage(
        "channelClipsTip", channel.display_name);
      hideUntilHover.appendChild(clipsButton);

      if (channel.game) {
        var cornerGame = document.createElement("div");
        cornerGame.classList.add("cornerGame", "channel");
        cornerGame.style.backgroundImage =
          'url("https://static-cdn.jtvnw.net/ttv-boxart/' + channel.game +
          '-52x72.jpg")';
        addTooltip(cornerGame, true).textContent = bp.getStorage("tooltips") ?
          browser.i18n.getMessage("gameStreamsTip", channel.game) :
          channel.game;
        cornerGame.addEventListener("click", () => {
          //Get Live Streams
          getApiResults("Get Live Streams", {
            game: channel.game
          }, true);
        });
        contentDiv.appendChild(cornerGame);
      }

      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = channel.game + channel.display_name +
        channel.name + channel.status;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);
    default:
      break;
  }
}

function updateTab(newMode) {
  /*
    Update the current selected tab and the mode
  */

  //console.log("updateTab");

  var results = bp.getResults();
  var index = bp.getIndex();

  if (newMode) {
    document.getElementById(mode).classList.remove("selected");
    setMode(newMode);
  }
  document.getElementById(mode).classList.add("selected");
  while (contentArea.hasChildNodes()) {
    contentArea.removeChild(contentArea.firstChild);
  }
  if (mode == "about") {
    //Show the about page
    contentArea.classList.add("hide");
    searchBar.classList.add("hide");
    aboutPage.classList.remove("hide");
  } else {
    //Show the content area
    aboutPage.classList.add("hide");
    contentArea.classList.remove("hide");
    searchBar.classList.remove("hide");

    if (index == 0) {
      //Tell the Twitch API to find us the information we want
      switch (mode) {
        case "games":
          if (results[index].content.length < 1) getApiResults("Get Top Games")
          else updatePage();
          break;
        case "streams":
          if (results[index].content.length < 1)
            getApiResults("Get Live Streams")
          else updatePage();
          break;
        case "videos":
          if (results[index].content.length < 1)
            getApiResults("Get Top Videos");
          break;
        case "clips":
          if (results[index].content.length < 1) getApiResults("Get Top Clips")
          else updatePage();
          break;
        case "channels":
          updatePage();
          break;
        case "followedStreams":
          var results = bp.getResults();
          var index = bp.getIndex();
          index = 0;
          results = bp.defaultResults()
          results[index].content = bp.userFollowedStreams;
          results[index].type = "stream";
          bp.setResults(results);
          updatePage();
          break;
        case "followedVideos":
          if (results[index].content.length < 1)
            getApiResults("Get Followed Videos")
          else updatePage();
          break;
        case "followedClips":
          if (results[index].content.length < 1)
            getApiResults("Get Followed Clips")
          else updatePage();
          break;
        case "followedChannels":
          var results = bp.getResults();
          var index = bp.getIndex();
          index = 0;
          results = bp.defaultResults()
          results[index].content = bp.userFollows;
          results[index].type = "channel";
          bp.setResults(results);
          updatePage();
          break;
        default:
          break;
      }
    } else {
      updatePage();
    }
  }
}

function getApiResults(endpoint, opts = {}, newIndex, reset) {
  var results = bp.getResults();
  var offset = contentArea.children.length;
  var index = bp.getIndex();

  results[index].filter = searchBox.value;
  results[index].scroll = reset ? 0 : contentArea.scrollTop;

  if (newIndex) {
    index += 1;
    bp.setIndex(index);
    //Remove elements after the new one
    results.splice(index, results.length - index, bp.defaultResults()[0]);
    offset = 0;
  }

  if (reset) {
    offset = 0;
    results[index].content = bp.defaultContent();
    delete opts.limit;
    delete opts.language;
    delete opts.cursor;
  }

  if (!opts.hasOwnProperty('limit')) {
    opts.limit = bp.getStorage("resultLimit");
  }

  if (bp.getStorage("languageCodes")) {
    opts.language = bp.getStorage("languageCodes");
  }

  if (endpoint != "Get Top Clips" && endpoint != "Get Followed Clips") {
    opts.offset = offset;
  } else {
    opts.cursor = results[index].cursor;
  }

  refresh.classList.add("thinking");
  searchBox.placeholder = browser.i18n.getMessage("loading");
  bp.twitchAPI(endpoint, opts, (data) => {
    if (data) {
      switch (endpoint) {
        case "Get Top Games":
          Array.prototype.push.apply(results[index].content, data.top);
          results[index].type = "game";
          break;
        case "Get Live Streams":
        case "Search Streams":
          Array.prototype.push.apply(results[index].content, data.streams);
          results[index].type = "stream";
          break;
        case "Search Games":
          Array.prototype.push.apply(results[index].content, data.games);
          results[index].type = "game";
          break;
        case "Get Top Videos":
          Array.prototype.push.apply(results[index].content, data.vods);
          results[index].type = "video";
          break;
        case 'Get Followed Videos':
        case "Get Channel Videos":
          Array.prototype.push.apply(results[index].content, data.videos);
          results[index].type = "video";
          break;
        case "Get Followed Clips":
        case "Get Top Clips":
          Array.prototype.push.apply(results[index].content, data.clips);
          results[index].type = "clip";
          break;
        case "Search Channels":
          Array.prototype.push.apply(results[index].content, data.channels);
          results[index].type = "channel";
          break;
        default:
          break;
      }
      results[index].total = data._total;
      results[index].endpoint = endpoint;
      results[index].opts = JSON.stringify(opts);
      results[index].cursor = data._cursor;
      bp.setResults(results);
    }
    refresh.classList.remove("thinking");
    searchBox.value = "";
    updatePage();
  });
}

function followApi(endpoint, channel) {
  if (bp.authorizedUser) {
    refresh.classList.add("thinking");
    bp.twitchAPI(endpoint, {
      _id: String(channel._id)
    }, () => {
      //Temporarily follow/unfollow
      refresh.classList.remove("thinking");
      switch (endpoint) {
        case "Follow Channel":
          bp.follow(channel);
          break;
        case "Unfollow Channel":
          bp.unfollow(channel);
          break;
      }
      //Now actually update our follows for real
      //Just kidding this seems very overly API intensive
      /*bp.getUserFollows(() => {
        refresh.classList.remove("thinking");
        if (mode == "followedChannels") {
          initialize();
        } else {
          updatePage();
        }
        bp.startFollowAlarm();
      });*/
    });
  } else if (bp.getStorage("nonTwitchFollows")) {
    switch (endpoint) {
      case "Follow Channel":
        bp.follow(channel);
        break;
      case "Unfollow Channel":
        bp.unfollow(channel);
        break;
    }
  }
}

function filterContent(noScroll) {
  var filter = searchBox.value.toLowerCase();
  var results = bp.getResults();
  var index = bp.getIndex();

  var tags = document.getElementsByClassName("tag");
  var hidden = 0;
  for (var i = 0; i < tags.length; i += 1) {
    if (tags[i].textContent.toLowerCase().search(filter) > -1) {
      tags[i].parentElement.classList.remove("hide");
    } else {
      tags[i].parentElement.classList.add("hide");
      hidden += 1;
    }
  }
  if (!filter && !noScroll) {
    contentArea.scrollTop = results[index].scroll;
  }
  var noResults = document.getElementById("noResults");
  if (tags.length - hidden == 0) {
    if (noResults) {
      noResults.classList.remove("hide");
    } else {
      noResults = document.createElement("div");
      noResults.id = "noResults";
      noResults.classList.add("noResults");
      if (results[index].content.length) {
        noResults.textContent = browser.i18n.getMessage("noResults");
      } else if (index == 0 && mode == "channels") {
        noResults.textContent = browser.i18n.getMessage("channelsTabReady");
      } else if (mode.substr(0, 8) == "followed") {
        noResults.textContent = browser.i18n.getMessage("noFollowedResults");
      } else {
        noResults.textContent = browser.i18n.getMessage("noSearchResults");
      }
      contentArea.append(noResults);
    }
  } else if (noResults) {
    noResults.classList.add("hide");
  }
}

function updatePage(noScroll) {
  //console.log("updatePage");
  /*
    Create info cards from the info the Twitch API gathered
  */
  var results = bp.getResults();
  var index = bp.getIndex();

  while (contentArea.hasChildNodes()) {
    contentArea.removeChild(contentArea.firstChild);
  }

  for (var i = 0; i < results[index].content.length; i += 1) {
    addCard(results[index].content[i], results[index].type);
  }

  if (results.length - index > 1) {
    forward.classList.add("possible");
  } else {
    forward.classList.remove("possible");
  }

  if (index > 0 || mode.substr(0, 8) == "followed") {
    if (results[index].total) {
      searchBox.placeholder = browser.i18n.getMessage(
        "filterOf", [delimitNumber(contentArea.children.length),
          delimitNumber(results[index].total)
        ]);
    } else {
      searchBox.placeholder = browser.i18n.getMessage(
        "filter", delimitNumber(contentArea.children.length));
    }
    search.classList.remove("possible");
    back.classList[index > 0 ? "add" : "remove"]("possible");
  } else {
    if (results[index].total || mode == "channels") {
      searchBox.placeholder = mode == "channels" ?
        browser.i18n.getMessage("searchTwitch") : browser.i18n.getMessage(
          "searchOrFilterOf", [delimitNumber(contentArea.children.length),
            delimitNumber(results[index].total)
          ]);
      search.classList.add("possible");
    } else {
      searchBox.placeholder = browser.i18n.getMessage(
        "filter", delimitNumber(contentArea.children.length));
      search.classList.remove("possible");
    }
    back.classList.remove("possible");
  }

  exitSearch.classList[forward.classList.contains("possible") ||
    back.classList.contains("possible") ? "add" : "remove"]("possible");

  if (mode == "followedChannels" || mode == "followedStreams") {
    //Refresh button becomes favorites filter
    refresh.classList.remove("refresh");
    refresh.classList.add("favorites");
    refresh.classList[bp.getStorage(
      "favoritesMode") ? "add" : "remove"]("possible");
    refresh.firstElementChild.textContent = browser.i18n.getMessage(
      refresh.classList.contains("possible") ? "allFollowsTip" :
      "favoritesTip");
  } else {
    refresh.classList.remove("favorites");
    refresh.classList.add("refresh");
    refresh.classList.add("possible");
    refresh.firstElementChild.textContent = browser.i18n.getMessage(
      "refreshTip");
  }

  if (!noScroll) searchBox.value = results[index].filter;

  filterContent(noScroll);
}

/*
  Click events
*/

//Big click event for non-specific elements
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("noAccess")) {
    //Do nothing I guess?
  } else if (e.target.classList.contains("tab") && e.target.id != mode) {
    bp.setResults(bp.defaultResults());
    bp.setIndex(0);
    updateTab(e.target.id);
  }
});

//Settings page
settings.addEventListener("click", () => browser.runtime.openOptionsPage());

//Back button
back.addEventListener("click", () => {
  if (!back.classList.contains("possible")) return;
  bp.setIndex(bp.getIndex() - 1);
  updatePage();
})


//Forward button
forward.addEventListener("click", () => {
  if (!forward.classList.contains("possible")) return;
  bp.setIndex(bp.getIndex() + 1);
  updatePage();
})

function makeSearch() {
  //Perform search using getApiResults
  if (!search.classList.contains("possible") || !searchBox.value) return;
  switch (mode) {
    case "games":
      getApiResults("Search Games", {
        query: searchBox.value
      }, true);
      break;
    case "streams":
      getApiResults("Search Streams", {
        query: searchBox.value
      }, true);
      break;
    case "channels":
      getApiResults("Search Channels", {
        query: searchBox.value
      }, true);
      break;
    default:
      break;
  }
}

//Search button
search.addEventListener("click", makeSearch);

//Enter key
window.addEventListener("keydown", (e) => {
  if (e.key == "Enter") makeSearch();
});

//Search box
searchBox.addEventListener("input", filterContent);

//Refresh button
refresh.addEventListener("click", () => {
  if (refresh.classList.contains("refresh")) {
    var results = bp.getResults();
    var index = bp.getIndex();
    getApiResults(
      results[index].endpoint, JSON.parse(results[index].opts), false, true);
  } else if (refresh.classList.contains("favorites")) {
    bp.setStorage("favoritesMode", !bp.getStorage("favoritesMode"));
    bp.updateBadge();
    updatePage();
  }
});

//Exit search button
exitSearch.addEventListener("click", () => {
  if (!exitSearch.classList.contains("possible")) return;
  bp.setResults(bp.defaultResults());
  bp.setIndex(0);
  updateTab();
});

//Avatar
avatar.addEventListener("click", () => {
  if (bp.authorizedUser) {
    var url = "https://www.twitch.tv/" + bp.authorizedUser.name;
    browser.tabs.create({
      url: url
    });
  }
});

//Login/logout
login.addEventListener("click", () => {
  if (bp.authorizedUser) {
    bp.deauthorize();
  } else {
    bp.authorize();
  }
});

//About page buttons
aboutWhatsNewButton.addEventListener("click", () => {
  showNewUser = false;
  bp.setStorage('showNewUser', showNewUser);
  initialize();
});

aboutTellMoreButton.addEventListener("click", () => {
  showWhatsNew = false;
  bp.setStorage('showWhatsNew', showWhatsNew);
  initialize();
});

addonPage.addEventListener("click", () => {
  var url = "https://addons.mozilla.org/en-US/firefox/addon/twitch-fox/";
  browser.tabs.create({
    url: url
  });
})

githubPage.addEventListener("click", () => {
  var url = "https://github.com/Hunter5000/twitch-fox";
  browser.tabs.create({
    url: url
  });
})

steamPage.addEventListener("click", () => {
  var url = "http://steamcommunity.com/id/hunter7500/";
  browser.tabs.create({
    url: url
  });
})

screenLock.addEventListener("click", () => {
  screenLock.classList.add("hidden");
  document.getElementById(enlargedContent).classList.remove("hidden");
  enlargedPreview.classList.remove("enlarged");
  enlargedPreview.style.transform = "none";
  oldEnlarged = enlargedPreview;
  oldEnlarged.id = "oldEnlarged";

  enlargedPreview = newEnlarged;
  enlargedPreview.id = "enlargedPreview";
  screenLock.appendChild(enlargedPreview);
})

contentArea.addEventListener("scroll", () => {
  if (contentArea.scrollHeight - contentArea.scrollTop == 564) {
    var results = bp.getResults();
    var index = bp.getIndex();
    getApiResults(results[index].endpoint, JSON.parse(results[index].opts));
  }
})

browser.runtime.onMessage.addListener((request) => {
  if (request.content == "initialize" || (request.content == mode.substr(
      0, 8)) || (request.content == mode)) initialize();
  else if (request.content != "options") updatePage(true);
});

window.addEventListener('unload', function(event) {
  bp.endAlarm();
});

initialize();
