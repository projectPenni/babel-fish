'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    run = require('gulp-run'),
    browserSync = require('browser-sync').create();

gulp.task('sass', function () {
  gulp.src('./public/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

gulp.task('sass:watch', function () {
  gulp.watch('./public/sass/**/*.scss', ['sass']);
});

gulp.task('browser-sync', function() {
  browserSync.init({
    'proxy': 'localhost:6001'
  })
});

gulp.task('server', function () {
  run('npm start').exec()
});

gulp.task('watch', ['sass:watch']);

gulp.task('default', ['server', 'browser-sync', 'watch']);