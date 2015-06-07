MODULES = node_modules/.bin
TEST = $(MODULES)/mocha

.PHONY: test coverage watch

test:
	$(TEST)

coverage:
	$(TEST) --require blanket --reporter html-cov

watch:
	$(MODULES)/nodemon -x "$(TEST) --no-exit"
