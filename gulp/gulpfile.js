const { src, dest, watch, series, parallel } = require("gulp");

const srcBase = '../src';
const distBase = '../dist';
const srcPath = {
  css: srcBase + '/sass/**/*.scss',
  img: srcBase + '/images/**/*',
};
const distPath = {
  css: distBase + '/css/',
  img: distBase + '/images/',
  html: distBase + '/**/*.html',
  js: distBase + '/js/**/*.js',
};

const browserSync = require("browser-sync");
const browserSyncOption = {
  server: distBase
};
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
};
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob-use-forward');
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const postcss = require("gulp-postcss");
const cssnext = require("postcss-cssnext");
const sourcemaps = require("gulp-sourcemaps");
const browsers = [
  'last 2 versions',
  '> 5%',
  'ie = 11',
  'not ie <= 10',
  'ios >= 8',
  'and_chr >= 5',
  'Android >= 5',
];

const postcssUncss = require('postcss-uncss');

const cssSass = () => {
  return src(srcPath.css)
    .pipe(sourcemaps.init())
    .pipe(plumber({
      errorHandler: notify.onError('Error:<%= error.message %>')
    }))
    .pipe(sassGlob())
    .pipe(sass.sync({
      includePaths: ['src/sass'],
      outputStyle: 'expanded'
    }))
    .pipe(postcss([
      cssnext({
        features: {
          rem: false
        }
      }, browsers),
      postcssUncss({
        html: [distPath.html]
      })
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(distPath.css))
    .pipe(notify({
      message: 'Sassをコンパイルしてるんやで〜！',
      onLast: true
    }));
};

const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");
const webp = require('gulp-webp');

const imgImagemin = () => {
  return src(srcPath.img)
    .pipe(imagemin([
      imageminMozjpeg({
        quality: 80
      }),
      imageminPngquant(),
      imageminSvgo({
        plugins: [{
          removeViewbox: false
        }]
      })
    ], {
      verbose: true
    }))
    .pipe(dest(distPath.img))
    .pipe(webp())
    .pipe(dest(distPath.img));
};

const watchFiles = () => {
  watch(srcPath.css, series(cssSass, browserSyncReload));
  watch(srcPath.img, series(imgImagemin, browserSyncReload));
  watch(distPath.html, series(browserSyncReload));
  watch(distPath.js, series(browserSyncReload));
};

const del = require('del');
const delPath = {
  css: distBase + '/css/style.css',
  cssMap: distBase + '/css/style.css.map',
  img: distBase + '/images/'
};

const clean = (done) => {
  del(delPath.css, { force: true });
  del(delPath.cssMap, { force: true });
  del(delPath.img, { force: true });
  done();
};

exports.default = series(series(clean, imgImagemin, cssSass), parallel(watchFiles, browserSyncFunc));
