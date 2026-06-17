# Hazoom OS Documentation

## Overview

Hazoom OS is a web-based application that provides a super intelligence interface. It is composed of a Django backend and a React frontend.

The system is designed to be run locally and integrates with Ollama for AI model support.

## Architecture

The Hazoom OS consists of the following components:

*   **Django Backend**: A Python-based backend that serves the main application logic, APIs, and the admin dashboard.
*   **React Frontend**: A modern user interface built with React that interacts with the backend APIs.
*   **Ollama**: A service for running and managing large language models locally.
*   **Database**: A SQLite database for storing application data.

## Getting Started

To run Hazoom OS, follow these steps:

### Prerequisites

*   Python 3.10+
*   Node.js 18+
*   Ollama (and at least one model downloaded, e.g., `ollama pull phi`)

### Installation and Startup

1.  **Open a terminal** and navigate to the `G:\projects\project` directory.

2.  **Install backend dependencies** (if not already installed):
    ```bash
    pip install -r requirements.txt
    ```

3.  **Install frontend dependencies** (if not already installed):
    ```bash
    cd quantum-goose-app
    npm install
    cd ..
    ```

4.  **Run the startup script**:
    The easiest way to start all services is to use the provided startup script. Open a bash-compatible terminal (like Git Bash) and run:
    ```bash
    ./start_hazoom.sh
    ```
    This script will:
    *  Check for prerequisites.
    *  Start Ollama if it's not running.
    *  Set up the database.
    *  Start the Django backend.
    *  Start the React frontend.

### Manual Startup

If you prefer to start the services manually:

1.  **Start the Django Backend**:
    Open a terminal in `G:\projects\project` and run:
    ```bash
    python manage.py runserver 0.0.0.0:8000
    ```

2.  **Start the React Frontend**:
    Open a second terminal in `G:\projects\project\quantum-goose-app` and run:
    ```bash
    npm run dev -- --host 0.0.0.0
    ```

## Accessing the Application

Once the services are running, you can access the different parts of Hazoom OS:

*   **Main Application (Frontend)**:
    *   URL: `http://localhost:5173`
    *   This is the main user interface for interacting with the Hazoom Super Intelligence.

*   **Backend API**:
    *   URL: `http://localhost:8000`
    *   The backend provides a browsable API and serves the admin dashboard.

*   **Admin Dashboard**:
    *   URL: `http://localhost:8000/admin/`
    *   This is the **Hazoom OS Admin Dashboard**. You will need to create a superuser account to log in.

### Creating an Admin Superuser

To access the admin dashboard, you first need to create a superuser account:

1.  Open a terminal in `G:\projects\project`.
2.  Run the following command:
    ```bash
    python manage.py createsuperuser
    ```
3.  Follow the prompts to create a username, email, and password.

Once created, you can use these credentials to log in to the admin dashboard at `http://localhost:8000/admin/`.

## Integration with Hazoom OS Admin Dashboard

The Hazoom OS Admin Dashboard, accessible at `http://localhost:8000/admin/`, is an integral part of the system. It is the standard Django admin interface, which allows for the management of the application's data models.

Through the dashboard, an administrator can:

*   **Manage Users and Groups**: Control who has access to the system.
*   **View and Manage Application Data**: Inspect and modify the data stored in the database. For example, you can see records related to the AI interactions, user profiles, and other application-specific data.
*   **Monitor System Activity**: The Django admin provides a log of all administrative actions.

The integration is seamless, as the admin dashboard is part of the same backend that serves the main application's API. Any data created or modified through the main application's frontend will be reflected in the admin dashboard in real-time.
