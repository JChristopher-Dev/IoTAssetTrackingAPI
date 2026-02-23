using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAssetTrackingAPI.Models
{
    public class Firmware
    {
        [Key]
        public int FirmwareID { get; set; }

        [Required]
        public int DeviceTypeID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Version { get; set; }

        [Required]
        public DateTime ReleaseDate { get; set; }

        [MaxLength(255)]
        public string? Description { get; set; }

        [ForeignKey("DeviceTypeID")]
        public DeviceType? DeviceType { get; set; }
    }
}