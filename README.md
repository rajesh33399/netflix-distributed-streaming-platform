# 🎬 Netflix-Inspired Distributed Video Streaming Platform

A scalable, microservices-based video streaming platform inspired by Netflix that enables video upload, automated HLS encoding, adaptive bitrate streaming, and secure content delivery. The platform follows a distributed, event-driven architecture using Spring Boot microservices, Apache Kafka, Redis, AWS S3, Docker, and FFmpeg.

---

## 🚀 Features

- 🎥 Upload and manage video content
- ⚡ Event-driven communication using Apache Kafka
- 🎞️ Automatic video transcoding with FFmpeg
- 📺 Adaptive HLS streaming (1080p, 720p, 480p, 360p)
- ☁️ Secure video storage using AWS S3
- 🚀 High-performance caching with Redis
- 🗄️ Persistent data storage using MySQL
- 🐳 Dockerized microservices using Docker Compose
- 🌐 Netflix-inspired frontend built with HTML, CSS, Vanilla JavaScript, and HLS.js
- 🔗 RESTful APIs for content management and adaptive video streaming

---

# 🏗️ System Architecture

```text
                      Frontend
       (HTML + CSS + JavaScript + HLS.js)
                          │
                     REST APIs
                          │
                 Streaming Service
                          │
              ┌───────────┴────────────┐
              │                        │
      Content Service          Video Service
              │                        │
              └───────────┬────────────┘
                          │
                   Apache Kafka
                          │
                 Encoding Service
                          │
                  FFmpeg (HLS Encoding)
                          │
                       AWS S3
                          │
                 MySQL + Redis Cache
```

---

# 🛠️ Tech Stack

## Backend
- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- REST APIs
- Maven

## Distributed Systems
- Apache Kafka
- Redis

## Database
- MySQL

## Cloud Storage
- AWS S3

## Video Processing
- FFmpeg
- HLS Streaming

## Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- HLS.js

## DevOps
- Docker
- Docker Compose

---

# 📦 Microservices

## 📁 Content Service

Responsible for managing movie metadata.

**Responsibilities**
- Add, update and delete movies
- Store movie metadata in MySQL
- Expose REST APIs for movie management

---

## 🎥 Video Service

Handles video uploads.

**Responsibilities**
- Upload MP4 videos
- Store original videos in AWS S3
- Publish `VideoUploadedEvent` to Apache Kafka

---

## ⚙️ Encoding Service

Processes uploaded videos.

**Responsibilities**
- Consume Kafka events
- Encode videos using FFmpeg
- Generate adaptive HLS playlists
- Create 1080p, 720p, 480p and 360p video streams
- Upload encoded videos to AWS S3
- Publish `VideoEncodedEvent`

---

## ▶️ Streaming Service

Provides secure video streaming.

**Responsibilities**
- Generate signed streaming URLs
- Stream HLS playlists
- Cache movie metadata using Redis
- Deliver adaptive bitrate streaming

---

# 📺 Adaptive Streaming

Every uploaded video is automatically converted into four HLS resolutions:

- 1080p
- 720p
- 480p
- 360p

The HLS player automatically switches to the best quality depending on the user's network speed.

---

# 📋 Prerequisites

Before running this project, make sure you have:

- ✅ Java 17
- ✅ Maven
- ✅ Docker & Docker Compose
- ✅ FFmpeg
- ✅ AWS Account
- ✅ AWS S3 Bucket

---

# 🎬 Install FFmpeg

### Windows

```bash
winget install ffmpeg
```

### macOS

```bash
brew install ffmpeg
```

### Ubuntu

```bash
sudo apt install ffmpeg
```

Verify the installation:

```bash
ffmpeg -version
```

---

# ☁️ AWS S3 Setup

## Step 1: Create an S3 Bucket

- Open AWS Console
- Navigate to **S3**
- Click **Create Bucket**
- Example bucket name:

```
netflix-streaming-videos
```

Choose your preferred AWS region.

---

## Step 2: Configure Bucket Permissions

Configure the bucket permissions according to your project requirements.

---

## Step 3: Create an IAM User

- Go to **IAM → Users**
- Create a new user

Example:

```
netflix-app-user
```

Assign S3 permissions and create an Access Key.

Save:

- Access Key ID
- Secret Access Key

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/your-username/netflix-inspired-streaming-platform.git

cd netflix-inspired-streaming-platform
```

---

## Configure AWS Credentials

Update the following services:

- video-service
- encoding-service
- streaming-service

`application.yml`

```yaml
aws:
  access-key: YOUR_ACCESS_KEY
  secret-key: YOUR_SECRET_KEY
  region: YOUR_REGION
  s3:
    bucket-name: YOUR_BUCKET_NAME
```

---

## Start Infrastructure

```bash
docker compose up -d
```

This starts:

- MySQL
- Redis
- Apache Kafka
- Zookeeper

Wait about **30 seconds** for Kafka to initialize.

---

## Start All Microservices

### Terminal 1

```bash
cd content-service
mvn spring-boot:run
```

### Terminal 2

```bash
cd video-service
mvn spring-boot:run
```

### Terminal 3

```bash
cd encoding-service
mvn spring-boot:run
```

### Terminal 4

```bash
cd streaming-service
mvn spring-boot:run
```

---

# 🧪 Testing Flow

## Step 1: Add a Movie

**POST**

```
http://localhost:8081/api/v1/movies
```

```json
{
  "title": "Pulp Fiction",
  "description": "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
  "genre": "CRIME",
  "director": "Quentin Tarantino",
  "cast": "John Travolta, Uma Thurman, Samuel L. Jackson",
  "releaseYear": 1994,
  "rating": 8.9,
  "durationMinutes": 154
}
```

Copy the generated **movieId**.

---

## Step 2: Upload Video

**POST**

```
http://localhost:8082/api/v1/videos/upload/{movieId}
```

Upload any MP4 file using **multipart/form-data**.

---

## Step 3: Monitor Encoding Logs

```text
Consumed VideoUploadedEvent
Running FFmpeg for 1080p...
Encoded 1080p successfully
Running FFmpeg for 720p...
Encoded 720p successfully
Running FFmpeg for 480p...
Encoded 480p successfully
Running FFmpeg for 360p...
Encoded 360p successfully
Master playlist generated
All encoded files uploaded to S3
VideoEncodedEvent published
```

---

## Step 4: Verify Movie Status

**GET**

```
http://localhost:8081/api/v1/movies/{movieId}
```

Expected response:

```json
{
  "videoStatus": "READY",
  "hlsUrl": "https://your-bucket.s3.region.amazonaws.com/encoded/movieId/master.m3u8"
}
```

---

## Step 5: Generate Streaming URL

**GET**

```
http://localhost:8084/api/v1/stream/{movieId}
```

Expected response:

```json
{
  "movieId": "xxx",
  "streamingUrl": "https://your-bucket.s3.amazonaws.com/...",
  "quality": "1080p, 720p, 480p, 360p",
  "expiresInMinutes": 60
}
```

---

## Step 6: Play Video

1. Open **netflix-player.html**
2. Enter the Movie ID
3. Click **Play**
4. Enjoy adaptive HLS video streaming.

---

# 📂 Project Structure

```text
netflix-inspired-streaming-platform/
│
├── content-service/          # Movie metadata management
├── video-service/            # Video upload to AWS S3 & Kafka event publishing
├── encoding-service/         # FFmpeg-based HLS encoding (1080p, 720p, 480p, 360p)
├── streaming-service/        # Secure streaming, signed URLs & Redis caching
├── frontend/
│   └── netflix-player.html   # Netflix-inspired HLS video player
├── docker-compose.yml        # MySQL, Redis, Kafka & Zookeeper
└── README.md
```

---

# 🔌 REST APIs

## Content Service

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/movies` | Get all movies |
| GET | `/api/v1/movies/{id}` | Get movie by ID |
| POST | `/api/v1/movies` | Add a movie |
| PUT | `/api/v1/movies/{id}` | Update movie |
| DELETE | `/api/v1/movies/{id}` | Delete movie |

---

## Video Service

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/videos/upload/{movieId}` | Upload video |

---

## Streaming Service

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/stream/{movieId}` | Generate streaming URL |
| GET | `/api/v1/stream/{movieId}/playlist` | Stream HLS playlist |

---

# 💡 Key Highlights

- Distributed Microservices Architecture
- Event-Driven Communication using Apache Kafka
- Adaptive HLS Video Streaming
- FFmpeg Video Transcoding
- Secure AWS S3 Integration
- Redis Caching
- Dockerized Deployment
- Netflix-inspired Frontend
- RESTful APIs
- Scalable and Modular Design

---

# 👨‍💻 Author

**Rajesh Botla**

📧 Email: **rajeshbotla4@gmail.com**

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub!
