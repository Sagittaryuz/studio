# **App Name**: JC Fleet Control

## Core Features:

- Vehicle Management: CRUD operations for vehicles including details like plate number, type, current km, and observations.
- Service Management: CRUD operations for maintenance services with parameters like periodicity (months/km) and default supplier.
- Preventive Maintenance Scheduling: Automatic calculation of 'next service date' and 'next km' based on the last service record and service parameters, with the LLM used as a tool for suggesting optimal maintenance schedules.
- Status Monitoring: Real-time monitoring of vehicle service status (OK, ALERT, DUE) based on business rules and color-coded flags.
- Notification System: Automated notifications via email, push, and WhatsApp (through integration) for upcoming and overdue maintenance tasks.
- User Authentication and Roles: Firebase Auth integration with role-based access control (Admin, Operator/Maintenance, Read-only) for managing vehicles and services.
- Reporting and Filtering: Filtering and exporting maintenance reports by category, plate, supplier, date range, and status in CSV/PDF format.

## Style Guidelines:

- Primary color: Deep blue (#003366) evoking professionalism and reliability.
- Background color: Very light gray (#F2F2F2), almost white.
- Accent color: Vivid orange (#FF9933) to highlight alerts and calls to action.
- Body and headline font: 'PT Sans' for a modern yet approachable design.
- Simple, clear icons to represent vehicle categories and maintenance statuses.
- Responsive layout with a fixed sidebar for categories and a grid/line display for vehicle plates, optimized for both desktop and mobile.
- Subtle transitions and animations for status updates and data loading.