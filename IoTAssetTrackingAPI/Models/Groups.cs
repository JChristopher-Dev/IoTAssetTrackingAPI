using System.Collections.Generic;

namespace IoTAssetTrackingAPI.Models
{
    public class Group
    {
        public int GroupID { get; set; }
        public string Name { get; set; }
        public int? ParentGroupID { get; set; }

        public Group? ParentGroup { get; set; }              
        public ICollection<Group> ChildGroups { get; set; } = new List<Group>(); 
    }
}