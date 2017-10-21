/* Play the alarm audio */

var audio = new Audio();
var alarmInterval;
var alarmOn = false;
var alarmPeriod = 1000;
var alarmLength = 10000;
var alarmOngoing = 0;
var alarmLimit = false;
var alarmTarget;

function playAlarm(override) {
  if (!alarmOn && !override) return;
  audio.play();
  //Also flash the badge
  browser.browserAction.setBadgeBackgroundColor({
    color: "#FF0000"
  });
  window.setTimeout(() => browser.browserAction.setBadgeBackgroundColor({
    color: "#6641A5"
  }), 250);
  if (alarmLimit && !override) {
    alarmOngoing += alarmPeriod;
    if (alarmLimit && alarmOngoing >= alarmLength) endAlarm();
  }
}

function setAlarm(target) {
  //console.log("setAlarm");
  audio.load();
  window.clearInterval(alarmInterval);
  alarmInterval = window.setInterval(playAlarm, alarmPeriod);
  playAlarm();
  alarmOn = true;
  alarmTarget = target;
  alarmOngoing = 0;
  updateBadge();
  /*browser.runtime.sendMessage({
    content: "endAlarm"
  });*/
}

function endAlarm() {
  window.clearInterval(alarmInterval);
  audio.pause();
  alarmOn = false;
  alarmTarget = null;
  updateBadge();
}

function updateAlarm() {
  audio.volume = getStorage("alarmVolume") / 100;
  audio.src = "alarm.ogg";
  alarmPeriod = getStorage("alarmInterval") * 1000;
  alarmLength = getStorage("alarmLength") * 1000;
  alarmLimit = getStorage("limitAlarm");
  if (alarmOn) {
    window.clearInterval(alarmInterval);
    audio.pause();
    alarmInterval = window.setInterval(playAlarm, alarmPeriod);
    playAlarm();
  }
};
