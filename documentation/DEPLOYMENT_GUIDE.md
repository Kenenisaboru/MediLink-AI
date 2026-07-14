# MediLink AI — Production Deployment Guide

This guide details the process of deploying the MediLink AI platform into a production environment, ensuring high availability, compliance, security, and integration with local payment gateways (Telebirr, Chapa).

---

## 🏗️ Production Architecture Overview

```
                          ┌─────────────────────────┐
                          │    Next.js Frontend     │
                          │   (Deployed on Vercel)  │
                          └────────────┬────────────┘
                                       │ HTTPS / WebSockets
                                       ▼
┌──────────────────┐      ┌─────────────────────────┐      ┌──────────────────┐
│   Let's Encrypt  ├─────►│   Nginx Reverse Proxy   │◄─────┤    Cloudinary    │
│  (SSL Certificates)     │      (Ubuntu VPS)       │      │  (Static Media)  │
└──────────────────┘      └────────────┬────────────┘      └──────────────────┘
                                       │ Proxy Pass
                                       ▼
                          ┌─────────────────────────┐
                          │    Express.js Backend   │
                          │   (Render or AWS EC2)   │
                          └────────────┬────────────┘
                                       ├────────────────────────┐
                                       ▼                        ▼
                          ┌─────────────────────────┐┌─────────────────────────┐
                          │  Supabase / AWS RDS     ││   Redis Cache / Queue   │
                          │  (Managed PostgreSQL)   ││     (Upstash/Redis)     │
                          └─────────────────────────┘└─────────────────────────┘
```

---

## 🗄️ Database Setup (Production PostgreSQL & Redis)

1. **Deploy Managed Database**:
   * Create a PostgreSQL database on a cloud provider like **AWS RDS**, **Supabase**, or **Neon**.
   * Copy the connection string (with pooled endpoints for serverless environments if needed).

2. **Configure Redis Cache**:
   * Deploy a managed Redis instance using **Upstash Redis**, **ElastiCache**, or **Redis Labs**.
   * Acquire the connection URI.

3. **Database Migrations**:
   * Run the production migration tool against the live database from your release pipeline:
     ```bash
     DATABASE_URL="postgresql://<user>:<pass>@<host>:<port>/<db>?sslmode=require" npx prisma migrate deploy --schema=./database/prisma/schema.prisma
     ```

---

## ⚙️ Backend API Deployment

You can deploy the backend Express service using Docker on cloud platforms (AWS EC2, ECS) or serverless container platforms (Render, Railway).

### Option A: Serverless Deploy via Render / Railway
1. Create a new **Web Service** on Render and link your GitHub repository.
2. Select **Docker** as the environment.
3. Specify `docker/backend.Dockerfile` as the Dockerfile path. Set the Build Context to root `.`.
4. Configure the environment variables:
   * `PORT`: `5000`
   * `DATABASE_URL`: `postgresql://<user>:<pass>@<host>/<db>?sslmode=require`
   * `JWT_SECRET`: `highly_secure_random_string`
   * `JWT_REFRESH_SECRET`: `highly_secure_random_string`
   * `GEMINI_API_KEY`: `your_actual_google_gemini_api_key`
   * `NODE_ENV`: `production`

### Option B: VPS Deploy (Ubuntu + Docker)
1. Clone the repository to your server.
2. Set up your `.env` variables.
3. Build the container manually or let Docker Compose handle it:
   ```bash
   docker-compose -f docker-compose.yml up --build -d backend postgres redis
   ```

---

## 🖥️ Frontend Next.js Deployment

Deploy the frontend folder on **Vercel** for optimal Next.js performance, edge caching, and serverless App Router support.

1. Import the project repository into **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Add the following environment variables:
   * `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.et/api`
   * `NEXT_PUBLIC_SOCKET_URL`: `https://api.yourdomain.et`
4. Deploy the application. Vercel automatically configures edge serverless functions and CDN distribution.

---

## 🔏 SSL & Nginx Reverse Proxy Setup (On-Premises / VPS)

Configure Nginx on an Ubuntu VPS to proxy incoming HTTPS requests to the running backend Docker container (port 5000).

1. **Install Nginx & Certbot**:
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

2. **Configure Nginx Site**:
   Create `/etc/nginx/sites-available/medilink` with the following configuration:
   ```nginx
   server {
       server_name api.yourdomain.et;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Enable the configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/medilink /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Install Let's Encrypt SSL Certificate**:
   ```bash
   sudo certbot --nginx -d api.yourdomain.et
   ```

---

## 💳 Real Payment Gateways Configuration

### 1. Chapa Integration
- Register a merchant profile on [Chapa](https://chapa.co).
- Go to Settings -> API Keys and copy the **Public Key** and **Secret Key**.
- Update the payment controller to use Chapa's REST SDK endpoints:
  - Initiate transaction: `https://api.chapa.co/v1/transaction/initialize`
  - Verify webhook signature: Verify the hash of payload sent from Chapa webhook to `/api/payments/callback` using your secret key signature.

### 2. Telebirr Integration
- Request merchant API integrations from Ethio Telecom.
- Update the backend endpoints with:
  - App ID, Merchant Code, and Public/Private keys.
  - Form the base64-encoded encrypted payload parameters (using your RSA private key).
  - Verify telebirr callback signatures using the Ethio Telecom public key.

---

## 🔒 Security Hardening (HIPAA-inspired practices)

* **Data Encryption-at-Rest**: Enable AWS KMS or database-level AES-256 block encryption.
* **CORS policy**: Restrict frontend origins in `backend/src/app.ts` to strictly allow your production domains.
* **Helmet security headers**: Set up custom policy configs preventing Clickjacking, MIME types sniffings, and XSS risks.
* **Audit Logging**: Use logging frameworks like Winston to pipe audit events (login, patient access) directly to CloudWatch or Datadog. Do not log private keys, passwords, or patient medical variables.
