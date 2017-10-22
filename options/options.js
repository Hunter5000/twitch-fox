var bp = browser.extension.getBackgroundPage();

var nonTwitch = document.getElementById("nonTwitch");
var notification = document.getElementById("notification");
var audioNotification = document.getElementById("audioNotification");
var unfavoriteAll = document.getElementById("unfavoriteAll");
var unfollowAll = document.getElementById("unfollowAll");
var alarmLimit = document.getElementById("alarmLimit");
var testAudioNotification = document.getElementById("testAudioNotification");
var importButton = document.getElementById("importButton");
var exportFollows = document.getElementById("exportFollows");

nonTwitch.style.display = bp.getStorage("nonTwitchFollows") &&
  !bp.authorizedUser ? "inline" : "none";
notification.style.display = bp.authorizedUser ||
  bp.getStorage("nonTwitchFollows") ? "inline" : "none";
audioNotification.style.display =
  bp.getStorage("favoritesAudioNotifications") ||
  bp.getStorage("nonfavoritesAudioNotifications") ? "inline" : "none";
unfavoriteAll.style.display = bp.getStorage("favorites").length ? "inline" :
  "none";
unfollowAll.style.display = bp.getStorage("follows").length ? "inline" :
  "none";

alarmLimit.style.display = bp.getStorage("limitAlarm") ? "inline" : "none";

var i18ns = document.getElementsByClassName("i18n");
for (var i = 0; i < i18ns.length; i += 1) {
  var i18n = i18ns[i];
  if (i18n.id == "unfavoriteAll") {
    i18n.value = browser.i18n.getMessage(i18n.id,
      bp.getStorage("favorites").length);
  } else if (i18n.id == "unfollowAll") {
    i18n.value = browser.i18n.getMessage(i18n.id,
      bp.getStorage("follows").length);
  } else if (i18n.classList.contains("button")) {
    i18n.value = browser.i18n.getMessage(i18n.id);
  } else {
    i18n.textContent = browser.i18n.getMessage(i18n.id);
  }
}

var checkboxes = document.getElementsByClassName("checkbox");
for (var i = 0; i < checkboxes.length; i += 1) {
  var checkbox = checkboxes[i];
  checkbox.checked = bp.getStorage(checkbox.id);
  checkbox.addEventListener('change', (e) => {
    checkbox = e.target;
    bp.setStorage(checkbox.id, checkbox.checked);
    if (checkbox.id == "nonTwitchFollows") bp.initFollows();
  })
}

var numbers = document.getElementsByClassName("number");
for (var i = 0; i < numbers.length; i += 1) {
  var number = numbers[i];
  number.value = bp.getStorage(number.id);
  number.addEventListener('change', (e) => {
    number = e.target;
    var val = Number(number.value);
    var min = number.min;
    var max = number.max;
    val = isNaN(val) ? bp.getStorage(number.id) : val;
    if (min !== '') val = val < Number(min) ? Number(min) : val;
    if (max !== '') val = val > Number(max) ? Number(max) : val;
    number.value = val;
    bp.setStorage(number.id, val);
  })
}

var texts = document.getElementsByClassName("text");
for (var i = 0; i < texts.length; i += 1) {
  var text = texts[i];
  text.value = bp.getStorage(text.id);
  text.addEventListener('input', (e) => {
    text = e.target;
    bp.setStorage(text.id, text.value);
  })
}

unfavoriteAll.addEventListener('click', () => {
  if (unfavoriteAll.value == browser.i18n.getMessage("areYouSure")) {
    bp.unfavoriteAll();
  } else {
    unfavoriteAll.value = browser.i18n.getMessage("areYouSure");
    window.setTimeout(() => {
      unfavoriteAll.value = browser.i18n.getMessage("unfavoriteAll",
        bp.getStorage("favorites").length);
    }, 2000);
  }
});

unfollowAll.addEventListener('click', () => {
  if (unfollowAll.value == browser.i18n.getMessage("areYouSure")) {
    bp.unfollowAll();
  } else {
    unfollowAll.value = browser.i18n.getMessage("areYouSure");
    window.setTimeout(() => {
      unfollowAll.value = browser.i18n.getMessage("unfollowAll",
        bp.getStorage("follow").length);
    }, 2000);
  }
});

importButton.addEventListener('change', () => {
  var file = importButton.files[0];
  var reader = new FileReader();
  reader.onload = function() {
    bp.importFollows(this.result);
  };
  reader.readAsText(file);
});

exportFollows.addEventListener('click', () => {
  var textToWrite = JSON.stringify(bp.getStorage("follows"));
  var textFileAsBlob = new Blob([textToWrite], {
    type: 'text/plain'
  });
  var fileName = "Twitch_Fox_" + new Date().toJSON().slice(0, 10) + ".txt";
  var downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.textContent = "Save follows";
  downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
});

testAudioNotification.addEventListener('click', () => {
  bp.playAlarm(true);
})

browser.runtime.onMessage.addListener(() => {
  window.location.reload();
});
