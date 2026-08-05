# 🎬 Netflix Streaming Platform — Microservices

> ⚠️ **Recommended:** Watch the full video explanation before running the code — it will make much more sense!
>
> ▶️ **Watch here:** [How Netflix Streams Video to 200 Million Users](https://youtube.com/@YeshendraDhaker)
>
> ⭐ If this helped you, please **star this repo** and **subscribe to the channel!**

---

## 📌 What We Built

A complete **Netflix-like Video Streaming Platform** from scratch — production level code, not a basic tutorial.

```
You upload a video → FFmpeg encodes to 4 qualities automatically
                   → HLS chunks stored on AWS S3
                   → Streaming Service generates secure signed URLs
                   → Custom HLS Player streams the video
```

---

## 🏗️ Architecture

```
Admin adds movie → Content Service → MySQL

Admin uploads video → Video Service → AWS S3
                                         ↓
                              Kafka (video.uploaded)
                                         ↓
                              Encoding Service
                                         ↓
                    FFmpeg → 1080p, 720p, 480p, 360p HLS chunks
                                         ↓
                              Upload encoded files → AWS S3
                                         ↓
                              Kafka (video.encoded)
                                         ↓
                    ┌──────────────────────────────────┐
                    │                                  │
             Content Service                  Streaming Service
          updates HLS URL in MySQL          stores playlist key in Redis
                                                     ↓
User clicks play → Streaming Service → signs every HLS segment
                                     → returns signed master.m3u8
                                     → Custom player streams video ✅
```

---

## 🛠️ Services Overview

| Service | Port | Responsibility |
|---|---|---|
| content-service | 8081 | Movie catalog — add movies, search, genres |
| video-service | 8082 | Upload raw video to AWS S3 + publish Kafka event |
| encoding-service | 8083 | FFmpeg — encode to 4 qualities + generate HLS |
| streaming-service | 8084 | Generate signed URLs + serve HLS playlists |

---

## 🔧 Tech Stack

- **Spring Boot 3.2** — Microservices framework
- **Apache Kafka** — Event streaming between services
- **AWS S3** — Video storage (raw + encoded)
- **FFmpeg** — Video encoding to multiple qualities
- **Redis** — Streaming URL cache
- **MySQL** — Movie catalog storage
- **Docker + Docker Compose** — Infrastructure setup
- **HLS.js** — Custom video player

---

## 📋 Prerequisites

Before running this project make sure you have:

```
✅ Java 17
✅ Maven
✅ Docker Desktop
✅ FFmpeg installed
✅ AWS Account with S3 bucket
```

### Install FFmpeg

**Windows:**
```bash
winget install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

**Verify:**
```bash
ffmpeg -version
```

---

## ⚙️ AWS S3 Setup

### Step 1: Create S3 Bucket
```
AWS Console → S3 → Create Bucket
Name: netflix-streaming-videos
Region: your-region
```

### Step 2: Block Public Access Settings
```
Permissions → Block public access
```

### Step 3: Create IAM User
```
IAM → Users → Create User
Name: netflix-app-user
Policy: AmazonS3FullAccess
Create Access Key → Save both keys
```

---

## 🚀 How To Run

### Step 1: Configure AWS credentials

Update `application.yml` in video-service, encoding-service and streaming-service:

```yaml
aws:
  access-key: YOUR_ACCESS_KEY
  secret-key: YOUR_SECRET_KEY
  region: YOUR_REGION
  s3:
    bucket-name: YOUR_BUCKET_NAME
```

### Step 2: Start Infrastructure
```bash
docker-compose up -d
```

Wait 30 seconds for Kafka to fully initialize.

### Step 3: Start All Services

Open 4 separate terminals:

```bash
# Terminal 1
cd content-service && mvn spring-boot:run

# Terminal 2
cd video-service && mvn spring-boot:run

# Terminal 3
cd encoding-service && mvn spring-boot:run

# Terminal 4
cd streaming-service && mvn spring-boot:run
```

---

## 🧪 Testing Flow

### Step 1: Add a Movie
```
POST http://localhost:8081/api/v1/movies
Content-Type: application/json

{
    "title": "Inception",
    "description": "A mind bending thriller",
    "genre": "SCI_FI",
    "director": "Christopher Nolan",
    "cast": "Leonardo DiCaprio",
    "releaseYear": 2010,
    "rating": 8.8,
    "durationMinutes": 148
}
```

Copy the `id` from response.

### Step 2: Upload Video
```
POST http://localhost:8082/api/v1/videos/upload/{movieId}
Content-Type: multipart/form-data
file: [select any mp4 video]
```

### Step 3: Watch Encoding Service Logs
```
Consumed VideoUploadedEvent for movie: xxx
Running FFmpeg for 1080p...
Encoded 1080p successfully
Running FFmpeg for 720p...
Encoded 720p successfully
Running FFmpeg for 480p...
Encoded 480p successfully
Running FFmpeg for 360p...
Encoded 360p successfully
Master playlist generated
All encoded files uploaded to S3 ✅
VideoEncodedEvent published ✅
```

### Step 4: Check Movie Status
```
GET http://localhost:8081/api/v1/movies/{movieId}
```

Response should show:
```json
{
    "videoStatus": "READY",
    "hlsUrl": "https://your-bucket.s3.region.amazonaws.com/encoded/movieId/master.m3u8"
}
```

### Step 5: Get Streaming URL
```
GET http://localhost:8084/api/v1/stream/{movieId}
```

Response:
```json
{
    "movieId": "xxx",
    "streamingUrl": "https://your-bucket.s3.amazonaws.com/...",
    "quality": "1080p, 720p, 480p, 360p",
    "expiresInMinutes": 60
}
```

### Step 6: Play Video
1. Open `netflix-player.html` in Chrome
2. Enter Movie ID
3. Click Play
4. Video streams in 1080p, 720p, 480p, 360p automatically ✅

---

## 🎬 Custom Netflix Player

We built a custom HLS player that:
- Calls Streaming Service automatically
- Signs every HLS segment individually
- Supports adaptive bitrate — switches quality based on internet speed
- Works with private S3 bucket

> ⚠️ **Important:** Third party HLS players (like hls-js.netlify.app, LiveReacting) will NOT work because they cannot sign individual segment requests. Use our custom `player.html` only.

---

## 📂 Project Structure

```
netflix-streaming-platform/
├── content-service/          → Movie catalog
├── video-service/            → S3 upload + Kafka
├── encoding-service/         → FFmpeg + HLS
├── streaming-service/        → Signed URLs + Redis
├── player.html               → Custom HLS video player
├── docker-compose.yml        → Infrastructure
└── README.md
```

---

## 🔑 Kafka Topics

| Topic | Publisher | Consumer |
|---|---|---|
| video.uploaded | Video Service | Encoding Service, Content Service |
| video.encoded | Encoding Service | Streaming Service, Content Service |

---

## 🔒 Security

- **Private S3 bucket** — videos not publicly accessible
- **Signed URLs** — every HLS segment signed individually
- **URL expiry** — 60 minutes
- **Raw videos** — completely private, only encoded folder accessible

---

## 📱 API Endpoints

### Content Service (8081)
```
POST   /api/v1/movies              → Add movie
GET    /api/v1/movies              → Get all movies
GET    /api/v1/movies/{id}         → Get movie by ID
GET    /api/v1/movies/genre/{genre} → Get by genre
GET    /api/v1/movies/search       → Search by title
```

### Video Service (8082)
```
POST   /api/v1/videos/upload/{movieId} → Upload video
```

### Streaming Service (8084)
```
GET    /api/v1/stream/{movieId}           → Get streaming URL
GET    /api/v1/stream/{movieId}/playlist  → Get signed playlist
```

---

## 🎯 Key Concepts Covered

- ✅ HLS — HTTP Live Streaming
- ✅ FFmpeg video encoding to multiple qualities
- ✅ AWS S3 presigned URLs
- ✅ Adaptive bitrate streaming
- ✅ Kafka event driven architecture
- ✅ Redis caching for streaming URLs
- ✅ Custom HLS proxy — signing every segment

---

## 📚 Full Microservices Series

| Project | Video | Source Code |
|---|---|---|
| Uber Clone | [Watch](https://youtu.be/Cdx4DF9N8d8) | [GitHub](https://github.com/YeshendraDhaker/Uber-App) |
| Netflix Clone | [Watch](https://youtube.com/@YeshendraDhaker) | This repo |
| Banking System | Coming Soon | Coming Soon |

---

## 🤝 Connect

- **YouTube:** [YeshendraDhaker](https://youtube.com/@YeshendraDhaker)
- **GitHub:** [yourusername](https://github.com/yourusername)

> ⭐ Don't forget to **star this repo** and **subscribe** if this helped you!
