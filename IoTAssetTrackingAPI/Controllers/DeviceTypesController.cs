using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTAssetTrackingAPI.Data;
using IoTAssetTrackingAPI.Models;

namespace IoTAssetTrackingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceTypesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DeviceTypesController(AppDbContext context) => _context = context;

        // GET: api/devicetypes
        [HttpGet]
        public async Task<IActionResult> GetDeviceTypes()
        {
            var types = await _context.DeviceTypes.ToListAsync();
            return Ok(types);
        }
    }
}