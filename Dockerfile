# ShipNex - Multi-stage Docker build
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/src/ShipNex.Api/ShipNex.Api.csproj", "backend/src/ShipNex.Api/"]
COPY ["backend/src/ShipNex.Application/ShipNex.Application.csproj", "backend/src/ShipNex.Application/"]
COPY ["backend/src/ShipNex.Domain/ShipNex.Domain.csproj", "backend/src/ShipNex.Domain/"]
COPY ["backend/src/ShipNex.Infrastructure/ShipNex.Infrastructure.csproj", "backend/src/ShipNex.Infrastructure/"]

RUN dotnet restore "backend/src/ShipNex.Api/ShipNex.Api.csproj"

COPY backend/src/ backend/src/
WORKDIR "/src/backend/src/ShipNex.Api"
RUN dotnet build "ShipNex.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ShipNex.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
# curl is required by the HEALTHCHECK below; the stock aspnet image does not ship it.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
# Serilog writes logs/shipnex-*.log and the Local file-storage provider writes /app/uploads.
# Both directories are created up front and chowned to the unprivileged user so the
# process never needs root, and so a mounted volume inherits the right ownership.
RUN mkdir -p /app/uploads /app/logs \
    && chown -R app:app /app
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production
# $APP_UID ships with the .NET 8 aspnet images (uid 1654) and is created by the
# `app` user in the base image. Running as root would let a container escape
# become a host-root escape if the runtime were ever compromised.
USER $APP_UID
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1
ENTRYPOINT ["dotnet", "ShipNex.Api.dll"]
