"use strict";

module.exports = function(grunt) {
    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        less: {
            options: {
                strictMath: true
            },
            dynamic: {
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: "public/less/",      // Src matches are relative to this path.
                        src: ["**/*.less", "!base/*", "base/index.less"], // Actual pattern(s) to match.
                        dest: "public/dist/css/",   // Destination path prefix.
                        ext: ".css"    // Dest filepaths will have this extension.
                    }
                ]
            }
        },
        watch: {
            less: {
                files: ["/public/less/**/*.less"],
                tasks: ["less"]
            }
        }
    });

    // 加载提供"uglify"任务的插件
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // 默认任务
    grunt.registerTask("default", ["less"]);
}