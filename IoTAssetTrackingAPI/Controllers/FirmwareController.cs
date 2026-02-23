using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTAssetTrackingAPI.Data;
using IoTAssetTrackingAPI.Models;

namespace IoTAssetTrackingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FirmwareController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FirmwareController(AppDbContext context) => _context = context;

        // GET: api/firmware
        [HttpGet]
        public async Task<IActionResult> GetFirmware()
        {
            var firmware = await _context.Firmwares
                .Include(f => f.DeviceType)
                .ToListAsync();
            return Ok(firmware);
        }

        // POST: api/firmware
        [HttpPost]
        public async Task<IActionResult> AddFirmware(Firmware firmware)
        {
            _context.Firmwares.Add(firmware);
            await _context.SaveChangesAsync();
            return Ok(firmware);
        }

        // PUT: api/firmware/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFirmware(int id, Firmware firmware)
        {
            if (id != firmware.FirmwareID)
                return BadRequest("ID mismatch.");

            var existing = await _context.Firmwares.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.DeviceTypeID = firmware.DeviceTypeID;
            existing.Version      = firmware.Version;
            existing.ReleaseDate  = firmware.ReleaseDate;
            existing.Description  = firmware.Description;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/firmware/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFirmware(int id)
        {
            var firmware = await _context.Firmwares.FindAsync(id);
            if (firmware == null)
                return NotFound();

            // Check if any device is still using this firmware
            bool inUse = await _context.Devices.AnyAsync(d => d.FirmwareID == id);
            if (inUse)
                return Conflict("Firmware is still assigned to one or more devices.");

            _context.Firmwares.Remove(firmware);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
