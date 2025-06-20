# LiftNote

A comprehensive fitness application with Laravel backend and Next.js frontend.

## Features

- User authentication and authorization
- Program management for coaches and clients
- Progress tracking and logging
- Questionnaire system
- Comment system for programs
- Mobile app support

## Architecture

- **Backend**: Laravel 10 with PHP 8.2
- **Frontend**: Next.js 14 with TypeScript
- **Mobile**: React Native
- **Database**: MySQL
- **File Storage**: DigitalOcean Spaces
- **Deployment**: Docker with CI/CD via GitHub Actions

## CI/CD Status

GitHub Actions CI/CD is now configured and ready for deployment.

## Documentation

- [Final Year Project Folder](https://drive.google.com/drive/u/0/folders/1kPP97n1sKqh-LCqieLprnH3BAr7joYo6)

## Project Setup

- Welcome to the LiftNote project! This guide will help you set up the development environment using Docker.

### Prerequisites

- Before you begin, ensure you have the following installed on your machine:
  - Docker
  - Docker Compose
- You can download and install Docker yourself.

### Set Up Commands

- ```git clone git@github.com:Sivtheng/LiftNote.git```
- ```cd LiftNote```
- ```docker-compose up -d```

This command will build and start the following services in the background:

- Frontend: The Next.js frontend (accessible at <http://localhost:3000>)
- Backend: The Laravel backend API (accessible at <http://localhost:8000>)
- Database: MySQL

### Backend set up

- In the container, do ```composer install```
- ```php artisan key:generate```
- copy the key in the output and put in the backend .env yourself if needed but it usually does it automatically.
- ```php artisan migrate --seed```

### Set Up Environment Variables

- Fill in variables in the .env in the root folder.
- More info on Nextjs and Laravel can be found in their own Readme.

### Stop the containers

- ```docker-compose down```
