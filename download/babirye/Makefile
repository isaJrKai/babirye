.PHONY: help deploy activate-forensic deactivate-forensic activate-offensive deactivate-offensive activate-defensive deactivate-defensive activate-micro-defensive deactivate-micro-defensive activate-sensors deactivate-sensors activate-vip deactivate-vip wipe status

help:
	@echo "BABIRYE v10.0.0 Titanium Ultra + VIP Protection"
	@echo "  make deploy                     - Start all core services"
	@echo "  make activate-forensic          - Activate forensic subsystem"
	@echo "  make deactivate-forensic        - Deactivate & wipe forensic"
	@echo "  make activate-offensive         - Activate offensive subsystem"
	@echo "  make deactivate-offensive       - Deactivate & wipe offensive"
	@echo "  make activate-defensive         - Activate defensive subsystem"
	@echo "  make deactivate-defensive       - Deactivate & wipe defensive"
	@echo "  make activate-micro-defensive    - Activate micro-defensive subsystem"
	@echo "  make deactivate-micro-defensive  - Deactivate & wipe micro-defensive"
	@echo "  make activate-sensors            - Activate sensors & weapons"
	@echo "  make deactivate-sensors          - Deactivate sensors"
	@echo "  make activate-vip                - Activate VIP protection"
	@echo "  make deactivate-vip              - Deactivate VIP protection"
	@echo "  make wipe                        - Wipe ALL data"
	@echo "  make status                      - Show service status"

deploy:
	./deploy.sh
activate-forensic:
	./activate_forensic.sh
deactivate-forensic:
	./deactivate_forensic.sh
activate-offensive:
	./activate_offensive.sh
deactivate-offensive:
	./deactivate_offensive.sh
activate-defensive:
	./activate_defensive.sh
deactivate-defensive:
	./deactivate_defensive.sh
activate-micro-defensive:
	./activate_micro_defensive.sh
deactivate-micro-defensive:
	./deactivate_micro_defensive.sh
activate-sensors:
	./activate_sensors.sh
deactivate-sensors:
	./deactivate_sensors.sh
activate-vip:
	./activate_vip.sh
deactivate-vip:
	./deactivate_vip.sh
wipe:
	docker compose down -v
	for f in forensic offensive defensive micro_defensive sensors vip; do docker compose -f docker-compose.$$f.yml down -v; done
	rm -rf data/*
status:
	docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep babirye-
