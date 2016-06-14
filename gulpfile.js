var gulp         = require('gulp');
var sass         = require('gulp-sass');
var sassGlob     = require('gulp-sass-glob');
var merge        = require('merge-stream');
var rename       = require("gulp-rename");
var autoprefixer = require('gulp-autoprefixer');
var uglifycss    = require('gulp-uglifycss');
var uglify       = require('gulp-uglify');
var ts           = require('gulp-typescript');
var tsProject    = ts.createProject("tsconfig.json");
var runSequence  = require('run-sequence');
var appPath      = 'app/assets/';
var srcPath      = 'src/';
var distPath     = 'dist/';

gulp.task('sass', function() {
  var app = gulp.src(appPath + 'stylesheets/app.scss')
    .pipe(sassGlob())
    .pipe(sass({
      indentedSyntax: true,
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gulp.dest(appPath + 'stylesheets/'));

  var modal = gulp.src([
      srcPath + 'scss/multi-modal-classic.scss',
      srcPath + 'scss/multi-modal-modern.scss'
    ])
    .pipe(sassGlob())
    .pipe(sass({
      indentedSyntax: true,
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gulp.dest(distPath));

  return merge(app, modal);
});

gulp.task('autoprefixer', function() {
  var app = gulp.src(appPath + 'stylesheets/app.css')
    .pipe(autoprefixer({
      browsers: '> 1%'
    }))
    .pipe(gulp.dest(appPath + 'stylesheets/'));

  var modal = gulp.src([
      distPath + 'multi-modal-classic.css',
      distPath + 'multi-modal-modern.css'
    ])
    .pipe(autoprefixer({
      browsers: '> 1%'
    }))
    .pipe(gulp.dest(distPath));

  return merge(app, modal);
});

gulp.task('uglify-css', function() {
  return gulp.src([
      distPath + 'multi-modal-classic.css',
      distPath + 'multi-modal-modern.css'
    ])
    .pipe(uglifycss())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(distPath));
});

gulp.task('copy-ts', function() {
  return gulp.src(srcPath + 'typescript/multi-modal.ts')
    .pipe(gulp.dest(distPath));
});

gulp.task('typescript', function() {
  return tsProject.src()
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest(distPath));
});

gulp.task('uglify-js', function() {
  gulp.src(distPath + 'multi-modal.js')
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(distPath));
});

gulp.task('watch', function() {
  gulp.watch([
    appPath + 'stylesheets/**/*.scss',
    srcPath + 'scss/*.scss'
  ], ['sass']);

  gulp.watch([
    appPath + 'stylesheets/*.css',
    distPath + '*.css'
  ], runSequence('autoprefixer'));

  gulp.watch([
    srcPath + 'typescript/*.ts'
  ], ['typescript']);
});

gulp.task('compile', function() {
  runSequence('sass', 'autoprefixer', 'uglify-css');
  runSequence('copy-ts', 'typescript', 'uglify-js');
});

gulp.task('default', ['watch'], function() {
  gulp.start('compile');
});
