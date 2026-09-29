namespace ShipNex.Infrastructure.Services.Templates;

/// <summary>
/// Provides professional responsive HTML email templates for all notification types.
/// </summary>
public static class EmailTemplateEngine
{
    private static readonly Dictionary<string, EmailTemplate> Templates = new()
    {
        ["ShipmentCreated"] = CreateShipmentTemplate("Shipment Created", "Your shipment has been registered in our system."),
        ["ShipmentPickedUp"] = CreateShipmentTemplate("Shipment Picked Up", "Your shipment has been collected from the sender."),
        ["ShipmentDeparted"] = CreateShipmentTemplate("Shipment Departed", "Your shipment has departed from the origin facility."),
        ["ShipmentInTransit"] = CreateShipmentTemplate("Shipment In Transit", "Your shipment is on its way to the destination."),
        ["CustomsUpdate"] = CreateShipmentTemplate("Customs Update", "Your shipment is being processed by customs."),
        ["ShipmentArrived"] = CreateShipmentTemplate("Shipment Arrived", "Your shipment has arrived at the destination facility."),
        ["OutForDelivery"] = CreateShipmentTemplate("Out for Delivery", "Your shipment is out for delivery today."),
        ["Delivered"] = CreateShipmentTemplate("Delivered", "Your shipment has been delivered successfully."),
        ["Delayed"] = CreateShipmentTemplate("Shipment Delayed", "Your shipment has been delayed. We apologize for the inconvenience."),
        ["Exception"] = CreateShipmentTemplate("Shipment Exception", "There is an issue with your shipment. Our team is investigating."),
        ["PetRegistered"] = CreatePetTemplate("Pet Shipment Registered", "Your pet's transport has been registered in our system."),
        ["PetJourneyStarted"] = CreatePetTemplate("Pet Journey Started", "Your pet's journey has begun!"),
        ["PetInTransit"] = CreatePetTemplate("Pet In Transit", "Your pet is currently in transit to the destination."),
        ["PetCareUpdate"] = CreatePetTemplate("Pet Care Update", "We have a care update about your pet."),
        ["PetArrived"] = CreatePetTemplate("Pet Arrived", "Your pet has arrived at the destination!"),
        ["PetDelivered"] = CreatePetTemplate("Pet Delivered", "Your pet has been safely delivered!"),
    };

    public static EmailTemplate GetTemplate(string name)
    {
        return Templates.TryGetValue(name, out var template)
            ? template
            : CreateShipmentTemplate("ShipNex Notification", "{{Message}}");
    }

    private static EmailTemplate CreateShipmentTemplate(string subject, string statusMessage)
    {
        return new EmailTemplate
        {
            Subject = subject,
            HtmlBody = GetShipmentHtml(subject, statusMessage),
            TextBody = GetShipmentText(subject, statusMessage)
        };
    }

    private static EmailTemplate CreatePetTemplate(string subject, string statusMessage)
    {
        return new EmailTemplate
        {
            Subject = subject,
            HtmlBody = GetPetHtml(subject, statusMessage),
            TextBody = GetPetText(subject, statusMessage)
        };
    }

    private static string GetShipmentHtml(string subject, string statusMessage) =>
        $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{subject} - ShipNex</title>
</head>
<body style=""margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"">
    <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background-color:#f4f6f9"">
        <tr>
            <td align=""center"" style=""padding:20px 10px"">
                <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""600"" style=""max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)"">
                    <tr>
                        <td style=""background:linear-gradient(135deg,#1a237e,#283593);padding:30px 40px;text-align:center"">
                            <h1 style=""color:#ffffff;margin:0;font-size:28px;font-weight:700"">ShipNex</h1>
                            <p style=""color:#9fa8da;margin:5px 0 0;font-size:14px"">Logistics &amp; Transport Solutions</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""background-color:#fff3e0;padding:20px 40px;text-align:center;border-bottom:2px solid #ff6f00"">
                            <h2 style=""color:#e65100;margin:0;font-size:22px;font-weight:600"">{subject}</h2>
                            <p style=""color:#bf360c;margin:8px 0 0;font-size:15px"">{statusMessage}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:30px 40px"">
                            <p style=""color:#37474f;font-size:16px;margin:0 0 20px"">Dear {{{{CustomerName}}}},</p>
                            <p style=""color:#546e7a;font-size:15px;line-height:1.6;margin:0 0 25px"">{statusMessage}</p>
                            <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background-color:#f8f9fa;border-radius:8px;margin-bottom:25px"">
                                <tr>
                                    <td style=""padding:20px"">
                                        <p style=""margin:0 0 8px;font-size:13px;color:#78909c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px"">Tracking Number</p>
                                        <p style=""margin:0 0 15px;font-size:18px;color:#1a237e;font-weight:700"">{{{{TrackingNumber}}}}</p>
                                        <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"">
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Status:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Status}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Origin:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Origin}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Destination:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Destination}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0""><span style=""color:#78909c;font-size:13px"">Estimated Delivery:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{EstimatedDelivery}}}}</span></td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""margin-bottom:25px"">
                                <tr><td align=""center""><a href=""{{{{TrackingUrl}}}}"" style=""display:inline-block;padding:14px 40px;background-color:#ff6f00;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600"">Track Shipment</a></td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:20px 40px;background-color:#fafafa;border-top:1px solid #eceff1"">
                            <p style=""color:#78909c;font-size:13px;margin:0 0 8px"">Need help? Contact our support team:</p>
                            <p style=""color:#546e7a;font-size:13px;margin:0"">Email: <a href=""mailto:support@shipnex.com"" style=""color:#1a237e"">support@shipnex.com</a> | Phone: +1 (800) SHIP-NEX</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:20px 40px;background-color:#1a237e;text-align:center"">
                            <p style=""color:#9fa8da;font-size:12px;margin:0 0 5px"">&copy; {{{{Year}}}} ShipNex Logistics. All rights reserved.</p>
                            <p style=""color:#7986cb;font-size:11px;margin:0"">123 Logistics Way, Global City, GC 10001</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

    private static string GetShipmentText(string subject, string statusMessage) =>
        $@"Dear {{{{CustomerName}}}},

{subject}
{statusMessage}

Tracking Number: {{{{TrackingNumber}}}}
Status: {{{{Status}}}}
Origin: {{{{Origin}}}}
Destination: {{{{Destination}}}}
Estimated Delivery: {{{{EstimatedDelivery}}}}

Track your shipment: {{{{TrackingUrl}}}}

Need help? Contact support@shipnex.com or call +1 (800) SHIP-NEX

&copy; {{{{Year}}}} ShipNex Logistics. All rights reserved.";

    private static string GetPetHtml(string subject, string statusMessage) =>
        $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{subject} - ShipNex Pet Transport</title>
</head>
<body style=""margin:0;padding:0;background-color:#fdf6f0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"">
    <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background-color:#fdf6f0"">
        <tr>
            <td align=""center"" style=""padding:20px 10px"">
                <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""600"" style=""max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)"">
                    <tr>
                        <td style=""background:linear-gradient(135deg,#4a148c,#6a1b9a);padding:30px 40px;text-align:center"">
                            <h1 style=""color:#ffffff;margin:0;font-size:28px;font-weight:700"">🐾 ShipNex Pet Transport</h1>
                            <p style=""color:#ce93d8;margin:5px 0 0;font-size:14px"">Safe &amp; Compassionate Pet Relocation</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""background-color:#f3e5f5;padding:20px 40px;text-align:center;border-bottom:2px solid #7b1fa2"">
                            <h2 style=""color:#4a148c;margin:0;font-size:22px;font-weight:600"">{subject}</h2>
                            <p style=""color:#6a1b9a;margin:8px 0 0;font-size:15px"">{statusMessage}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:30px 40px"">
                            <p style=""color:#37474f;font-size:16px;margin:0 0 20px"">Dear {{{{CustomerName}}}},</p>
                            <p style=""color:#546e7a;font-size:15px;line-height:1.6;margin:0 0 25px"">{statusMessage}</p>
                            <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background-color:#f8f9fa;border-radius:8px;margin-bottom:25px"">
                                <tr>
                                    <td style=""padding:20px"">
                                        <p style=""margin:0 0 8px;font-size:13px;color:#78909c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px"">Pet Tracking Number</p>
                                        <p style=""margin:0 0 15px;font-size:18px;color:#4a148c;font-weight:700"">{{{{TrackingNumber}}}}</p>
                                        <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"">
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Pet Name:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{PetName}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Journey Status:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Status}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Origin:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Origin}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0;border-bottom:1px solid #eceff1""><span style=""color:#78909c;font-size:13px"">Destination:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{Destination}}}}</span></td></tr>
                                            <tr><td style=""padding:8px 0""><span style=""color:#78909c;font-size:13px"">Estimated Arrival:</span><span style=""color:#37474f;font-size:14px;font-weight:600;margin-left:8px"">{{{{EstimatedDelivery}}}}</span></td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""margin-bottom:25px"">
                                <tr><td align=""center""><a href=""{{{{TrackingUrl}}}}"" style=""display:inline-block;padding:14px 40px;background-color:#7b1fa2;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600"">Track Your Pet</a></td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:20px 40px;background-color:#fafafa;border-top:1px solid #eceff1"">
                            <p style=""color:#78909c;font-size:13px;margin:0 0 8px"">Questions about your pet's journey?</p>
                            <p style=""color:#546e7a;font-size:13px;margin:0"">Email: <a href=""mailto:pets@shipnex.com"" style=""color:#4a148c"">pets@shipnex.com</a> | Phone: +1 (800) PET-SHIP</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:20px 40px;background-color:#4a148c;text-align:center"">
                            <p style=""color:#ce93d8;font-size:12px;margin:0 0 5px"">&copy; {{{{Year}}}} ShipNex Pet Transport. All rights reserved.</p>
                            <p style=""color:#ba68c8;font-size:11px;margin:0"">Caring for your pets like our own.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

    private static string GetPetText(string subject, string statusMessage) =>
        $@"Dear {{{{CustomerName}}}},

{subject}
{statusMessage}

Pet Tracking Number: {{{{TrackingNumber}}}}
Pet Name: {{{{PetName}}}}
Journey Status: {{{{Status}}}}
Origin: {{{{Origin}}}}
Destination: {{{{Destination}}}}
Estimated Arrival: {{{{EstimatedDelivery}}}}

Track your pet: {{{{TrackingUrl}}}}

Questions? Contact pets@shipnex.com or call +1 (800) PET-SHIP

&copy; {{{{Year}}}} ShipNex Pet Transport. All rights reserved.";
}

/// <summary>
/// Represents an email template with HTML and plain text versions.
/// </summary>
public record EmailTemplate
{
    public string Subject { get; init; } = string.Empty;
    public string HtmlBody { get; init; } = string.Empty;
    public string? TextBody { get; init; }
}