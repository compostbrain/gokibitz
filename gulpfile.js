var gulp = require('gulp');
var gutil = require('gulp-util');
var debug = require('gulp-debug');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
var notify = require('gulp-notify');

var bower = './client/src/bower_components';

gulp.task('bootstrap-assets', function () {
	return gulp.src('./client/src/bower_components/bootstrap-sass-official/vendor/assets/fonts/**')
	.pipe(gulp.dest('./client/public/fonts'));
});

gulp.task('fonts', function () {
	return gulp.src('./client/src/assets/fonts/**')
	.pipe(gulp.dest('./client/public/fonts'));
});

gulp.task('sass', function () {
	return gulp.src('./client/src/scss/**/*.scss')
	.pipe(concat('app.css'))
	.pipe(sass({ errLogToConsole: true }))
	.pipe(prefix())
	.pipe(gulp.dest('./client/public/css'));
});

gulp.task('browserify', function () {
	return browserify({
		entries: ['./client/src/js/app.js']
	})
	.bundle({ debug: true })
	.on('error', notify.onError({
		title: 'Browserify Error',
		message: '<%= error.message %>'
	}))
	.on('error', function (e) {
		gutil.log(e);
		this.emit('end');
	})
	.pipe(source('app.js'))
	.pipe(gulp.dest('./client/public/js/'));
});

// Lint our server-side JS
gulp.task('lint-server-js', function () {
	return gulp.src('./server/**/*.js')
	.pipe(jshint('./.jshintrc'))
	.pipe(jshint.reporter(stylish));
});

gulp.task('default', ['lint-server-js', 'sass', 'browserify', 'fonts', 'bootstrap-assets'], function () {
	// Nothing!
});

gulp.task('watch', ['default'], function () {
	var server = livereload();

	nodemon({
		script: './server/bin/www',
		ext: 'js jade',
		watch: ['server', 'server.js'],
		env: {
			DEBUG: 'gokibitz',
			PORT: 3434
		}
	}).on('change', ['lint-server-js']);

	gulp.watch('./client/src/scss/**/*.scss', ['sass']);
	gulp.watch('./client/src/js/**/*.js', ['browserify']);
	gulp.watch('./client/src/assets/fonts/**/*', ['fonts']);

	gulp.watch('./client/public/**').on('change', function (file) {
		server.changed(file.path);
	});
});