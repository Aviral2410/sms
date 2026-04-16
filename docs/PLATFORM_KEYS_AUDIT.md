# Platform Secrets & Production Configuration Audit

This document serves as the master audit trail for all external integration keys, infrastructure secrets, and configurable parameters required for the elevateSmart platform.

> [!IMPORTANT]
> All sensitive keys listed here must be managed via **HashiCorp Vault** or **External Secrets Operator**. The Platform UI has been hardened to remove any editing capabilities for these fields.

## 1. Core Infrastructure Secrets
These keys are the backbone of system security and data persistence.

| Secret Key | Source | Production Required? | Current Dev/Local Status |
| :--- | :--- | :--- | :--- |
| `POSTGRES_USER` | Vault/Env | **Yes** | `sms_admin` |
| `POSTGRES_PASSWORD` | Vault | **Yes** | `change-me` |
| `JWT_SECRET_KEY` | Vault | **Yes** | `change_me_...` |
| `INTERNAL_API_KEY` | Vault | **Yes** | `dev-internal-api-key` |
| `PLATFORM_CONFIG_ENCRYPTION` | Vault | **Yes** | `dev-platform-config-...` |
| `BOOTSTRAP_SUPERADMIN_PWD` | Vault | **Yes** | `SuperAdmin@2026!` |
| `GHCR_TOKEN` | Infrastructure | **Yes** | **EMPTY** (Pat required for CD) |

## 2. AI & LLM Provider Keys
Determines the intelligence capabilities of the AI Assistant and Tools.

| Secret Key | Provider | Role | Status |
| :--- | :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI | Primary logic (GPT-4o) | **EMPTY** |
| `GEMINI_API_KEY` | Google | Learning / Fallback | **EMPTY** |
| `ANTHROPIC_API_KEY` | Anthropic | Claude-based reasoning | **EMPTY** |
| `OPENROUTER_API_KEY` | OpenRouter | Aggregated routing | **EMPTY** |
| `OLLAMA_BASE_URL` | Local | Edge execution (Local AI) | `http://ollama:11434` |
| `LLM_PROVIDER` | Setting | Global toggle | `ollama` |

## 3. Payment Gateway Credentials
Required for tenant onboarding and subscription management.

| Secret Key | Provider | Production Required? | Status |
| :--- | :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Razorpay | **Yes** (India) | **EMPTY** |
| `RAZORPAY_KEY_SECRET` | Razorpay | **Yes** (India) | **EMPTY** |
| `STRIPE_SECRET_KEY` | Stripe | **Yes** (Global) | **EMPTY** |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | **Yes** (Global) | **EMPTY** |

## 4. Communication & Messaging Keys
Used for alerts, notifications, and OTP delivery.

| Secret Key | Provider | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `SENDGRID_API_KEY` | SendGrid | Email Delivery | **EMPTY** |
| `TWILIO_ACCOUNT_SID` | Twilio | SMS/WhatsApp | **EMPTY** |
| `TWILIO_AUTH_TOKEN` | Twilio | SMS/WhatsApp | **EMPTY** |

## 5. Non-Sensitive Configurable Keys
These remain adjustable via Helm `values.yaml` or Deployment patches.

- `GATEWAY_BASE_URL`: `http://api-gateway:8080`
- `REDIS_HOST`: `redis`
- `REDIS_PORT`: `6379`
- `OLLAMA_MODEL`: `llama3.2:1b`

## 6. Mutable Platform Settings (UI Safe)
These parameters can be modified by Platform Admins via the **Platform Engine** UI as they do not contain credentials.

- `platformName`: Branding title.
- `contactEmail`: Global support contact.
- `defaultTrialDays`: Onboarding policy.
- `maintenanceMode`: System availability toggle.
- `accentColor`: UI visual theme.
- `glassIntensity`: UI transparency.
- `borderRadius`: UI consistency.

---
*Audit completed on: 2026-04-16*
*Auditor: Antigravity AI Assistant*
