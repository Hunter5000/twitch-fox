/*
  Create info cards for a game, channel, stream, video, or clip
*/

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
