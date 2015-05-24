var gulp = require('gulp');
var jison = require('gulp-jison');

gulp.task('default', function() {
    return gulp.src('./lib/sprache/*.jison')
        .pipe(jison())
        .pipe(gulp.dest('./lib/sprache/'));
});