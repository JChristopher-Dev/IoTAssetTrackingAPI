## IoT Asset Tracking System
A web application for managing IoT devices, firmware versions and hierarchical device groups.
Built with ASP.NET Core and SSMS, with a lightweight HTML/CSS/JS frontend served as static files.

### Features

 - Browse all registered IoT devices and their assigned firmware
 - Add, edit and delete firmware versions per device type
 - Assign firmware to devices directly from the browser
 - Organise devices into a nested group hierarchy
 - Add, edit and delete groups with parent-child relationships

### Technologies Used

 - C# / ASP.NET Core – REST API backend
 - Entity Framework Core – database access and ORM
 - Microsoft SQL Server – relational database
 - HTML / CSS / JavaScript – frontend served as static files

### Database Structure

 - **DeviceType** – defines the types of devices on offer
 - **Firmware** – versioned firmware records scoped to a device type
 - **Device** – individual IoT devices with an assigned firmware version
 - **Group** – self-referencing table allowing unlimited nesting depth
 - **DeviceGroupLink** – many-to-many join between devices and groups

### Getting Started

1. Run the database setup script in SSMS to create and seed the database:
```
database/setup.sql
```
2. Update the connection string in `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=IoTAssetTracking;Trusted_Connection=True;TrustServerCertificate=True;"
}
```
3. Run the application:
```
dotnet run
```
The application will be available at `http://localhost:5093`.

### API Endpoints

 - `GET /api/devices` – get all devices
 - `PUT /api/devices/{id}/firmware` – assign firmware to a device
 - `GET/POST/PUT/DELETE /api/firmware` – manage firmware versions
 - `GET/POST/PUT/DELETE /api/groups` – manage groups
 - `GET /api/devicetypes` – get all device types
