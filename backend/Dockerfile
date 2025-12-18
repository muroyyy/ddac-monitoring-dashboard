# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["MonitoringDashboard.Api/MonitoringDashboard.Api.csproj", "MonitoringDashboard.Api/"]
RUN dotnet restore "MonitoringDashboard.Api/MonitoringDashboard.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/MonitoringDashboard.Api"
RUN dotnet build "MonitoringDashboard.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "MonitoringDashboard.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage - runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "MonitoringDashboard.Api.dll"]