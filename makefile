.PHONY: rebuild-question rebuild-user rebuild-all

rebuild-question-no-cache:
	docker compose -f services/question-service/compose.yaml down
	docker compose -f services/question-service/compose.yaml build --no-cache
	docker compose -f services/question-service/compose.yaml up

rebuild-question:
	docker compose -f services/question-service/compose.yaml down
	docker compose -f services/question-service/compose.yaml build
	docker compose -f services/question-service/compose.yaml up

rebuild-user:
	docker compose -f services/user-service/compose.yaml down
	docker compose -f services/user-service/compose.yaml build --no-cache
	docker compose -f services/user-service/compose.yaml up

rebuild-all:
	$(MAKE) rebuild-question
	$(MAKE) rebuild-user