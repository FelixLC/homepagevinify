deploy:
	grunt bump
	grunt compile
	s3cmd sync dist/. s3://vinify-landing-14

grunt:
	grunt watch

grunt-dev:
	grunt --dev