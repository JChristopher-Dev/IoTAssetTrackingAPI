
﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTAssetTrackingAPI.Data;
using IoTAssetTrackingAPI.Models;

namespace IoTAssetTrackingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevicesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DevicesController(AppDbContext context) => _context = context;

        // GET: api/devices
        [HttpGet]
        public async Task<IActionResult> GetDevices()
        {
            var devices = await _context.Devices
                .Include(d => d.Firmware)
                .Include(d => d.DeviceType)
                .ToListAsync();
            return Ok(devices);
        }

        // PUT: api/devices/5/firmware
        [HttpPut("{id}/firmware")]
        public async Task<IActionResult> AssignFirmware(int id, [FromBody] AssignFirmwareRequest request)
        {
            var device = await _context.Devices.FindAsync(id);
            if (device == null)
                return NotFound();

            var firmware = await _context.Firmwares.FindAsync(request.FirmwareID);
            if (firmware == null)
                return BadRequest("Firmware not found.");

            if (firmware.DeviceTypeID != device.DeviceTypeID)
                return BadRequest("Firmware is not compatible with this device type.");

            device.FirmwareID = request.FirmwareID;
            await _context.SaveChangesAsync();
            return Ok(device);
        }
    }

    public class AssignFirmwareRequest
    {
        public int FirmwareID { get; set; }
    }
}