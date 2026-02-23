using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTAssetTrackingAPI.Data;
using IoTAssetTrackingAPI.Models;

namespace IoTAssetTrackingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GroupsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/groups
        [HttpGet]
        public async Task<IActionResult> GetGroups()
        {
            var groups = await _context.Groups
                .Include(g => g.ParentGroup)
                .Include(g => g.ChildGroups)
                .ToListAsync();

            return Ok(groups);
        }

        // POST: api/groups
        [HttpPost]
        public async Task<IActionResult> AddGroup(Group group)
        {
            // Validate parent exists if one was supplied
            if (group.ParentGroupID.HasValue)
            {
                bool parentExists = await _context.Groups.AnyAsync(g => g.GroupID == group.ParentGroupID);
                if (!parentExists)
                    return BadRequest("Parent group not found.");
            }

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();
            return Ok(group);
        }

        // PUT: api/groups/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGroup(int id, Group group)
        {
            if (id != group.GroupID)
                return BadRequest("ID mismatch.");

            var existing = await _context.Groups.FindAsync(id);
            if (existing == null)
                return NotFound();

            // Prevent a group being set as its own parent
            if (group.ParentGroupID == id)
                return BadRequest("A group cannot be its own parent.");

            existing.Name          = group.Name;
            existing.ParentGroupID = group.ParentGroupID;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/groups/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(int id)
        {
            var group = await _context.Groups.FindAsync(id);
            if (group == null)
                return NotFound();

            // Prevent deleting a group that still has children
            bool hasChildren = await _context.Groups.AnyAsync(g => g.ParentGroupID == id);
            if (hasChildren)
                return Conflict("Group still has child groups. Remove or reassign them first.");

            // Prevent deleting a group that still has devices linked
            bool hasDevices = await _context.DeviceGroupLinks.AnyAsync(d => d.GroupID == id);
            if (hasDevices)
                return Conflict("Group still has devices linked to it. Unlink them first.");

            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
