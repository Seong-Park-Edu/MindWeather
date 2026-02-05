# 1. Build Layer
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["MindWeatherServer/MindWeatherServer.csproj", "MindWeatherServer/"]
RUN dotnet restore "MindWeatherServer/MindWeatherServer.csproj"

# Copy everything else and build
COPY MindWeatherServer/ MindWeatherServer/
WORKDIR "/src/MindWeatherServer"
RUN dotnet publish "MindWeatherServer.csproj" -c Release -o /app/publish

# 2. Runtime Layer
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port (Cloud providers usually map this to 80 or 8080)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "MindWeatherServer.dll"]
