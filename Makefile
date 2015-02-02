deploy:
	grunt bump
	grunt compile
	grunt compress
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/index.html s3://www.vinify.co && \
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/commentcamarche.html s3://www.vinify.co && \
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/experience.html s3://www.vinify.co && \
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/about.html s3://www.vinify.co && \
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/press.html s3://www.vinify.co && \
	s3cmd sync -m "text/html; charset=utf-8" --add-header=Cache-Control:max-age=0 dist/jobs.html s3://www.vinify.co && \
	s3cmd sync --no-preserve bin/assets s3://www.vinify.co --acl-public --add-header \
	  "Content-Encoding:gzip" --mime-type="application/javascript; charset=utf-8" \
	   --exclude '*' --include '*.js' && \
	s3cmd sync -M --no-preserve dist/assets s3://www.vinify.co --acl-public --exclude '*.js'

grunt:
	grunt watch

grunt-dev:
	grunt --dev






	# s3cmd -m "text/css; charset=utf-8" sync bin/assets s3://www.vinify.co --acl-public --add-header \
	#   "Content-Encoding:gzip" \
	#    --exclude '*' --include '*.css' && \