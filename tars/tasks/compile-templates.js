var gulp = require('gulp');
var jade = require('gulp-jade');
var data = require('gulp-data');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var tarsConfig = require('../../../tars-config');
var notifyConfig = tarsConfig.notifyConfig;
var replace = require('gulp-replace-task');
var modifyDate = require('../../helpers/modifyDateFormatter');
var path = require('path');
var fs = require('fs');
var browserSync = require('browser-sync');
var through2 = require('through2');

/**
 * Jade compilation of pages templates.
 * Templates with _ prefix won't be compiled
 * @param  {Object} buildOptions
 */
module.exports = function(buildOptions) {

    function concatModulesData(module) {
        eval('var readyModulesData = {' + fs.readFileSync('./dev/temp/modulesData.js', "utf8") + '}');
        return readyModulesData;
    }

    var patterns = [];

    if (!gutil.env.ie8) {
        patterns.push(
            {
                match: '<link href="%=staticFolder=%/css/main_ie8%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
                replacement: ''
            }
        );
    }

    if (!gutil.env.ie9) {
        patterns.push(
            {
                match: '<link href="%=staticFolder=%/css/main_ie9%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
                replacement: ''
            }
        );
    }

    if (gutil.env.min || gutil.env.release) {
        patterns.push(
            {
                match: '%=min=%',
                replacement: '.min'
            }
        );
    } else {
        patterns.push(
            {
                match: '%=min=%',
                replacement: ''
            }
        );
    }

    if (gutil.env.release) {
        patterns.push(
            {
                match: '%=hash=%',
                replacement: buildOptions.hash
            }
        );
    } else {
        patterns.push(
            {
                match: '%=hash=%',
                replacement: ''
            }
        );
    }

    patterns.push(
        {
            match: '%=staticPrefix=%',
            replacement: tarsConfig.staticPrefix
        }
    );

    return gulp.task('compile-templates', function(cb) {

        var modulesData, error;

        try {
            modulesData = concatModulesData();
        } catch(er) {
            error = er;
        }

        gulp.src(['./markup/pages/**/*.jade', '!./markup/pages/**/_*.jade'])
            .pipe(error ? through2(function () {this.emit('error', '\nAn error occurred while modules data processing:\n' + error)}) : jade({ pretty: true, locals: concatModulesData()}))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while compiling jade.\nLook in the console for details.\n' + error;
            }))
            .pipe(replace({
              patterns: patterns,
              usePrefix: false
            }))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while replacing placeholdres.\nLook in the console for details.\n' + error;
            }))
            .pipe(gulp.dest('./dev/'))
            .pipe(browserSync.reload({stream:true}))
            .pipe(
                gulpif(notifyConfig.useNotify,
                    notify({
                        onLast: true,
                        sound: notifyConfig.sounds.onSuccess,
                        title: notifyConfig.title,
                        message: 'Templates\'ve been compiled \n'+ notifyConfig.taskFinishedText +'<%= options.date %>',
                        templateOptions: {
                            date: modifyDate.getTimeOfModify()
                        }
                    })
                )
            );
        cb(null);
    });
};