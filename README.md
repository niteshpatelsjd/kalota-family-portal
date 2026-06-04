# Render Worx - Admin Service

Backend REST API service for the Render Worx admin panel. Built with Node.js, Express, MongoDB, Redis, and AWS S3.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| Redis (ioredis) | OTP & session caching |
| AWS S3 | Media file storage |
| JWT | Authentication |
| Multer | File upload handling |
| Nodemailer | Email (OTP, password reset) |
| Swagger UI | API documentation |
| Winston | Logging |
| PM2 | Production process manager |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB instance
- Redis instance
- AWS S3 bucket

### Setup

```bash
cp .env.template.dev .env
# Fill in your environment variables in .env
npm install
npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (development) |
| `npm start` | Start with node |
| `npm run prod` | Start with PM2 (production) |
| `npm run restart` | Restart PM2 process |
| `npm run reload` | Zero-downtime reload via PM2 |
| `npm run stop` | Stop PM2 process |
| `npm run delete` | Delete PM2 process |

---

## Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
PORT=4000
MONGO_URL=mongodb://<user>:<password>@<host>:27017/<dbname>
REDIS_URL=redis://:<password>@<host>:<port>
JWT_SECRET=<your_jwt_secret>
BASE_URL=http://<your_server_ip>
NODE_ENV=development

MAIL_USERNAME=<your_email>
MAIL_PASSWORD=<your_app_password>

FRONTEND_URL=https://<your_frontend_url>

AWS_REGION=<aws_region>
AWS_BUCKET_NAME=<s3_bucket_name>
AWS_ACCESS_KEY_ID=<aws_access_key>
AWS_SECRET_ACCESS_KEY=<aws_secret_key>
```

---

## API Documentation

Swagger UI is available at:

```
http://localhost:4000/admin/docs
```

---

## Project Structure

```
src/
├── config/
│   ├── DBConfig.js          # MongoDB connection
│   ├── RedisConfig.js       # Redis connection
│   └── SwaggerConfig.js     # Swagger setup
├── constants/
│   └── SessionEvents.js
├── controllers/             # Request handlers
├── models/                  # Mongoose schemas
├── repositories/            # DB query layer
├── routes/                  # Express routes + Swagger docs
├── services/                # Business logic
├── utils/
│   ├── FileUtil.js          # AWS S3 file upload
│   ├── JwtUtil.js           # JWT generate/verify
│   ├── DateUtil.js          # Date formatting
│   ├── ResponseBuilder.js   # Response shape builders
│   ├── logger.js            # Winston logger
│   ├── mailUtil.js          # Nodemailer
│   └── response.js          # Standard response wrapper
└── index.js                 # App entry point
```

---

## API Modules

### Auth & Admin Users — `/admin/user`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addAdmin` | Create or update admin user |
| POST | `/login` | Login with email & password |
| GET | `/getProfile/:id` | Get admin profile |
| GET | `/getAllUsers` | Paginated list of users |
| POST | `/blockUnblock` | Activate / deactivate / delete user |
| POST | `/requestOtp` | Send OTP to mobile |
| POST | `/verifyOtp` | Verify OTP and get token |
| POST | `/forgotPasswordOtp` | Send forgot password OTP |
| POST | `/resetPasswordWithOtp` | Reset password using OTP |
| POST | `/forgotPasswordLink` | Send reset password link via email |
| POST | `/resetPasswordUsingLink` | Reset password using link token |
| POST | `/logout` | Logout and close session |

### Dashboard — `/admin/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getDashboard` | Total active counts for Portfolio, Users, Services, Enquiries |

### Portfolio — `/admin/portfolio`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addPortfolio` | Create or update portfolio |
| GET | `/getPortfolio/:id` | Get portfolio by ID |
| GET | `/getAllPortfolios` | Paginated list with filters |
| POST | `/blockUnblock` | Activate / deactivate / delete |
| POST | `/updateFeatured` | Toggle featured flag |

### Blog — `/admin/blog`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addBlog` | Create or update blog |
| GET | `/getBlog/:id` | Get blog by ID |
| GET | `/getAllBlogs` | Paginated list with filters |
| POST | `/blockUnblock` | Activate / deactivate / delete |

### Our Services — `/admin/services`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addService` | Create or update service |
| GET | `/getService/:id` | Get service by ID |
| GET | `/getAllServices` | Paginated list with filters |
| POST | `/blockUnblock` | Activate / deactivate / delete |

### Enquiry — `/admin/enquiry`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addEnquiry` | Submit a new enquiry |
| GET | `/getEnquiry/:id` | Get enquiry by ID |
| GET | `/getAllEnquiries` | Paginated list with filters |
| POST | `/readEnquiry` | Mark enquiry as read / unread |
| POST | `/blockUnblock` | Activate / deactivate / delete |

### About Us — `/admin/about`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getAboutUs` | Get About Us content |
| POST | `/updateAboutUs` | Create or update About Us content |

### Home Banner — `/admin/home`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getHomeBanner` | Get home banner |
| POST | `/updateHomeBanner` | Update home banner media |

### Contact Info — `/admin/contact`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getContactInfo` | Get contact info |
| POST | `/updateContactInfo` | Update contact info |

### Roles — `/admin/role`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addRole` | Create or update role |
| GET | `/getRole/:id` | Get role by ID |
| GET | `/getAllRoles` | Get all roles |
| POST | `/blockUnblock` | Activate / deactivate / delete |

### Modules — `/admin/module`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addModule` | Create or update module |
| GET | `/getAllModules` | Get all modules |

### Location — `/admin/location`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addCountry` | Add country |
| GET | `/getAllCountries` | Get all countries |
| POST | `/addCity` | Add city |
| GET | `/getAllCities` | Get all cities |

### App Content — `/admin/content`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addContent` | Add or update content |
| GET | `/getContent` | Get content by type/lang |

---

## File Uploads (AWS S3)

All media files are uploaded to S3 with folder-based organization:

| Module | S3 Folder |
|---|---|
| Blog | `blog/` |
| Portfolio | `portfolio/` |
| Our Services | `service/` |
| Admin User | `user/` |
| Home Banner | `banner/` |
| About Us | `about/` |
| Others | `general/` |

---

## Health Check

```
GET /health
```

Returns `{ "status": "up" }` when the server is running.
