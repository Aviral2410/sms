This overlay is the production-leaning starting point for stateless high availability.

It currently adds:
- 2 replicas for all stateless services
- HPA for gateway, auth, school operations, and frontend
- PDBs for core public services
- an ingress example

Before real production use:
- move PostgreSQL to managed HA or a dedicated HA database setup
- move EMQX to clustered HA or managed messaging
- add anti-affinity and topology spread constraints
- connect real TLS certificates and DNS
