'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    nsio = require('node-sass-import-once'),
    run = require('gulp-run'),
    browserSync = require('browser-sync').create();

//////////////////////////////
// Sass
//////////////////////////////
gulp.task('sass', function () {
  gulp.src('./public/sass/**/*.scss')
    .pipe(sass({
      'importer': nsio,
      'importOnce': {
        'index': true,
        'css': true,
        'bower': true
      }
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

gulp.task('sass:watch', function () {
  gulp.watch('./public/sass/**/*.scss', ['sass']);
});

//////////////////////////////
// HTML
//////////////////////////////
gulp.task('html', function () {
  gulp.src('./public/**/*.html')
    .pipe(browserSync.stream());
});

gulp.task('html:watch', function () {
  gulp.watch('./public/**/*.html', ['html']);
});

//////////////////////////////
// HTML
//////////////////////////////
gulp.task('js', function () {
  gulp.src('./public/js/**/*.js')
    .pipe(browserSync.stream());
});

gulp.task('js:watch', function () {
  gulp.watch('./public/js/**/*.js', ['js']);
});

//////////////////////////////
// Server
//////////////////////////////
gulp.task('browser-sync', function() {
  browserSync.init({
    'proxy': 'localhost:6001'
  })
});

gulp.task('server', function () {
  run('npm start').exec()
});

//////////////////////////////
// Default Tasks
//////////////////////////////
gulp.task('watch', ['sass:watch', 'html:watch', 'js:watch']);

gulp.task('default', ['server', 'browser-sync', 'watch']);