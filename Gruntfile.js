module.exports = function (grunt) {

  /**
   * Load required Grunt tasks. These are installed based on the versions listed
   * in `package.json` when you do `npm install` in this directory.
   */
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-html-snapshot');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-sitemap');

  /**
   * Load in our build configuration file.
   */
  var userConfig = require('./build.config.js');

  /**
   * This is the configuration object Grunt uses to give each plugin its
   * instructions.
   */
  var taskConfig = {
    /**
     * We read in our `package.json` file so we can access the package name and
     * version. It's already there, so we don't repeat ourselves here.
     */
    pkg: grunt.file.readJSON("package.json"),

    sitemap: {
      dist: {
        pattern: ['./dist/*.html', '!**/google*.html'], // this will exclude 'google*.html'
        siteRoot: './dist/'
      }
    },

    /**
     * Load our secret access keys
     */
    aws: grunt.file.readJSON('aws-keys.json'),
    aws_s3: {
      options: {
        accessKeyId: '<%= aws.AWSAccessKeyId %>', // Use the variables
        secretAccessKey: '<%= aws.AWSSecretKey %>', // You can also use env variables
        region: 'eu-west-1',
        uploadConcurrency: 5, // 5 simultaneous uploads
        downloadConcurrency: 5 // 5 simultaneous downloads
      },
      staging: {
        options: {
          bucket: 'staging.vinify.co',
          differential: 'true'
        },
        files: [
          {dest: 'assets/', 'action': 'delete', cwd: 'bin/assets/'},
          {expand: true, cwd: 'bin/', src: ['*.html'], dest: '', params: {CacheControl: 'max-age=0', ContentType: 'text/html; charset=utf-8'}},
          {expand: true, cwd: 'bin/assets/', src: ['**/*'], exclude: ["**/*.js", "**/*.css"], dest: 'assets/'},
          {expand: true, cwd: 'dist/assets/',  src: ['**/*.js'], dest: 'assets/', params: {ContentType: 'application/javascript; charset=utf-8', ContentEncoding: 'gzip'}},
          {expand: true, cwd: 'dist/assets/',  src: ['**/*.css'], dest: 'assets/', params: {ContentType: 'text/css; charset=utf-8', ContentEncoding: 'gzip'}}
        ]
      },
      production: {
        options: {
          bucket: 'www.vinify.co'
        },
        files: [
          {dest: 'assets/', 'action': 'delete', cwd: 'bin/assets/', differential: 'true'},
          {expand: true, cwd: 'dist/', src: ['*.html'], dest: '', params: {CacheControl: 'max-age=0', ContentType: 'text/html; charset=utf-8'}},
          {expand: true, cwd: 'dist/', src: ['sitemap.xml'], dest: '', params: {CacheControl: 'max-age=0', ContentType: 'application/xml; charset=utf-8'}},
          {expand: true, cwd: 'dist/assets/', src: ['**/*'], exclude: ["**/*.js", "**/*.css"], dest: 'assets/', differential: 'true'},
          {expand: true, cwd: 'bin/assets/',  src: ['**/*js'], dest: 'assets/', params: {ContentType: 'application/javascript; charset=utf-8', ContentEncoding: 'gzip'}, differential: 'true'},
          {expand: true, cwd: 'bin/assets/',  src: ['**/*css'], dest: 'assets/', params: {ContentType: 'text/css; charset=utf-8', ContentEncoding: 'gzip'}, differential: 'true'}
        ]
      },
      sitemap: {
        options: {
          bucket: 'www.vinify.co'
        },
        files: [
          {expand: true, cwd: 'dist/', src: ['sitemap.xml'], dest: '', params: {CacheControl: 'max-age=0', ContentType: 'application/xml; charset=utf-8'}}
        ]
      },
      clean_production: {
        options: {
          bucket: 'my-wonderful-production-bucket',
          debug: true // Doesn't actually delete but shows log
        },
        files: [
          {dest: 'app/', action: 'delete'},
          {dest: 'assets/', exclude: "**/*.tgz", action: 'delete'}, // will not delete the tgz
          {dest: 'assets/large/', exclude: "**/*copy*", flipExclude: true, action: 'delete'} // will delete everything that has copy in the name
        ]
      },
      download_production: {
        options: {
          bucket: 'my-wonderful-production-bucket'
        },
        files: [
          {dest: 'app/', cwd: 'backup/', action: 'download'}, // Downloads the content of app/ to backup/
          {dest: 'assets/', cwd: 'backup-assets/', exclude: "**/*copy*", action: 'download'} // Downloads everything which doesn't have copy in the name
        ]
      },
      secret: {
        options: {
          bucket: 'my-wonderful-private-bucket',
          access: 'private'
        },
        files: [
          {expand: true, cwd: 'secret_garden/', src: ['*.key'], dest: 'secret/'}
        ]
      }
    },
    /**
     * The banner is the comment that is placed at the top of our compiled
     * source files. It is first processed as a Grunt template, where the `<%=`
     * pairs are evaluated based on this very configuration object.
     */
    meta: {
      banner:
        '/**\n' +
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' *\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
        ' */\n'
    },

    /**
     * Creates a changelog on a new version.
     */
    changelog: {
      options: {
        dest: 'CHANGELOG.md',
        template: 'changelog.tpl'
      }
    },

    /**
     * Increments the version number, etc.
     */
    bump: {
      options: {
        files: [
          "package.json",
          "bower.json"
        ],
        commit: false,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
          "package.json",
          "client/bower.json"
        ],
        createTag: false,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'origin'
      }
    },

    /**
     * The directories to delete when `grunt clean` is executed.
     */
    clean: {
      options: { force: true },
      build:
        [
          '<%= build_dir %>',
          '<%= compile_dir %>'
        ]
    },

    /**
     * The `copy` task just copies files from A to B. We use it here to copy
     * our project assets (images, fonts, etc.) and javascripts into
     * `build_dir`, and then to copy the assets to `compile_dir`.
     */
    copy: {
      build_app_assets: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= build_dir %>/assets/',
            cwd: 'src/assets',
            expand: true
          }
      ]
      },
      build_vendor_assets: {
        files: [
          {
            src: [ '<%= vendor_files.assets %>' ],
            dest: '<%= build_dir %>/assets/',
            cwd: '.',
            expand: true,
            flatten: true
          }
      ]
      },
      build_vendor_css: {
        files: [
          {
            src: [ '<%= vendor_files.css %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
      ]
      },
      build_appjs: {
        files: [
          {
            src: [ '<%= app_files.js %>' ],
            dest: '<%= build_dir %>/js',
            cwd: '.',
            expand: true
          }
        ]
      },
      build_vendorjs: {
        files: [
          {
            src: [ '<%= vendor_files.js %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      compile_assets: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= compile_dir %>/assets',
            cwd: '<%= build_dir %>/assets',
            expand: true
          }
        ]
      },
      /**
       * build wines.
       */
      buildWines: {
        files: [
          {
            cwd: 'src/vin',
            expand: true,
            src: [ '*.html' ],
            dest: 'build/vin'
            // rename: function (dest, src) {
            //   return dest + src.replace(/\.css$/, ".scss");
            // }
          }
        ]
      }
    },

  /**
   * gzip assets.
   */
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        files: [
          { expand: true, cwd: 'dist/assets', src: [ '**/*.css' ], dest: 'bin/assets/' },
          { expand: true, cwd: 'dist/assets', src: [ '**/*.js' ], dest: 'bin/assets/' }
        ]
      }
    },

    /**
     * Compress our images
     */
    imagemin: {                          // Task
      dynamic: {                         // Another target
        files: [
          {
            expand: true,                  // Enable dynamic expansion
            cwd: 'src/',                   // Src matches are relative to this path
            src: [ '**/*.{png,jpg,gif}' ],   // Actual patterns to match
            dest: 'src/'                  // Destination path prefix
          }
        ]
      }
    },

    /**
     * `grunt concat` concatenates multiple source files into a single file.
     */
    concat: {
      /**
       * The `build_css` target concatenates compiled CSS and vendor CSS
       * together.
       */
      build_css: {
        src: [
          '<%= vendor_files.css %>',
          '<%= recess.build.dest %>'
        ],
        dest: '<%= recess.build.dest %>'
      },
      /**
       * The `compile_js` target is the concatenation of our application source
       * code and all specified vendor source code into a single file.
       */
      compile_js: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [
          '<%= vendor_files.js %>',
          '<%= build_dir %>/src/**/*.js'
        ],
        dest: '<%= compile_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    /**
     * Minify the sources!
     */
    uglify: {
      compile: {
        options: {
          banner: '<%= meta.banner %>',
          report: 'gzip'
        },
        files: {
          '<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
        }
      }
    },

    /**
     * `recess` handles our LESS compilation and uglification automatically.
     * Only our `main.less` file is included in compilation; all other files
     * must be imported from this file.
     */
  less: {
      build: {
        options: {
          paths: ["assets/css"]
        },
        files: {
          "<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css": "<%= app_files.less %>"
        }
      },
      compile: {
        options: {
          paths: ["assets/css"],
          cleancss: true
        },
        files: {
          "<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css": "<%= app_files.less %>"
        }
      }
    },

    recess: {
      build: {
        src: [ '<%= app_files.less %>' ],
        dest: '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css',
        options: {
          compile: true,
          compress: false,
          noUnderscores: false,
          noIDs: false,
          zeroUnits: false
        }
      },
      compile: {
        src: [ '<%= recess.build.dest %>' ],
        dest: '<%= recess.build.dest %>',
        options: {
          compile: true,
          compress: true,
          noUnderscores: false,
          noIDs: false,
          zeroUnits: false
        }
      }
    },

    /**
     * `jshint` defines the rules of our linter as well as which files we
     * should check. This file, all javascript sources, and all our unit tests
     * are linted based on the policies listed in `options`. But we can also
     * specify exclusionary patterns by prefixing them with an exclamation
     * point (!); this is useful when code comes from a third party but is
     * nonetheless inside `src/`.
     */
    jshint: {
      src: [
        '<%= app_files.js %>'
      ],
      test: [
        '<%= app_files.jsunit %>'
      ],
      gruntfile: [
        'Gruntfile.js'
      ],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true
      },
      globals: {}
    },


    /**
     * The `index` task compiles the `index.html` file as a Grunt template. CSS
     * and JS files co-exist here but they get split apart later.
     */
    index: {

      /**
       * During development, we don't want to have wait for compilation,
       * concatenation, minification, etc. So to avoid these steps, we simply
       * add all script files directly to the `<head>` of `index.html`. The
       * `src` property contains the list of included files.
       */
      build: {
        dir: '<%= build_dir %>',
        src: [
          '<%= vendor_files.js %>',
          '<%= build_dir %>/src/**/*.js',
          '<%= vendor_files.css %>',
          '<%= recess.build.dest %>'
        ]
      },

      /**
       * When it is time to have a completely compiled application, we can
       * alter the above to include only a single JavaScript and a single CSS
       * file. Now we're back!
       */
      compile: {
        dir: '<%= compile_dir %>',
        src: [
          '<%= concat.compile_js.dest %>',
          '<%= vendor_files.css %>',
          '<%= recess.compile.dest %>'
        ]
      }
    },

    /**
     * And for rapid development, we have a watch set up that checks to see if
     * any of the files listed below change, and then to execute the listed
     * tasks when they do. This just saves us from having to type "grunt" into
     * the command-line every time we want to see what we're working on; we can
     * instead just leave "grunt watch" running in a background terminal. Set it
     * and forget it, as Ron Popeil used to tell us.
     *
     * But we don't need the same thing to happen for all the files.
     */
    delta: {
      /**
       * By default, we want the Live Reload to work for all tasks; this is
       * overridden in some tasks (like this file) where browser resources are
       * unaffected. It runs by default on port 35729, which your browser
       * plugin should auto-detect.
       */
      options: {
        livereload: true
      },

      /**
       * When the Gruntfile changes, we just want to lint it. In fact, when
       * your Gruntfile changes, it will automatically be reloaded!
       */
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: [ 'jshint:gruntfile' ],
        options: {
          livereload: false
        }
      },

      /**
       * When our JavaScript source files change, we want to run lint them and
       * run our unit tests.
       */
      jssrc: {
        files: [
          '<%= app_files.js %>'
        ],
        tasks: [ 'jshint:src', 'copy:build_appjs' ]
      },

      /**
       * When assets are changed, copy them. Note that this will *not* copy new
       * files, so this is probably not very useful.
       */
      assets: {
        files: [
          'src/assets/**/*'
        ],
        tasks: [ 'copy:build_app_assets' ]
      },

      /**
       * When index.html changes, we need to compile it.
       */
      html: {
        files: [ '<%= app_files.html %>' ],
        tasks: [ 'index:build' ]
      },


      /**
       * When the CSS files change, we need to compile and minify them.
       */
      less2: {
        files: [ 'src/**/*.less' ],
        tasks: [ 'less:build' ]
      },

      /**
       * When a JavaScript unit test file changes, we only want to lint it and
       * run the unit tests. We don't want to do any live reloading.
       */
      jsunit: {
        files: [
          '<%= app_files.jsunit %>'
        ],
        tasks: [ 'jshint:test'],
        options: {
          livereload: false
        }
      }
    },
      /**
       * replace strings
       */
      'string-replace': {
        inline: {
          files: {
            'src/vin/': 'src/vin/*.html'
          },
          options: {
            replacements: [
              // place files inline example
              {
                pattern: '<link rel="stylesheet" type="text/css" href="assets/Vinify-0.0.224.css">',
                replacement: function() {
                  return "<% styles.forEach( function ( file ) { %><link rel=\"stylesheet\" type=\"text/css\" href=\"<%= file %>\" /><% }); %>";
                }
              },
              {
                pattern: '<!--Start of Zopim Live Chat Script--><!--End of Zopim Live Chat Script-->',
                replacement: '<div class="container"><hr></div><div class="section" id="social"> <div class="container"> <div class="social"> <div class="col-lg-2 col-lg-offset-2 col-md-2 col-md-offset-2 col-sm-2 col-sm-offset-2 col-xs-2 col-xs-offset-2 socbuttons"> <a href="http://facebook.com/vinify.co" class="float" target="_blank" id="home-social-facebook"><i class="fa icon-2x icon-facebook"></i></a> </div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 socbuttons"> <a href="http://twitter.com/vinifyco" class="float" target="_blank" id="home-social-twitter"><i class="fa icon-2x icon-twitter"></i></a> </div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 socbuttons"> <a href="mailto:founders@vinify.co" class="float" target="_blank" id="home-social-mail"><i class="fa icon-2x icon-mail"></i></a> </div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 socbuttons"> <a href="http://instagram.com/vinify.co/" class="float" target="_blank" id="home-social-instagram"><i class="fa icon-2x icon-instagram"></i></a> </div></div></div></div><div id="footer"> <div class="container"> <footer> <p>Vinify, le caviste qui vous connaît, toujours à portée de main</p><p> <a href="commentcamarche.html">FAQ</a> &middot; <a href="http://vinify.co/docs/cgv.pdf">CGV</a> &middot; <a href="http://vinify.co/press.html">Presse</a> &middot; <a href="http://vinify.co/about.html">L\'équipe</a> </p><p> Copyright &copy; Vinify 2015 &middot; L\'abus d\'alcool est dangereux pour la santé, à consommer avec modération. </p><p> <a href="https://mixpanel.com/f/partner"><img src="//cdn.mxpnl.com/site_media/images/partner/badge_blue.png" alt="Mobile Analytics"/></a> </p></footer> </div></div><script type="text/javascript">mixpanel.track_links("#home-navbar-second-gift","Clicked on home/navbar-gift");mixpanel.track("wine viewed",{"page name":"wine",url:window.location.pathname})</script>'
              },
              {
                pattern: 'href="#',
                replacement: 'href="https://vinify.co/index.html#'
              },
              {
                pattern: '<!-- start Mixpanel --><!-- end Mixpanel -->',
                replacement: '<!-- start Mixpanel --><script type="text/javascript">(function(f,b){if(!b.__SV){var a,e,i,g;window.mixpanel=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=f.createElement("script");a.type="text/javascript";a.async=!0;a.src="//cdn.mxpnl.com/libs/mixpanel-2.2.min.js";e=f.getElementsByTagName("script")[0];e.parentNode.insertBefore(a,e)}})(document,window.mixpanel||[]);mixpanel.init("61669544c576e6ddf06711e2af137c1a");</script><!-- end Mixpanel -->'
              },
              {
                pattern: /<iframe name="stripeXDM_default\w+_provider" id="stripeXDM_default\w+_provider" style="position: absolute; top: -2000px; left: 0px; " src="https:\/\/js\.stripe\.com\/v2\/channel\.html\?xdm_e=https%3A%2F%2Fstart\.vinify\.co&amp;xdm_c=default\w+&amp;xdm_p=1#__stripe_transport__" frameborder="0"><\/iframe>/g,
                replacement: ''
              }
            ]
          }
        },
        sitemap: {
          files: {
            'dist/sitemap.xml': 'dist/sitemap.xml'
          },
          options: {
            replacements: [
              // place files inline example
              {
                pattern: /cobuild/g,
                replacement: 'co'
              },
              {
                pattern: /co\./g,
                replacement: 'co'
              }
            ]
          }
        }
      },

      /**
       * generates html snapshots and save it
       */
      htmlSnapshot: {
            all: {
              options: {
                //that's the path where the snapshots should be placed
                //it's empty by default which means they will go into the directory
                //where your Gruntfile.js is placed
                snapshotPath: 'src/vin/',
                fileNamePrefix: '',
                //This should be either the base path to your index.html file
                //or your base URL. Currently the task does not use it's own
                //webserver. So if your site needs a webserver to be fully
                //functional configure it here.
                sitePath: 'https://start.vinify.co/index.html',
                removeScripts: true,
                sanitize: function(requestUri) {
                  return requestUri.replace(/#|\/|\!/g, '').replace('vin', 'vin-');
                },
                replaceStrings:[
                    // {'<link rel="stylesheet" type="text/css" href="../assets/snapshot.css">': '<% forEach( function ( file ) { %><link rel="stylesheet" type="text/css" href="<%= file %>" /><% }); %>'},
                    {'<meta name="fragment" content="!"><base href="/">' : ''},
                    {'content="https://start.vinify.co/#!/vin/': 'content="https://www.vinify.co/vin-'}
                ],
                //here goes the list of all urls that should be fetched
                urls: [
                  "#/vin/pouilly-fume-vieilles-vignes-jp-bailly-2011",
                  "#/vin/chateau-baret-2002",
                  "#/vin/chateau-baret-2003",
                  "#/vin/marquis-de-montmelas-rouge-2007",
                  "#/vin/montmelas-cuvee-speciale-1566-2010",
                  "#/vin/marquis-de-montmelas-blanc-2011",
                  "#/vin/montmains-domaine-chevallier-2012",
                  "#/vin/cuvee-prestige-domaine-chevallier-2012",
                  "#/vin/montmains-domaine-chevallier-2013",
                  "#/vin/cuvee-prestige-domaine-chevallier-2013",
                  "#/vin/chateau-la-trochoire-2008",
                  "#/vin/chateau-la-trochoire-2010",
                  "#/vin/fleurie-cuvee-jules-appert-2011",
                  "#/vin/riesling-rittersberg-bernhard-et-reibel-2011",
                  "#/vin/pinot-noir-domaine-bernhard-et-reibel-2012",
                  "#/vin/anjou-rouge-domaine-la-croix-2011",
                  "#/vin/anjou-rouge-domaine-la-croix-2013",
                  "#/vin/domaine-de-venus-rouge-2004",
                  "#/vin/domaine-de-venus-rouge-2006",
                  "#/vin/leffrontee-de-venus-2009",
                  "#/vin/domaine-de-venus-rose-2012",
                  "#/vin/chateau-de-chamirey-2008",
                  "#/vin/le-renard-2011",
                  "#/vin/cotes-dauxerre-domaine-felix-fils-2012",
                  "#/vin/loi-domaine-saladin-2010",
                  "#/vin/paul-domaine-saladin-2012",
                  "#/vin/tralala-2013",
                  "#/vin/le-clos-des-joubert-2010",
                  "#/vin/lexcellence-vieilles-vignes-2012",
                  "#/vin/lexcellence-vieilles-vignes-2013",
                  "#/vin/terroir-les-gras-moutons-2013",
                  "#/vin/gewurztraminer-pierre-frick-2009",
                  "#/vin/riesling-gd-cru-steinert-pierre-frick-2009",
                  "#/vin/pinot-noir-pierre-frick-2010",
                  "#/vin/cuvee-florence-domaine-les-goubert-2006",
                  "#/vin/beaumes-de-venise-domaine-les-goubert-2010",
                  "#/vin/sablet-rouge-domaine-les-goubert-2011",
                  "#/vin/les-favoris-domaine-les-goubert-2012",
                  "#/vin/sablet-blanc-domaine-les-goubert-2012",
                  "#/vin/beaumes-de-venise-domaine-les-goubert-2012",
                  "#/vin/gewurztraminer-gloeckelberg-koehly-2011",
                  "#/vin/riesling-hahnenberg-koehly-2011",
                  "#/vin/gewurztraminer-gloeckelberg-koehly-2012",
                  "#/vin/gewurztraminer-hannenberg-koehly-2012",
                  "#/vin/pinot-noir-koehly-2012",
                  "#/vin/saumur-domaine-lavigne-2012",
                  "#/vin/marquis-de-pennautier-2011",
                  "#/vin/chateau-de-ciffre-2011",
                  "#/vin/chateau-la-veille-cure-2006",
                  "#/vin/chateau-la-veille-cure-2011",
                  "#/vin/les-grains-merlot-2011",
                  "#/vin/orca-2011",
                  "#/vin/doria-2012",
                  "#/vin/grand-marrenon-blanc-2012",
                  "#/vin/private-gallery-rouge-2012",
                  "#/vin/grand-marrenon-rouge-2012",
                  "#/vin/les-grains-syrah-2012",
                  "#/vin/les-grains-chardonnay-2013",
                  "#/vin/les-grains-vermentino-2013",
                  "#/vin/doria-2013",
                  "#/vin/private-gallery-blanc-2013",
                  "#/vin/les-grains-viognier-2013",
                  "#/vin/petula-2013",
                  "#/vin/rosefine-2013",
                  "#/vin/cuvee-m-2013",
                  "#/vin/alliance-des-generations-2005",
                  "#/vin/boa-le-rouge-2009",
                  "#/vin/cent-visages-2010",
                  "#/vin/la-rosee-2012",
                  "#/vin/laurus-2011",
                  "#/vin/laurus-2012",
                  "#/vin/laurus-blanc-2013",
                  "#/vin/terre-de-galets-blanc-2013",
                  "#/vin/chateau-de-tresques-2013",
                  "#/vin/plan-de-dieu-saint-mapalis-2013",
                  "#/vin/gm-gabriel-meffre-2013",
                  "#/vin/chateau-des-jacques-louis-jadot-2004",
                  "#/vin/expression-domaine-de-lebeaupin-2007",
                  "#/vin/confidence-domaine-de-lebeaupin-2010",
                  "#/vin/malbec-domaine-de-lebeaupin-2011",
                  "#/vin/tentation-domaine-de-lebeaupin-2012",
                  "#/vin/elegance-domaine-de-lebeaupin-2012",
                  "#/vin/elegance-domaine-de-lebeaupin-2013",
                  "#/vin/st-lambert-domaine-de-paimpare-2011",
                  "#/vin/clos-de-bretonneau-domaine-de-paimpare-2011",
                  "#/vin/cuvee-floriane-domaine-de-paimpare-2011",
                  "#/vin/vielles-vignes-domaine-de-paimpare-2013",
                  "#/vin/cremant-de-loire-rose-sec-domaine-de-paimpare-2013",
                  "#/vin/clos-castelot-2010",
                  "#/vin/chateau-sipian-2010",
                  "#/vin/chateau-moya-2011",
                  "#/vin/clos-des-lunes-lune-dargent-2012",
                  "#/vin/r-cru-classe-2013",
                  "#/vin/chateau-boutisse-2009",
                  "#/vin/recougne-terra-recognita-2010",
                  "#/vin/burkes-of-bordeaux-blanc-2012",
                  "#/vin/les-renardes-domaine-thevenot-fils-2011",
                  "#/vin/pinot-beurot-domaine-thevenot-le-brun-fils-2012",
                  "#/vin/les-renardes-domaine-thevenot-fils-2012",
                  "#/vin/pinot-beurot-domaine-thevenot-le-brun-fils-2013"
                ]
              }
            }
        }
  };

  grunt.initConfig(grunt.util._.extend(taskConfig, userConfig));

  /**
   * In order to make it safe to just compile or copy *only* what was changed,
   * we need to ensure we are starting from a clean, fresh build. So we rename
   * the `watch` task to `delta` (that's why the configuration var above is
   * `delta`) and then add a new task called `watch` that does a clean build
   * before watching for changes.
   */
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', [ 'build', 'delta' ]);

  /**
   * The default task is to build and compile.
   */
  grunt.registerTask('default', [ 'build', 'compile' ]);

  grunt.registerTask('siteMap', [ 'sitemap', 'string-replace:sitemap' ]);

  grunt.registerTask('snapshot', [ 'htmlSnapshot', 'string-replace:inline' ]);

  /**
   * The `build` task gets your app ready to run for development and testing.
   */
  grunt.registerTask('build', [
    'clean',
      'jshint',
      'less:build',
      'concat:build_css',
      'copy:build_app_assets',
      'copy:build_vendor_assets',
      'copy:build_vendor_css',
      'copy:build_appjs',
      'copy:build_vendorjs',
      // 'copy:buildWines',
      'index:build'
  ]);

  /**
   * The `compile` task gets your app ready for deployment by concatenating and
   * minifying your code.
   */
  grunt.registerTask('compile', [
    'less:compile', 'copy:compile_assets', 'concat:compile_js', 'uglify', 'index:compile'
  ]);

  grunt.registerTask('deploy', [
    'bump', 'compile', 'siteMap', 'compress', 'aws_s3:production'
  ]);
  /**
   * A utility function to get all app JavaScript sources.
   */
  function filterForJS (files) {
    return files.filter(function (file) {
      return file.match(/\.js$/);
    });
  }

  /**
   * A utility function to get all app CSS sources.
   */
  function filterForCSS (files) {
    return files.filter(function (file) {
      return file.match(/\.css$/);
    });
  }

  /**
   * A utility function to get all app HTML sources.
   */
  function filterForHTML (files) {
    return files.filter(function (file) {
      return file.match(/\.html$/);
    });
  }

  /**
   * The index.html template includes the stylesheet and javascript sources
   * based on dynamic names calculated in this Gruntfile. This task assembles
   * the list into variables for the template to use and then runs the
   * compilation.
   */
  grunt.registerMultiTask('index', 'Process index.html template', function () {
    var dirRE = new RegExp('^(' + grunt.config('build_dir') + '|' + grunt.config('compile_dir') + ')\/', 'g');
    var jsFiles = filterForJS(this.filesSrc).map(function (file) {
      return file.replace(dirRE, '');
    });
    var cssFiles = filterForCSS(this.filesSrc).map(function (file) {
      return file.replace(dirRE, '');
    });


    grunt.file.copy('src/index.html', this.data.dir + '/index.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    grunt.file.copy('src/commentcamarche.html', this.data.dir + '/commentcamarche.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    grunt.file.copy('src/experience.html', this.data.dir + '/experience.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    grunt.file.copy('src/press.html', this.data.dir + '/press.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    grunt.file.copy('src/jobs.html', this.data.dir + '/jobs.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    grunt.file.copy('src/about.html', this.data.dir + '/about.html', {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version')
          }
        });
      }
    });

    var winePath = grunt.file.expand('src/vin/*.html');
    var wineFiles = new Array(winePath.length);
    for (var i = winePath.length - 1; i >= 0; i--) {
      wineFiles[i] = winePath[i].split('/vin/')[1];
    }

    var process = function (contents, path) {
      return grunt.template.process(contents, {
        data: {
          scripts: jsFiles,
          styles: cssFiles,
          version: grunt.config('pkg.version')
        }
      });
    };

    grunt.file.mkdir(this.data.dir + '/vin');
    for (var j = winePath.length - 1; j >= 0; j--) {
      grunt.file.copy(winePath[j], this.data.dir + '/' + wineFiles[j], {
        process: process
      });
    }
  });

};
