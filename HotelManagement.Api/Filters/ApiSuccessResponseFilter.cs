using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HotelManagement.Api.Filters;

public class ApiSuccessResponseFilter : IAsyncResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        if (!context.HttpContext.Request.Path.StartsWithSegments("/api"))
        {
            await next();
            return;
        }

        if (context.Result is ObjectResult objectResult)
        {
            var statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
            if (statusCode >= 200 && statusCode < 300 && !HasMessageField(objectResult.Value))
            {
                objectResult.Value = new
                {
                    message = BuildSuccessMessage(context.HttpContext.Request.Method),
                    data = objectResult.Value
                };
            }
        }
        else if (context.Result is EmptyResult)
        {
            context.Result = new OkObjectResult(new
            {
                message = BuildSuccessMessage(context.HttpContext.Request.Method),
                data = (object?)null
            });
        }

        await next();
    }

    private static bool HasMessageField(object? value)
    {
        if (value is null) return false;
        var prop = value.GetType().GetProperty("message") ?? value.GetType().GetProperty("Message");
        return prop is not null;
    }

    private static string BuildSuccessMessage(string method)
        => method.ToUpperInvariant() switch
        {
            "GET" => "Lấy dữ liệu thành công.",
            "POST" => "Tạo dữ liệu thành công.",
            "PUT" or "PATCH" => "Cập nhật dữ liệu thành công.",
            "DELETE" => "Xóa dữ liệu thành công.",
            _ => "Thao tác thành công."
        };
}
