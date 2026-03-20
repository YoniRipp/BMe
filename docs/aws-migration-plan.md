# TrackVibe → AWS: Complete Migration Plan

## Context

TrackVibe (BeMe) currently runs on Railway + Supabase. The goal is to migrate to a full AWS production architecture for better control, scalability, and production-grade infrastructure. The codebase already has significant AWS-readiness: SQS transport, S3 uploads, Lambda handlers, Docker images, and health endpoints — minimizing code changes needed.

**Estimated timeline:** 4-6 weeks for a single engineer.
**Estimated monthly AWS cost:** ~$95/mo (with free tier) to ~$125/mo (without).

---

## Pre-Migration: What's Already Built

| Capability | File | Status |
|---|---|---|
| SQS event transport | `backend/src/events/transports/sqs.ts` | Ready |
| Queue abstraction (BullMQ/SQS) | `backend/src/queue/index.ts` | Ready |
| Lambda event handler | `backend/lambdas/event-handler.ts` | Ready |
| Lambda voice handler | `backend/lambdas/voice-handler.ts` | Ready |
| S3 presigned uploads | `backend/src/services/storage.ts` | Ready |
| SAM template (SQS+Lambda) | `backend/template.yaml` | Ready |
| Config supports SQS | `backend/src/config/index.ts` | Ready |
| Health endpoints | `backend/app.ts` | Ready (`/health`, `/ready`) |
| Multi-stage Dockerfiles | `backend/Dockerfile`, `frontend/Dockerfile` | Ready |

---

## Phase 1: AWS Account & Networking

### Resources

| Resource | Configuration |
|---|---|
| **VPC** | CIDR `10.0.0.0/16` |
| **Public subnets** (2) | `10.0.1.0/24` (AZ-a), `10.0.2.0/24` (AZ-b) — for ALB, NAT |
| **Private subnets** (2) | `10.0.10.0/24` (AZ-a), `10.0.20.0/24` (AZ-b) — for ECS, RDS, Redis |
| **Internet Gateway** | Attached to VPC |
| **NAT Gateway** (1) | In public subnet AZ-a with Elastic IP |
| **Route tables** | Public: `0.0.0.0/0` → IGW; Private: `0.0.0.0/0` → NAT |

### Security Groups

| SG | Inbound | Used By |
|---|---|---|
| `sg-alb` | 80/443 from `0.0.0.0/0` | ALB |
| `sg-ecs` | 3000 from `sg-alb` | ECS tasks |
| `sg-rds` | 5432 from `sg-ecs` | RDS |
| `sg-redis` | 6379 from `sg-ecs` | ElastiCache |

**Cost: ~$35/mo** (NAT Gateway is the main cost)

**Verification:** Launch test EC2 in private subnet, confirm internet access via NAT.

**When to upgrade:** Add second NAT Gateway in AZ-b for HA when you need 99.9%+ uptime (~$64/mo).

---

## Phase 2: Data Layer (RDS PostgreSQL)

### Resources

| Resource | Configuration |
|---|---|
| **RDS PostgreSQL 16** | `db.t3.micro`, 20GB gp3, single-AZ, private subnets |
| **Extensions** | `pgvector`, `pg_trgm`, `uuid-ossp` |
| **Secrets Manager** | `trackvibe/db-url`, `trackvibe/jwt-secret`, `trackvibe/gemini-api-key`, `trackvibe/google-client-id`, `trackvibe/redis-url` |

### Data Migration from Supabase

```bash
# 1. Export from Supabase
pg_dump --no-owner --no-acl --format=custom \
  "postgresql://postgres:<supabase-pass>@<supabase-host>:5432/postgres" \
  > trackvibe_dump.custom

# 2. Enable extensions on RDS
psql -h <rds-endpoint> -U trackvibe -c \
  "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# 3. Import to RDS
pg_restore --no-owner --no-acl --dbname=trackvibe \
  -h <rds-endpoint> -U trackvibe trackvibe_dump.custom

# 4. Run pending migrations
DATABASE_URL=<rds-url> npx node-pg-migrate up
```

### Notes
- DB pool config at `backend/src/db/pool.ts` — keep `DB_SSL_REJECT_UNAUTHORIZED` as default (true), no extra CA needed for RDS on Node 20
- Remove `DB_FORCE_IPV4` if set — RDS endpoints resolve cleanly

**Cost: ~$20/mo** (free tier eligible for 12 months)

**Verification:** Connect from ECS/bastion to RDS, confirm extensions with `SELECT * FROM pg_extension;`, spot-check row counts against Supabase.

**When to upgrade:** `db.t3.small` ($30/mo) or Multi-AZ ($30/mo extra) when you have sustained load.

---

## Phase 3: Cache Layer (ElastiCache Redis)

| Resource | Configuration |
|---|---|
| **ElastiCache Redis 7.x** | `cache.t3.micro`, single node, TLS enabled, private subnets |

**Env var:** `REDIS_URL=rediss://<elasticache-endpoint>:6379` (double-s for TLS)

Redis client at `backend/src/redis/client.ts` handles `rediss://` natively.

**Used by:** rate limiting, voice job results, event bus (before SQS switch), food search cache, idempotency keys.

**Cost: ~$12/mo** (free tier eligible for 12 months)

**Verification:** `redis-cli -h <endpoint> -p 6379 --tls PING`, then check `/ready` endpoint.

---

## Phase 4: Container Registry (ECR)

| Resource | Configuration |
|---|---|
| **ECR: `trackvibe-backend`** | Scan on push, lifecycle: keep last 10 images |
| **ECR: `trackvibe-frontend`** | Optional (only if serving frontend via ECS) |

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t trackvibe-backend ./backend
docker tag trackvibe-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/trackvibe-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/trackvibe-backend:latest
```

Existing `backend/Dockerfile` works as-is (multi-stage Node 20 Alpine).

**Cost: ~$1/mo**

---

## Phase 5: Compute (ECS Fargate + ALB)

### Resources

| Resource | Configuration |
|---|---|
| **ECS Cluster** | `trackvibe-cluster`, Fargate provider |
| **Task Def: API** | 0.25 vCPU, 0.5GB RAM, port 3000 |
| **Task Def: Worker** | 0.25 vCPU, 0.5GB RAM, no port |
| **Service: API** | Desired: 1, ALB target group, health check `/health` |
| **Service: Worker** | Desired: 1, no LB |
| **ALB** | Public subnets, HTTPS listener, ACM cert for `api.yourdomain.com` |
| **IAM: Task Execution Role** | ECR pull, CloudWatch logs, Secrets Manager read |
| **IAM: Task Role** | S3 access, SQS send/receive |

### API Task Environment

```
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
CORS_ORIGIN=https://app.yourdomain.com
FRONTEND_ORIGIN=https://app.yourdomain.com
EVENT_TRANSPORT=sqs
EVENT_QUEUE_URL=<sqs-event-queue-url>
VOICE_QUEUE_URL=<sqs-voice-queue-url>
AWS_S3_BUCKET=trackvibe-uploads
```

Secrets (from Secrets Manager): `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`

### Worker Task
Same image, different command. Set `SEPARATE_WORKERS=true` (supported via `backend/src/config/index.ts`).

### Auto-Scaling

| Service | Min | Max | Metric | Target |
|---|---|---|---|---|
| API | 1 | 4 | CPU | 70% |
| Worker | 1 | 2 | SQS messages visible | 100 |

### Code Changes Needed
**None.** The app already supports `SEPARATE_WORKERS`, health endpoints, and configurable ports.

**Cost: ~$43/mo** (ALB $22 + 2 Fargate tasks $18 + logs $3)

**Verification:** ALB returns 200 on `/health`, `/ready` returns `{ status: "ok" }`, voice processing works end-to-end.

---

## Phase 6: Queues (SQS)

| Resource | Configuration |
|---|---|
| **`trackvibe-event-queue`** | Standard, visibility 60s, retention 14d |
| **`trackvibe-event-queue-dlq`** | maxReceiveCount: 3 |
| **`trackvibe-voice-queue`** | Standard, visibility 120s, retention 14d |
| **`trackvibe-voice-queue-dlq`** | maxReceiveCount: 3 |

These match the existing SAM template at `backend/template.yaml`.

### How It Works (already built)
- `EVENT_TRANSPORT=sqs` → event bus uses `backend/src/events/transports/sqs.ts`
- `VOICE_QUEUE_URL` set → queue abstraction at `backend/src/queue/index.ts` routes to SQS
- Worker long-polls SQS via `ReceiveMessageCommand`

### Code Changes Needed
**None.** Just set the environment variables.

**Cost: ~$0/mo** (well within free tier)

---

## Phase 7: Frontend & CDN (S3 + CloudFront)

| Resource | Configuration |
|---|---|
| **S3: `trackvibe-frontend`** | Private, versioning enabled, OAC for CloudFront |
| **CloudFront Distribution** | Origins: S3 (default) + ALB (`/api/*`) |
| **ACM Certificate** | `app.yourdomain.com` (us-east-1) |
| **Route 53** | `app.yourdomain.com` → CloudFront |

### CloudFront Behaviors

| Path | Origin | Cache |
|---|---|---|
| `*` (default) | S3 | CachingOptimized, 24h TTL |
| `/api/*` | ALB | CachingDisabled, all methods |

### SPA Routing
Custom error responses: 403 → `/index.html` (200), 404 → `/index.html` (200)

### Security Headers
Create CloudFront Response Headers Policy with:
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (required for Google OAuth)
- CSP header matching `frontend/server.cjs`

### Deploy Frontend
```bash
cd frontend
VITE_API_URL=https://app.yourdomain.com npm run build
aws s3 sync dist/ s3://trackvibe-frontend/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Code Changes Needed
**None.** Frontend build uses `VITE_API_URL` set at build time.

**Cost: ~$2/mo**

---

## Phase 8: Security, Monitoring & CI/CD

### WAF (attach to ALB)
- Rate limit: 2000 req/5min per IP
- AWS Managed Rules: CommonRuleSet, KnownBadInputsRuleSet
- Body size rule: block >2MB to `/api/voice/*`

### CloudWatch Alarms

| Alarm | Threshold |
|---|---|
| API High CPU | >80% for 5min |
| ALB 5xx Rate | >10 in 5min |
| DB Connections | >80% of max |
| DB Free Storage | <2GB |
| Redis Memory | >80% of max |
| DLQ Messages | >0 |
| Unhealthy Hosts | >0 for 5min |

### CI/CD — New `deploy.yml` Workflow

Extend existing `.github/workflows/ci.yml` with a deployment workflow:
1. Run existing lint + test + build
2. Configure AWS credentials (OIDC federation for GitHub Actions)
3. Build & push backend image to ECR
4. Build frontend & sync to S3
5. Update ECS service (force new deployment)
6. Invalidate CloudFront
7. Wait for ECS stability

**IAM for GitHub Actions:** ECR push, ECS update, S3 sync, CloudFront invalidation.

**Cost: ~$11/mo** (WAF $6 + CloudWatch $5)

---

## Cutover Plan

1. **24h before:** Lower DNS TTL to 300s
2. **Final sync:** Put Railway in maintenance, run final `pg_dump`/`pg_restore` to RDS
3. **Switch DNS:** `app.yourdomain.com` → CloudFront
4. **Verify:** All functionality, OAuth flows, voice processing, S3 uploads
5. **Monitor:** CloudWatch for 48 hours
6. **Decommission:** Keep Railway stopped for 1 week as rollback, then delete

### Rollback
Switch DNS back to Railway (propagates in TTL seconds). Keep Railway deployable for 1 week.

---

## Total Cost Summary

| Component | Monthly |
|---|---|
| VPC + NAT Gateway | $35 |
| RDS PostgreSQL | $17 (free tier: $0) |
| ElastiCache Redis | $12 (free tier: $0) |
| ECR | $1 |
| ECS Fargate (2 tasks) | $18 |
| ALB | $22 |
| SQS | $0 |
| S3 + CloudFront | $2 |
| WAF | $6 |
| CloudWatch + Secrets Manager | $8 |
| Route 53 | $1 |
| **Total (with free tier)** | **~$95/mo** |
| **Total (without free tier)** | **~$125/mo** |

### Cost Optimization
- **Savings Plans** for Fargate: up to 50% with 1-year commit
- **Reserved Instances** for RDS: up to 40% with 1-year commit
- **VPC Endpoints** for S3/SQS/ECR to reduce NAT data transfer
- **Lambda workers** (already built) instead of ECS worker to save $9/mo at low volume

---

## Essential vs. Deferrable

### Essential (do in order)
1. Phase 1: VPC + Networking
2. Phase 2: RDS + Data Migration
3. Phase 3: ElastiCache Redis
4. Phase 4: ECR
5. Phase 5: ECS + ALB
6. Phase 7: S3 + CloudFront

### Can Defer
- **Phase 6 (SQS):** Can use BullMQ + ElastiCache initially; switch via `EVENT_TRANSPORT` env var later
- **WAF:** Add after initial deployment works
- **CI/CD automation:** Deploy manually via CLI initially
- **Cognito:** Current JWT auth works fine; Cognito is a separate large project
- **RDS Proxy:** Only when connection pooling becomes an issue
- **Lambda workers:** ECS worker is simpler; switch later for cost savings
- **X-Ray tracing:** Add after structured logging is validated

---

## Verification Checklist

After each phase, verify:
- [ ] `/health` returns 200
- [ ] `/ready` returns `{ status: "ok" }` (confirms DB + Redis)
- [ ] User registration and login work
- [ ] OAuth flows (Google) work
- [ ] Food entry creation works
- [ ] Voice processing completes end-to-end
- [ ] S3 image upload via presigned URL works
- [ ] Frontend loads and navigates correctly
- [ ] CloudWatch logs are flowing
- [ ] All alarms are green
