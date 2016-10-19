module.exports = function(grunt) {
    grunt.initConfig({
        uncss: {
            dist: {
                files: {
                    'css/main-styles.css': ['index.html']
                }
            }
        },
        imagemin: {
            dynamic: {
              files: [{
                expand: true,
                cwd: 'images/',
                src: ['*.{png,jpg,gif}'],
                dest: 'images/dist/'
            }]
        }
    }
});

    grunt.loadNpmTasks('grunt-uncss');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    grunt.registerTask('default', ['uncss','imagemin']);
    grunt.registerTask('imagemin', ['imagemin']);
    grunt.registerTask('deletecss', ['uncss']);
};