# Schedule Tracker

A Node.js web application for tracking weekly work schedules with iOS-style dark mode design. Features bilingual support, SQLite database, and Docker deployment.

## Features

- **iOS-Style Dark Mode**: Clean, modern interface following iOS design patterns
- **Responsive Design**: Works seamlessly on mobile devices and desktops
- **Bilingual Support**: English (default) and Multi language with auto-detection
- **Weekly Schedule Tracking**: Pre-filled default schedule with actual hours input
- **Overtime/Undertime Tracking**: Cumulative tracking across all weeks
- **SQLite Database**: Persistent data storage (Docker-compatible)
- **Docker Ready**: Full containerization support

## Default Schedule

| Day       | Default Hours |
|-----------|---------------|
| Monday    | Day Off       |
| Tuesday   | Day Off       |
| Wednesday | 11:00 - 17:00 |
| Thursday  | 07:00 - 17:00 |
| Friday    | 07:30 - 17:00 |
| Saturday  | 07:00 - 17:00 |
| Sunday    | Day Off       |

**Base Workweek**: 32 hours

## Login Credentials

- **Username**: `admin`
- **Password**: `admin`

## Running Locally

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/renedis/work-week-tracker.git
cd work-week-tracker

# Install dependencies
npm install

# Start the application
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## Running with Docker

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Using Docker Directly

```bash
# Build the image
docker build -t work-week-tracker .

# Run the container
docker run -d \
  --name work-week-tracker \
  -p 3000:3000 \
  -v work-week-data:/app/data \
  work-week-tracker
```

The application will be available at `http://localhost:3000`

## Project Structure

```
schedule-tracker/
├── server.js           # Express server and routes
├── database.js         # SQLite database operations
├── package.json        # Dependencies and scripts
├── Dockerfile          # Docker container configuration
├── docker-compose.yml  # Docker Compose configuration
├── views/
│   ├── login.ejs       # Login page template
│   └── index.ejs       # Main schedule page template
├── public/
│   └── styles.css      # iOS-style dark mode CSS
└── data/
    └── schedule.db     # SQLite database (auto-created)
```

## Environment Variables

| Variable   | Default       | Description                |
|------------|---------------|----------------------------|
| `PORT`     | `3000`        | Server port                |
| `DATA_DIR` | `./data`      | SQLite database directory  |
| `NODE_ENV` | `development` | Environment mode           |

## GitHub Deployment

1. Create a new repository on GitHub
2. Push the code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/schedule-tracker.git
git push -u origin main
```

3. For automated Docker builds, connect your repository to Docker Hub or GitHub Container Registry

## API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/`                   | Main schedule page             |
| GET    | `/login`              | Login page                     |
| POST   | `/login`              | Process login                  |
| GET    | `/logout`             | Logout user                    |
| POST   | `/api/set-language`   | Set language preference        |
| GET    | `/api/week/:weekStart`| Get week data                  |
| POST   | `/api/week`           | Save week data                 |
| GET    | `/api/cumulative`     | Get cumulative overtime        |

## License

MIT License
