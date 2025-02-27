# LiftNote

## Documentation

- [Final Year Project Folder](https://drive.google.com/drive/u/0/folders/1kPP97n1sKqh-LCqieLprnH3BAr7joYo6)

## Project Setup

- Welcome to the LiftNote project! This guide will help you set up the development environment using Docker.

### Prerequisites

- Before you begin, ensure you have the following installed on your machine:
  - Docker (for running containers)
  - Docker Compose (for managing multi-container Docker applications)
- You can download and install Docker from here.

### Set Up Commands

- ```git clone git@github.com:Sivtheng/LiftNote.git```
- ```cd LiftNote```
- ```docker-compose up -d```

This command will build and start the following services in the background:

- Frontend: The Next.js frontend (accessible at <http://localhost:3000>)
- Backend: The Laravel backend API (accessible at <http://localhost:8000>)
- Database: MySQL

### Generate the Laravel Application Key

- docker-compose exec backend php artisan key:generate
- This will generate a new APP_KEY and automatically update the .env file inside the Laravel container.

### Set Up Environment Variables

- Fill in variables in the .env in the root folder.
- More info on Nextjs and Laravel can be found in their own Readme.

### Stop the containers

- ```docker-compose down```
