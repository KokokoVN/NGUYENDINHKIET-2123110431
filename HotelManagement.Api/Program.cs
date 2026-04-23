using HotelManagement.Api.Data;
using HotelManagement.Api.Filters;
using HotelManagement.Api.Services;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiSuccessResponseFilter>();
}).AddJsonOptions(o =>
{
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .ToDictionary(
                x => x.Key,
                x => x.Value!.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Giá trị không hợp lệ." : e.ErrorMessage).ToArray());

        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new
        {
            message = "Dữ liệu gửi lên không hợp lệ.",
            errors,
            traceId = context.HttpContext.TraceIdentifier
        });
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HotelManagement API",
        Version = "v1",
        Description =
            "API quản lý khách sạn — Swagger: POST /api/auth/login → Authorize → dán accessToken.\n" +
            "Nhóm: Auth, Hotels, RoomTypes, Rooms, Customers, Bookings, Stays, HotelServices (danh mục), " +
            "ServiceOrders, Payments, Invoices.\n" +
            "Tích điểm: khi xuất hóa đơn, khách có CustomerId được cộng điểm (1 điểm/100.000đ); hạng BRONZE/SILVER/GOLD/PLATINUM."
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập accessToken trả về từ POST /api/auth/login (Swagger tự thêm tiền tố Bearer)."
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
var jwtIssuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is missing.");
var jwtAudience = jwtSection["Audience"] ?? throw new InvalidOperationException("Jwt:Audience is missing.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();
    // Đồng bộ nhanh schema Customer sau khi chuyển dữ liệu từ Guests sang Customers.
    db.Database.ExecuteSqlRaw("""
        IF COL_LENGTH('dbo.Customer', 'IdType') IS NULL
            ALTER TABLE [dbo].[Customer] ADD [IdType] NVARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Customer', 'IdNumber') IS NULL
            ALTER TABLE [dbo].[Customer] ADD [IdNumber] NVARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Customer', 'DateOfBirth') IS NULL
            ALTER TABLE [dbo].[Customer] ADD [DateOfBirth] DATE NULL;
        IF COL_LENGTH('dbo.Customer', 'Nationality') IS NULL
            ALTER TABLE [dbo].[Customer] ADD [Nationality] NVARCHAR(100) NULL;
    """);
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            return;
        }

        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");
        if (feature?.Error is not null)
        {
            logger.LogError(feature.Error, "Unhandled exception at {Path}", feature.Path);
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            message = "Máy chủ gặp lỗi không mong muốn. Vui lòng thử lại.",
            traceId = context.TraceIdentifier
        }));
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "HotelManagement API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseStatusCodePages(async statusContext =>
{
    var http = statusContext.HttpContext;
    if (!http.Request.Path.StartsWithSegments("/api"))
        return;

    if (http.Response.ContentLength.HasValue && http.Response.ContentLength.Value > 0)
        return;

    if (!string.IsNullOrWhiteSpace(http.Response.ContentType))
        return;

    var message = http.Response.StatusCode switch
    {
        StatusCodes.Status400BadRequest => "Yêu cầu không hợp lệ.",
        StatusCodes.Status401Unauthorized => "Bạn chưa đăng nhập hoặc token đã hết hạn.",
        StatusCodes.Status403Forbidden => "Bạn không có quyền thực hiện thao tác này.",
        StatusCodes.Status404NotFound => "Không tìm thấy tài nguyên yêu cầu.",
        StatusCodes.Status405MethodNotAllowed => "Phương thức gọi API không được hỗ trợ.",
        _ => "Yêu cầu không thành công."
    };

    http.Response.ContentType = "application/json";
    await http.Response.WriteAsync(JsonSerializer.Serialize(new
    {
        message,
        statusCode = http.Response.StatusCode,
        traceId = http.TraceIdentifier
    }));
});

app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api"))
    {
        await next();
        return;
    }

    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
        .CreateLogger("ApiRequestLogger");
    var stopwatch = Stopwatch.StartNew();

    var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? context.User.FindFirstValue("sub")
                 ?? "anonymous";
    var username = context.User.Identity?.Name ?? "anonymous";

    try
    {
        await next();
        stopwatch.Stop();
        logger.LogInformation(
            "[API] {Method} {Path} => {StatusCode} in {ElapsedMs}ms | userId={UserId} | username={Username} | query={QueryString}",
            context.Request.Method,
            context.Request.Path.Value,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds,
            userId,
            username,
            context.Request.QueryString.Value ?? string.Empty);
    }
    catch (Exception ex)
    {
        stopwatch.Stop();
        logger.LogError(
            ex,
            "[API] {Method} {Path} => EXCEPTION in {ElapsedMs}ms | userId={UserId} | username={Username}",
            context.Request.Method,
            context.Request.Path.Value,
            stopwatch.ElapsedMilliseconds,
            userId,
            username);
        throw;
    }
});

app.MapControllers();

app.Run();
