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
RUN mkdir -p /app/uploads
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1
ENTRYPOINT ["dotnet", "ShipNex.Api.dll"]
