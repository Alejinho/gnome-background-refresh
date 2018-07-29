const Unsplash = require('unsplash-js').default;
const {toJson} = require('unsplash-js');
const {exec} = require('child_process');
const https = require('https');
const fs = require('fs');
const env = require('./local.env');
global.fetch = require('node-fetch');

const TIME_RANGE = 1000 * 60 * env.refreshRate;
const BACKGROUND_PATH = '/tmp/new-background';
const THEMES = env.themes;

setInterval(setNewWallpaper, TIME_RANGE);
setNewWallpaper();

/**
 * @returns {PromiseLike<string | never | never>}
 */
function setNewWallpaper() {
    const unsplash = new Unsplash({
        applicationId: env.applicationId,
        secret: env.secret,
    });

    return unsplash.photos.getRandomPhoto({query: getRandomTheme()})
        .then(toJson)
        .then(json => {
            unsplash.photos.downloadPhoto(json);
            return saveImage(json.urls.full, BACKGROUND_PATH);
        })
        .then(_setGnomeWallpaper);
}

/**
 * Save image at temporal directory.
 *
 * @param {string} urlToDownload
 * @param {string} newPath
 * @returns {Promise<string>}
 */
function saveImage(urlToDownload, newPath) {
    return new Promise(fulfill => {
        const file = fs.createWriteStream(newPath);
        https.get(urlToDownload, response => {
            response.pipe(file);
            fulfill(newPath);
        });
    });
}

/**
 * Set desktop wallpaper.
 *
 * @param {string} path
 */
function _setGnomeWallpaper(path) {
    exec(`gsettings set org.gnome.desktop.background picture-uri file://${path}`);
    exec(`gsettings set org.gnome.desktop.screensaver picture-uri file://${path}`);
}

/**
 * Get a random item from themes preferences.
 *
 * @returns {string}
 */
function getRandomTheme() {
    return THEMES[Math.floor(Math.random() * THEMES.length)];
}
