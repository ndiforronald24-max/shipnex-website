namespace ShipNex.Domain.Enums;

public enum ShipmentStatus
{
    ShipmentCreated,
    PickedUp,
    AtOriginFacility,
    ExportCustoms,
    DepartedOrigin,
    InTransit,
    ArrivedAtDestination,
    ImportCustoms,
    AtDestinationFacility,
    OutForDelivery,
    Delivered,
    Delayed,
    Exception,
    Cancelled
}

public enum ShipmentType
{
    Standard,
    Express,
    AirFreight,
    SeaFreight,
    RoadFreight,
    VehicleShipping,
    PetTransport
}

public enum ServiceType
{
    Standard,
    Express,
    Priority,
    Economy
}

public enum PetType
{
    Dog,
    Cat,
    Bird,
    Rabbit,
    Reptile,
    Other
}

public enum NotificationType
{
    ShipmentStatusUpdate,
    DeliveryConfirmation,
    ExceptionAlert,
    PetCareUpdate,
    SystemNotification
}

public enum NotificationChannel
{
    Email,
    Sms,
    Push
}

public enum AuditActionType
{
    Create,
    Update,
    Delete,
    StatusChange,
    Login,
    Logout,
    Manual
}

public enum VehicleType
{
    Truck,
    Van,
    ContainerTruck,
    AirCargo,
    CargoShip,
    Trailer
}

// Specialized statuses for pet shipments
public enum PetJourneyStatus
{
    Registered,
    DocumentationChecked,
    VeterinaryCheck,
    PickedUp,
    TransportStarted,
    InTransit,
    DestinationArrived,
    Inspection,
    ReadyForDelivery,
    Delivered
}

// Types of care events for pets
public enum PetCareEventType
{
    Food,
    Water,
    ComfortCheck,
    HealthCheck,
    TemperatureCheck,
    RestPeriod,
    VeterinaryCheck
}

// Statuses for care events
public enum PetCareEventStatus
{
    Completed,
    Pending,
    AttentionRequired
}