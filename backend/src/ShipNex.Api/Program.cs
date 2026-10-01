using System.Net;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using ShipNex.Api;
using ShipNex.Api.Middleware;
using ShipNex.Application.Interfaces;
using ShipNex.Infrastructure.Data;
using ShipNex.Infrastructure.Services;
// .NET 8 introduced System.Net.IPNetwork, which collides with the ASP.NET Core
// type used by ForwardedHeadersOptions. Alias the ASP.NET Core one explicitly.
using AspNetCoreNetwork = Microsoft.AspNetCore.HttpOverrides.IPNetwork;

var builder = WebApplication.CreateBuilder(args);

// ---------- Serilog ----------
try
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("System", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithThreadId()
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File(
            path: "logs/shipnex-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30)
        .WriteTo.File(
            path: "logs/shipnex-errors-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 90,
            restrictedToMinimumLevel: LogEventLevel.Error)
        .CreateLogger();

    builder.Host.UseSerilog();
}
catch (Exception ex)
{
    Console.WriteLine($"Warning: Serilog initialization failed: {ex.Message}");
}

// ---------- Email: production must never run in dev-mode ----------
// SmtpEmailService/ResendEmailService short-circuit when Email:DevMode is true:
// the mail is logged as "[DEV MODE]" and a *successful* result is returned, so the
// notification log is marked Sent while nothing was ever delivered. appsettings.json
// ships DevMode=true for local work, so any environment that forgets to override it
// silently loses all customer email. Fail fast instead of shipping that to clients.
// Only IsProduction() trips this - the integration tests (WebApplicationFactory) run
// with the Development/Staging defaults and must not be blocked by it.
if (builder.Environment.IsProduction() &&
    bool.TryParse(builder.Configuration["Email:DevMode"], out var emailDevMode) && emailDevMode)
{
    throw new InvalidOperationException(
        "Email:DevMode is enabled in Production. Set Email__DevMode=false (see appsettings.Production.json) - " +
        "otherwise every email is logged instead of sent and notifications are recorded as delivered.");
}

// ---------- Services ----------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---------- Forwarded headers (reverse proxy: nginx / docker) ----------
// Behind a proxy every request otherwise appears to originate from the proxy's
// own IP, which collapses the per-IP rate limiter into one shared bucket and
// makes the audit log record the wrong client. Restricted to explicitly trusted
// proxies/networks so a client cannot spoof X-Forwarded-For from the outside.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1; // single proxy hop; prevents header chaining
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();

    foreach (var entry in (builder.Configuration["Proxy:KnownProxies"] ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        if (IPAddress.TryParse(entry, out var ip)) options.KnownProxies.Add(ip);
    }

    foreach (var entry in (builder.Configuration["Proxy:KnownNetworks"] ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        if (AspNetCoreNetwork.TryParse(entry, out var network)) options.KnownNetworks.Add(network);
    }
});

// ---------- Health checks ----------
// The default /health probe only proves the process is alive. A readiness probe
// must also prove the database is reachable, otherwise a container reports
// healthy while Postgres is down and traffic is routed into a broken API.
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ShipNexDbContext>("database", tags: new[] { "ready" });

// ---------- Database: PostgreSQL when configured, InMemory fallback ----------
var dbProvider = builder.Configuration["Database:Provider"] ?? "InMemory";
var connectionString = builder.Configuration["Database:ConnectionString"];

builder.Services.AddDbContext<ShipNexDbContext>(options =>
{
    if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) &&
        !string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("ShipNexDb");
    }
});

// ---------- JWT ----------
var jwtSecret = builder.Configuration["Jwt:SecretKey"];
if (string.IsNullOrWhiteSpace(jwtSecret) && builder.Environment.IsDevelopment())
{
    // Dev-only fallback so the API can start without local secrets. NEVER use in production.
    jwtSecret = "Dev_Only_ShipNex_Secret_Key_Change_Me_0123456789_ABCDEFGH!";
}
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "JWT SecretKey is not configured. Set the Jwt__SecretKey environment variable or the Jwt:SecretKey appsettings value.");
}

builder.Services.AddSingleton(new JwtService(builder.Configuration));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ShipNex",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ShipNexApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

// ---------- Role-based authorization ----------
builder.Services.AddAuthorization(options =>
{
    var roles = new[]
    {
        "SuperAdmin", "OperationsManager", "ShipmentStaff", "PetOperations",
        "CustomerSupport", "Finance", "ReadOnly", "Customer"
    };
    foreach (var role in roles)
    {
        options.AddPolicy(role, policy => policy.RequireRole(role));
    }
    options.AddPolicy("StaffOnly", policy => policy.RequireRole(
        "SuperAdmin", "OperationsManager", "ShipmentStaff", "PetOperations",
        "CustomerSupport", "Finance"));
});

// ---------- Application services ----------
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IPetShipmentService, PetShipmentService>();
builder.Services.AddScoped<ITrackingNumberGenerator, TrackingNumberGenerator>();
builder.Services.AddScoped<IOfficeService, OfficeService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditService, AuditService>();

// ---------- Email & File Storage services ----------
    // Register HttpClient for Resend provider (server-side only — API key never reaches client)
    builder.Services.AddHttpClient<ResendEmailService>();

    // Select email provider based on configuration — key lives only in server config
    var emailProvider = builder.Configuration["Email:Provider"] ?? "Smtp";
    if (emailProvider.Equals("Resend", StringComparison.OrdinalIgnoreCase))
    {
        builder.Services.AddScoped<IEmailService, ResendEmailService>();
    }
    else
    {
        builder.Services.AddScoped<IEmailService, SmtpEmailService>();
    }
    builder.Services.AddScoped<IEmailNotificationService, EmailNotificationService>();

    // ---------- Supabase Realtime ----------
    // Only enabled when Realtime:SupabaseUrl / Realtime:SupabaseAnonKey are configured.
    // Falls back to local storage provider when not configured — tracking still works
    // via normal refresh.
    builder.Services.AddHttpClient<ISupabaseRealtimeService, SupabaseRealtimeService>();

// Select file storage provider. Supabase Storage = private bucket with
// server-minted signed URLs; Local = disk behind the authorized API.
//
// SupabaseFileStorageService validates its own configuration, but it is created
// lazily through AddHttpClient — without the check below a missing key only
// surfaces on the first document upload as a 500, after the container has already
// reported healthy. Production defaults to Supabase (docker-compose.prod.yml and
// appsettings.Production.json), so an unconfigured service key must fail at
// startup the same way a missing JWT secret does.
var fileStorageProvider = builder.Configuration["FileStorage:Provider"] ?? "Local";
if (fileStorageProvider.Equals("Supabase", StringComparison.OrdinalIgnoreCase))
{
    if (string.IsNullOrWhiteSpace(builder.Configuration["FileStorage:SupabaseUrl"]) ||
        string.IsNullOrWhiteSpace(builder.Configuration["FileStorage:SupabaseServiceKey"]))
    {
        throw new InvalidOperationException(
            "FileStorage:Provider is Supabase but FileStorage:SupabaseUrl / FileStorage:SupabaseServiceKey are not configured. " +
            "Set FileStorage__SupabaseUrl and FileStorage__SupabaseServiceKey (SUPABASE_URL and SUPABASE_SERVICE_KEY in .env), " +
            "or set FileStorage__Provider=Local to store documents on the uploads volume.");
    }

    builder.Services.AddHttpClient<IFileStorageService, SupabaseFileStorageService>();
}
else
{
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}

// ---------- CORS ----------
builder.Services.AddCors(options =>
{
    var configuredOrigins = builder.Configuration["Cors:AllowedOrigins"]
        ?.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? Array.Empty<string>();

    // Local frontends used during development (vite dev/preview and the common
    // alternate ports). These are always allowed in Development so that a
    // configured production origin list (Cors:AllowedOrigins) can never lock the
    // local UI out of the API.
    var devOrigins = new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:4173" };
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowFrontend", policy => policy
            .WithOrigins([.. configuredOrigins.Concat(devOrigins).Distinct(StringComparer.OrdinalIgnoreCase)])
            .WithHeaders("Content-Type", "Authorization")
            .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .AllowCredentials());
    }
    else
    {
        // Outside Development there must be an explicit origin list. The old
        // code fell back to devOrigins here, so a Production deploy with no
        // Cors__AllowedOrigins set served a policy allowing ONLY localhost and
        // silently broke the real site. Fail at startup instead: a container that
        // will not serve traffic is obvious, one that 403s every browser request
        // is not.
        if (configuredOrigins.Length == 0)
        {
            throw new InvalidOperationException(
                "Cors:AllowedOrigins is not configured. Set Cors__AllowedOrigins to a semicolon-separated list of " +
                "your public origins (for example https://shipnex.com;https://www.shipnex.com).");
        }

        options.AddPolicy("AllowFrontend", policy => policy
            .WithOrigins([.. configuredOrigins])
            .WithHeaders("Content-Type", "Authorization")
            .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .AllowCredentials());
    }
});

// ---------- Swagger ----------
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ShipNex API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ---------- Apply EF Core migrations (PostgreSQL only) ----------
// Production needs a schema-creation path: previously the API started with an
// empty database and every query failed with 42P01 (relation does not exist).
// This runs before any request is served so the readiness probe never reports
// a reachable database that has no tables.
//
// Two-tier strategy (no new packages required):
//   1. If real migrations exist (ShipNex.Infrastructure/Migrations), apply them
//      with Migrate() — the normal upgrade path.
//   2. If no migrations exist yet (current state — scaffolding requires network
//      access for the EF tooling), fall back to EnsureCreated(), which builds
//      the schema directly from the model. Idempotent: a no-op when tables
//      already exist; Migrate() takes over permanently once migrations land.
//
// Guarded two ways:
//   - Skipped in Development, where InMemory seeding owns the data (the InMemory
//     provider has no relational schema and does not support Migrate()).
//   - Opt-out via Database:MigrateOnStartup=false, so a deployment that applies
//     migrations in a release step (dotnet ef database update) stays in control.
if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) &&
    !string.Equals(app.Configuration["Database:MigrateOnStartup"], "false", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();
        if (db.Database.GetMigrations().Any())
        {
            db.Database.Migrate();
            Log.Information("EF Core migrations applied.");
        }
        else
        {
            db.Database.EnsureCreated();
            Log.Information("No EF Core migrations found; database schema created via EnsureCreated.");
        }
    }
    catch (Exception ex)
    {
        // Fail loudly: starting without a schema only defers the crash to the
        // first request. The readiness probe would otherwise report a database
        // that is reachable but has no tables.
        Log.Fatal(ex, "Failed to prepare the database schema. The API will not start.");
        throw;
    }
}

// ---------- Seed (development In-Memory database only) ----------
if (dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase) && app.Environment.IsDevelopment())
{
    ProgramSeeder.Seed(app);
}

// ---------- Middleware ----------
// Forwarded headers must run FIRST so that everything downstream (rate limiter,
// audit log, generated links) sees the real client IP and https scheme.
app.UseForwardedHeaders();

// Exception handling first to catch all errors
app.UseMiddleware<ExceptionHandlingMiddleware>();

// CORS must run before rate limiting, authentication and static files so browser
// preflight (OPTIONS) requests always receive proper Access-Control-* headers and
// never consume rate-limit budget or get answered by another middleware first.
app.UseCors("AllowFrontend");

// Rate limiting for auth endpoints
app.UseMiddleware<RateLimitMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Liveness: the process is up. The predicate explicitly EXCLUDES the "ready" tag,
// otherwise the default (run everything) would make liveness hit the database and
// a transient DB outage would cause the orchestrator to kill an otherwise healthy
// pod. Only the database probe is tagged "ready".
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = check => !check.Tags.Contains("ready")
});

// Readiness: the process can actually serve traffic. Includes the database
// probe, so a container is only marked ready when Postgres is reachable.
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

// Serve static files from wwwroot (frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

app.Run();

public partial class Program { }
