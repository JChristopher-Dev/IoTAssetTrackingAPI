CREATE DATABASE IoTAssetTracking;
GO
USE IoTAssetTracking;
GO

-- Create Tables

-- DeviceType Table
CREATE TABLE DeviceType (
    DeviceTypeID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL
);

-- Firmware Table
CREATE TABLE Firmware (
    FirmwareID INT IDENTITY(1,1) PRIMARY KEY,
    DeviceTypeID INT NOT NULL,
    Version NVARCHAR(50) NOT NULL,
    ReleaseDate DATE NOT NULL,
    Description NVARCHAR(255) NULL,
    FOREIGN KEY (DeviceTypeID) REFERENCES DeviceType(DeviceTypeID)
);

-- Device Table
CREATE TABLE Device (
    DeviceID INT IDENTITY(1,1) PRIMARY KEY,
    DeviceTypeID INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    SerialNumber NVARCHAR(100) UNIQUE NOT NULL,
    FirmwareID INT NOT NULL,
    FOREIGN KEY (DeviceTypeID) REFERENCES DeviceType(DeviceTypeID),
    FOREIGN KEY (FirmwareID) REFERENCES Firmware(FirmwareID)
);

-- Group Table
CREATE TABLE [Group] (
    GroupID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ParentGroupID INT NULL,
    FOREIGN KEY (ParentGroupID) REFERENCES [Group](GroupID)
);

-- Device-Group Link Table
CREATE TABLE DeviceGroupLink (
    DeviceID INT NOT NULL,
    GroupID INT NOT NULL,
    PRIMARY KEY (DeviceID, GroupID),
    FOREIGN KEY (DeviceID) REFERENCES Device(DeviceID),
    FOREIGN KEY (GroupID) REFERENCES [Group](GroupID)
);


-- ── Insert new data ──
INSERT INTO DeviceType (Name, Description) VALUES
('Temperature Sensor', 'Monitors ambient temperature readings'),
('GPS Tracker',        'Tracks real-time asset location'),
('Motion Detector',    'Detects movement in a defined zone'),
('Humidity Sensor',    'Monitors moisture and humidity levels');

INSERT INTO Firmware (DeviceTypeID, Version, ReleaseDate, Description) VALUES
(1, '1.0.0', '2023-01-10', 'Initial release for temperature sensors'),
(1, '1.1.0', '2023-06-15', 'Improved accuracy and power efficiency'),
(1, '1.2.0', '2024-02-01', 'Added remote calibration support'),
(2, '2.0.0', '2023-03-20', 'Initial GPS tracker firmware'),
(2, '2.1.0', '2023-09-10', 'Faster location polling interval'),
(3, '1.0.0', '2023-05-01', 'Initial motion detector firmware'),
(3, '1.0.1', '2023-11-20', 'Fixed false positive trigger bug'),
(4, '1.0.0', '2024-01-05', 'Initial humidity sensor firmware');

INSERT INTO [Group] (Name, ParentGroupID) VALUES
('Head Office',      NULL),
('Warehouse',        NULL),
('Factory',          NULL),
('Floor 1',          2),
('Floor 2',          2),
('Assembly Line A',  3),
('Assembly Line B',  3),
('Server Room',      1),
('Cold Storage',     4);

INSERT INTO Device (Name, SerialNumber, DeviceTypeID, FirmwareID) VALUES
('Temp Sensor 01',    'SN-TS-001', 1, 3),
('Temp Sensor 02',    'SN-TS-002', 1, 3),
('Temp Sensor 03',    'SN-TS-003', 1, 2),
('GPS Tracker 01',    'SN-GP-001', 2, 5),
('GPS Tracker 02',    'SN-GP-002', 2, 4),
('Motion Sensor 01',  'SN-MD-001', 3, 7),
('Motion Sensor 02',  'SN-MD-002', 3, 6),
('Humidity Sensor 01','SN-HM-001', 4, 8);

INSERT INTO DeviceGroupLink (DeviceID, GroupID) VALUES
(1, 9),
(2, 4),
(3, 6),
(4, 1),
(4, 3),
(5, 2),
(6, 8),
(7, 7),
(8, 9);