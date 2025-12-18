using Amazon.CloudWatch;
using Amazon.SimpleSystemsManagement;
using MonitoringDashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the containerr
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS for frontendd
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:3000",
                "https://ddac-monitoring-dev-frontend.s3.ap-southeast-5.amazonaws.com",
                "https://ddac-monitoring-dev-frontend.s3-website.ap-southeast-5.amazonaws.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// AWS Services - Uses IAM role attached to EC2 instance
builder.Services.AddAWSService<IAmazonCloudWatch>();
builder.Services.AddAWSService<IAmazonSimpleSystemsManagement>();

// Application Services
builder.Services.AddSingleton<ICloudWatchService, CloudWatchService>();
builder.Services.AddSingleton<ISettingsService, SettingsService>();
builder.Services.AddSingleton<IHealthService, HealthService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();