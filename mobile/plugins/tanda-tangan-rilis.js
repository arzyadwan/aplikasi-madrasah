/**
 * Config plugin: menandatangani APK rilis dengan kunci madrasah.
 * Nilai diambil dari properti Gradle (misalnya di ~/.gradle/gradle.properties):
 *   MADRASAH_STORE_FILE=/path/ke/madrasah-rilis.keystore
 *   MADRASAH_STORE_PASSWORD=...
 *   MADRASAH_KEY_ALIAS=madrasah
 *   MADRASAH_KEY_PASSWORD=...
 * Bila properti tidak ada, build rilis memakai kunci debug (hanya untuk uji coba).
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const BLOK = `
        release {
            if (project.hasProperty('MADRASAH_STORE_FILE')) {
                storeFile file(MADRASAH_STORE_FILE)
                storePassword MADRASAH_STORE_PASSWORD
                keyAlias MADRASAH_KEY_ALIAS
                keyPassword MADRASAH_KEY_PASSWORD
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

module.exports = function tandaTanganRilis(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes("MADRASAH_STORE_FILE")) return cfg;
    // tambahkan signingConfigs.release setelah blok debug
    g = g.replace(/(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/, `$1${BLOK}`);
    // pakai signingConfigs.release di buildTypes.release
    g = g.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, "$1signingConfig signingConfigs.release");
    if (!g.includes("signingConfigs.release")) throw new Error("tanda-tangan-rilis: struktur build.gradle tidak dikenali");
    cfg.modResults.contents = g;
    return cfg;
  });
};
