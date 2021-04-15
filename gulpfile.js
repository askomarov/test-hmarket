const path = require('path');
const gulp = require("gulp");
const plumber = require("gulp-plumber"); //обработчик ошибок
const sourcemap = require("gulp-sourcemaps"); //добавляет карты кода для css
const sass = require("gulp-sass"); //делает из scss - css
const postcss = require("gulp-postcss");
const csso = require("gulp-csso"); //минификация стилей
const autoprefixer = require("autoprefixer");
const sync = require("browser-sync").create();
const htmlmin = require('gulp-htmlmin'); //минификация html
const fileinclude = require('gulp-file-include');
const webp = require("gulp-webp");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const del = require("del");
const terser = require("gulp-terser"); //обратка и минифик файлов js
const ghPages = require('gh-pages');
const webpack = require('webpack-stream');

// gh-pages
const deploy = (cb) => {
	ghPages.publish(path.join(process.cwd(), './build'), cb);
};
exports.deploy = deploy;


//svg sprite
const sprite = () => {
	return gulp.src("source/img/**/*.svg")
		.pipe(svgstore())
		.pipe(rename("sprite.svg"))
		.pipe(gulp.dest("build/img"))
};
exports.sprite = sprite;

//webp
const makewebp = () => {
	return gulp.src("source/img/**/*.{jpg,png,svg}")
		.pipe(webp({ quality: 70 }))
		.pipe(gulp.dest('source/optimize-img'));
};
exports.makewebp = makewebp;

//images
const images = () => {
	return gulp.src("source/source-img/**/*.{jpg,png,svg}")
		.pipe(imagemin([
			imagemin.optipng({ optimizationLevel: 3 }),
			imagemin.mozjpeg({ quality: 75, progressive: true }),
			// imagemin.svgo()
		]))
		.pipe(gulp.dest('source/img'));
};
exports.images = images;

// Styles
const styles = () => {
	return gulp.src("source/sass/style.scss")
		.pipe(plumber())
		.pipe(sourcemap.init())
		.pipe(sass())
		.pipe(postcss([
			autoprefixer()
		]))
		.pipe(csso())
		.pipe(rename('style.min.css'))
		.pipe(sourcemap.write("."))
		.pipe(gulp.dest("build/css"))
		.pipe(sync.stream());
};
exports.styles = styles;

// html
const html = () => {
	return gulp.src("source/*.html")
		.pipe(fileinclude())
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(gulp.dest('build'))
		.pipe(sync.stream());
};
exports.html = html;

//javascript
const scripts = () => {
	return gulp.src('source/js/main.js')
		.pipe(gulp.dest('build/js'))
		.pipe(terser())
		.pipe(rename({
			suffix: '.min'
		}))
		// .pipe(webpack(require('./webpack.config.js')))
		.pipe(gulp.dest('build/js'))
		.pipe(sync.stream());
}
exports.scripts = scripts;

//copy
const copy = () => {
	return gulp.src([
		"source/fonts/**/*.{woff,woff2}",
		"source/img/**",
	], {
		base: "source"
	})
		.pipe(gulp.dest("build"));
};
exports.copy = copy;

//clean
const clean = () => {
	return del("build");
};
exports.clean = clean;

// Server
const server = (done) => {
	sync.init({
		server: {
			baseDir: "build/"
		},
		cors: true,
		notify: false,
		ui: false,
	});
	done();
};
exports.server = server;

//build
const build = gulp.series(
	clean,
	gulp.parallel(html, styles, scripts, sprite), gulp.series(copy));
exports.build = build;

// Watcher
const watcher = () => {
	gulp.watch("source/js/**/*.js", gulp.series("scripts"));
	gulp.watch("source/sass/**/*.scss", gulp.series("styles"));
	gulp.watch("source/**/*.html", gulp.series("html"));
}

exports.default = gulp.series(
	build, server, watcher
);
