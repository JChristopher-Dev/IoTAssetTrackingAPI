using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAssetTrackingAPI.Models
{
    public class Firmware
    {
        public int FirmwareID { get; set; }
        public int DeviceTypeID { get; set; }
        public string Version { get; set; }
        public DateTime ReleaseDate { get; set; }
        public string Description { get; set; }

        // Navigation property
        [ForeignKey("DeviceTypeID")]
        public DeviceType DeviceType { get; set; }
    }
}