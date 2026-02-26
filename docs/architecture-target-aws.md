# Target architecture: AWS

After migration (see [scale-harden-aws.md](scale-harden-aws.md)): same app behavior on AWS services.

```mermaid
flowchart TB
  subgraph user [User]
    Browser[Browser]
  end

  subgraph aws [AWS]
    subgraph edge [Edge]
      CF[CloudFront]
      WAF[WAF]
    end
    S3[S3 Static]
    ALB[ALB]
    subgraph compute [Compute]
      ECS_API[ECS API]
      ECS_WORKER[ECS Worker]
    end
    SQS[SQS]
    Redis[ElastiCache Redis]
    RDS[(RDS / Aurora)]
    Cognito[Cognito]
  end

  subgraph external [External]
    Gemini[Gemini API]
  end

  Browser -->|HTTPS| CF
  CF --> S3
  CF --> ALB
  ALB --> WAF
  WAF --> ECS_API
  ECS_API --> Redis
  ECS_API --> RDS
  ECS_API --> Cognito
  ECS_API --> SQS
  SQS --> ECS_WORKER
  ECS_WORKER --> Redis
  ECS_WORKER --> RDS
  ECS_WORKER --> Gemini
```

## Flow summary

- **User** → CloudFront → S3 (static) or ALB (API).
- **ECS API** → RDS, ElastiCache, Cognito, SQS.
- **ECS Worker** consumes SQS, calls Gemini, writes to Redis/RDS.
- Auth via Cognito; queue via SQS (BullMQ/Redis can be phased out).
