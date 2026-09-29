namespace ShipNex.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = ShipNexRoles.Customer;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public Customer? Customer { get; set; }
}

public static class ShipNexRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string OperationsManager = "OperationsManager";
    public const string ShipmentStaff = "ShipmentStaff";
    public const string PetOperations = "PetOperations";
    public const string CustomerSupport = "CustomerSupport";
    public const string Finance = "Finance";
    public const string ReadOnly = "ReadOnly";
    public const string Customer = "Customer";
}

public static class ShipNexRoleList
{
    public static readonly List<string> AllRoles = new()
    {
        ShipNexRoles.SuperAdmin,
        ShipNexRoles.OperationsManager,
        ShipNexRoles.ShipmentStaff,
        ShipNexRoles.PetOperations,
        ShipNexRoles.CustomerSupport,
        ShipNexRoles.Finance,
        ShipNexRoles.ReadOnly,
        ShipNexRoles.Customer
    };
}