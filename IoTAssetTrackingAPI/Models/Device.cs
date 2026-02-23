using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAssetTrackingAPI.Models
{
    public class Device
    {
        public int DeviceID { get; set; }
        public int DeviceTypeID { get; set; }
        public string Name { get; set; }
        public string SerialNumber { get; set; }
        public int FirmwareID { get; set; }

        // Navigation properties
        [ForeignKey("DeviceTypeID")]
        public DeviceType DeviceType { get; set; }

        [ForeignKey("FirmwareID")]
        public Firmware Firmware { get; set; }
    }
}