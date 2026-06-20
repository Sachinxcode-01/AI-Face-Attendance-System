# Backup & Disaster Recovery Strategy

This document outlines the backup processes, storage retention policies, and step-by-step disaster recovery (DR) protocols for the **SmartFace AI Biometric Attendance System**.

---

## 💾 Backup Strategy

To prevent data loss from hardware failures, database corruption, or security breaches, SmartFace AI uses a tiered backup strategy combining local snapshots with offsite cloud replication.

### 1. Automated MongoDB Backups
*   **Backup Script**: We use the native Python backup utility [db_backup.py](file:///c:/Users/kalin/OneDrive/Documents/Projects/SmartFace-attendance/scripts/db_backup.py) which pulls data from all collections, sanitizes BSON objects, compresses the output using gzip, and packages it into a timestamped `.tar.gz` archive.
*   **Execution Schedule**:
    *   **Daily Backups**: Triggered at 02:00 UTC every night via a cron job or AWS ECS Scheduled Task. Retained locally for 7 days.
    *   **Weekly Backups**: Triggered every Sunday at 03:00 UTC. Retained for 4 weeks.
    *   **Monthly Backups**: Triggered on the 1st of every month at 04:00 UTC. Retained for 12 months.

### 2. S3 Offsite Sync Configuration
Every completed backup is copied from the local storage node to a secure, version-controlled AWS S3 bucket (`smartface-db-backups-prod`) with Object Lock enabled to prevent ransomware tampering.
*   **AWS CLI Sync Command**:
    ```bash
    aws s3 sync backups/ s3://smartface-db-backups-prod/mongodb/ --exclude "*" --include "smartface_backup_*.tar.gz"
    ```

### 3. Database Replication (MongoDB Atlas)
*   For the production environment, MongoDB Atlas is deployed as a **3-node Replica Set** spread across different AWS Availability Zones (AZs). Failover is handled automatically within 5 seconds if the primary node goes offline.

---

## 🚨 Disaster Recovery (DR) Plan

This plan establishes the operational guidelines for restoring services in the event of database corruption, regional cloud outages, or server host crashes.

### 1. DR Parameters
*   **Recovery Point Objective (RPO)**: **< 1 Hour**. (In the worst-case scenario, we lose a maximum of 1 hour of attendance telemetry since backups and sync run incrementally).
*   **Recovery Time Objective (RTO)**: **< 30 Minutes**. (Services must be fully restored and online within 30 minutes of a declared incident).

---

## 🛠️ Step-by-Step Incident Response Procedures

### Scenario A: Database Corruption or Data Loss
In the event of accidental data deletion or database corruption, use the following recovery steps:

#### Step 1: Place Application in Maintenance Mode
1. Update the load balancer to route all traffic to a static maintenance page:
   ```bash
   # Switch ECS Active target group to maintenance TG
   aws elbv2 modify-listener --listener-arn <LISTENER_ARN> --default-actions Type=forward,TargetGroupArn=<MAINTENANCE_TG_ARN>
   ```
2. Stop the API services to prevent write operations during restoration:
   ```bash
   aws ecs update-service --cluster smartface-prod-cluster --service smartface-node-api --desired-count 0
   ```

#### Step 2: Download the Latest Valid Backup
Identify the most recent safe backup archive in S3 and download it:
```bash
aws s3 cp s3://smartface-db-backups-prod/mongodb/smartface_backup_YYYY-MM-DD_HH-MM-SS.tar.gz ./
```

#### Step 3: Run Database Restore
Extract the backup archive and import the JSON files back into MongoDB:
1. Extract the compressed archive:
   ```bash
   tar -xzf smartface_backup_YYYY-MM-DD_HH-MM-SS.tar.gz -C /tmp/restore_db/
   ```
2. Restore collections using `mongoimport`:
   ```bash
   # Example restore script for MongoDB
   for f in /tmp/restore_db/*.json.gz; do
     gunzip -c "$f" | mongoimport --uri="$MONGODB_URL" --collection=$(basename "$f" .json.gz) --drop --jsonArray
   done
   ```

#### Step 4: Re-initialize Database Indexes
To restore query performance, run the seed script to compile indexes:
```bash
python smartface_pro_api/seed_db.py
```

#### Step 5: Start API Services & Remove Maintenance Mode
1. Start the API tasks:
   ```bash
   aws ecs update-service --cluster smartface-prod-cluster --service smartface-node-api --desired-count 2
   ```
2. Verify system health at `/health` and route traffic back to the primary app.

---

### Scenario B: Regional Cloud Outage (AWS Region Offline)
If an entire AWS region goes offline:
1. **DNS Failover**: AWS Route 53 Health Checks automatically detect regional failure and redirect DNS queries to the secondary disaster recovery region (e.g., from `us-east-1` to `us-west-2`).
2. **Cold Standby Deploy**: Trigger the CD pipeline targeting the DR region to deploy Node.js, Python, and Flutter assets.
3. **Database Promotion**: Promote the read replica in the secondary region to primary.

---

## 🔍 Restoration Drills & Verification

> [!IMPORTANT]
> A backup strategy is only as good as its tested recovery. The DevOps team must perform a database restoration rehearsal in the staging environment **every 30 days**.
*   **Verification Checklist**:
    - [ ] Restore database snapshot into the staging DB instance.
    - [ ] Run automated API tests (`run_validation.js`) against the restored instance.
    - [ ] Assert that registration, login, and attendance telemetry match counts prior to backup.
