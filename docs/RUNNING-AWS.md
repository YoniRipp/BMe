# Running TrackVibe on AWS

How to deploy TrackVibe on Amazon Web Services for production.

> **Comprehensive migration guide:** See [aws-migration-plan.md](aws-migration-plan.md) for the full 8-phase migration plan with detailed resource configs, cost estimates, data migration steps, and cutover procedures.

## Quick Reference

| Component | AWS Service | Key Config |
|-----------|-------------|------------|
| **Frontend** | CloudFront + S3 | `VITE_API_URL` at build time |
| **API** | ECS Fargate + ALB | Port 3000, health check `/health` |
| **Worker** | ECS Fargate | `SEPARATE_WORKERS=true` |
| **Database** | RDS PostgreSQL 16 | `DATABASE_URL` via Secrets Manager |
| **Cache** | ElastiCache Redis | `REDIS_URL=rediss://...` (TLS) |
| **Queues** | SQS | `EVENT_TRANSPORT=sqs`, `EVENT_QUEUE_URL`, `VOICE_QUEUE_URL` |
| **Storage** | S3 | `AWS_S3_BUCKET`, presigned uploads |
| **Auth** | Custom JWT (Cognito optional) | `JWT_SECRET` via Secrets Manager |

## Architecture

See [architecture-target-aws.md](architecture-target-aws.md) for the target architecture diagram.

## Backend Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Secrets Manager | Yes |
| `JWT_SECRET` | Secrets Manager | Yes |
| `REDIS_URL` | ElastiCache endpoint (`rediss://` for TLS) | Yes |
| `GEMINI_API_KEY` | Secrets Manager | Yes |
| `CORS_ORIGIN` | CloudFront domain | Yes |
| `FRONTEND_ORIGIN` | CloudFront domain | Yes |
| `EVENT_TRANSPORT` | `sqs` | Yes (for SQS) |
| `EVENT_QUEUE_URL` | SQS queue URL | Yes (for SQS) |
| `VOICE_QUEUE_URL` | SQS voice queue URL | Yes (for voice) |
| `AWS_REGION` | e.g. `us-east-1` | Yes |
| `AWS_S3_BUCKET` | S3 bucket name | Yes (for uploads) |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `3000` | Yes |
| `SEPARATE_WORKERS` | `true` (for worker task) | Worker only |

All configuration flows through `backend/src/config/index.ts` which validates with Zod at startup.

## Deployment Options

### Option A: ECS Fargate (Recommended)

Full details in [aws-migration-plan.md](aws-migration-plan.md), Phases 4-5.

1. **Build & push** backend image to ECR from `backend/Dockerfile`
2. **Create ECS services**: API (with ALB) + Worker (no LB)
3. **Build frontend**: `VITE_API_URL=https://app.yourdomain.com npm run build`
4. **Deploy frontend**: `aws s3 sync dist/ s3://trackvibe-frontend/ --delete`

### Option B: Amplify (Frontend Only)

1. Connect frontend repo to Amplify
2. Build settings: `frontend/` as root, build command `npm run build`, output `dist`
3. Backend still runs on ECS as above

### Option C: Lightsail (Simplified)

Lower cost alternative using Lightsail Containers. Simpler but less scalable than ECS.

## Pre-Built AWS Integrations

The codebase already supports AWS services — no code changes needed for basic deployment:

| Feature | File | Activated By |
|---------|------|-------------|
| SQS event transport | `backend/src/events/transports/sqs.ts` | `EVENT_TRANSPORT=sqs` |
| SQS voice queue | `backend/src/queue/index.ts` | `VOICE_QUEUE_URL` env var |
| S3 presigned uploads | `backend/src/services/storage.ts` | `AWS_S3_BUCKET` env var |
| Lambda handlers | `backend/lambdas/` | SAM template deploy |
| Health endpoints | `backend/app.ts` | Always active (`/health`, `/ready`) |

## AWS Checklist

- [ ] VPC with public/private subnets ([Phase 1](aws-migration-plan.md#phase-1-aws-account--networking))
- [ ] RDS PostgreSQL + Secrets Manager ([Phase 2](aws-migration-plan.md#phase-2-data-layer-rds-postgresql))
- [ ] ElastiCache Redis ([Phase 3](aws-migration-plan.md#phase-3-cache-layer-elasticache-redis))
- [ ] ECR repository + Docker image ([Phase 4](aws-migration-plan.md#phase-4-container-registry-ecr))
- [ ] ECS services (API + Worker) + ALB ([Phase 5](aws-migration-plan.md#phase-5-compute-ecs-fargate--alb))
- [ ] SQS queues ([Phase 6](aws-migration-plan.md#phase-6-queues-sqs))
- [ ] CloudFront + S3 for frontend ([Phase 7](aws-migration-plan.md#phase-7-frontend--cdn-s3--cloudfront))
- [ ] WAF + CloudWatch + CI/CD ([Phase 8](aws-migration-plan.md#phase-8-security-monitoring--cicd))

## Related Docs

- [aws-migration-plan.md](aws-migration-plan.md) — Full 8-phase migration plan with costs and timelines
- [architecture-target-aws.md](architecture-target-aws.md) — Target architecture diagram
- [scale-harden-aws.md](scale-harden-aws.md) — Short-term hardening (Plan 1) + AWS overview (Plan 2)
- [architecture-current-railway-supabase.md](architecture-current-railway-supabase.md) — Current architecture
