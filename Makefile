deploy:
	grunt bump
	grunt compile
	s3cmd sync --add-header=Cache-Control:max-age=0 dist/index.html s3://landing-vinify-test
	s3cmd sync --add-header=Cache-Control:max-age=0 dist/commentcamarche.html s3://landing-vinify-test
	s3cmd sync --add-header=Cache-Control:max-age=0 dist/experience.html s3://landing-vinify-test
	s3cmd sync dist/assets s3://landing-vinify-test
grunt:
	grunt watch

grunt-dev:
	grunt --dev