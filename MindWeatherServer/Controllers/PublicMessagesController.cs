using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [Route("api/public-messages")]
    [ApiController]
    public class PublicMessagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PublicMessagesController(AppDbContext context)
        {
            _context = context;
        }

        // 1. 공용 위로글 게시 (POST /api/public-messages)
        [HttpPost]
        public async Task<IActionResult> PostPublicMessage(
            [FromBody] CreatePublicMessageRequest request
        )
        {
            var message = new PublicComfortMessage
            {
                UserId = request.UserId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
            };

            _context.PublicComfortMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "공개 위로가 등록되었습니다.", id = message.Id });
        }

        // 2. 공용 위로글 목록 조회 (GET /api/public-messages)
        [HttpGet]
        public async Task<IActionResult> GetPublicMessages([FromQuery] string sort = "latest")
        {
            IQueryable<PublicComfortMessage> query = _context.PublicComfortMessages;

            if (sort == "top")
            {
                query = query
                    .OrderByDescending(m => m.LikeCount)
                    .ThenByDescending(m => m.CreatedAt);
            }
            else
            {
                query = query.OrderByDescending(m => m.CreatedAt);
            }

            var messages = await query
                .Take(50)
                .Select(m => new PublicMessageResponse
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    Content = m.Content,
                    LikeCount = m.LikeCount,
                    CreatedAt = m.CreatedAt,
                })
                .ToListAsync();

            return Ok(messages);
        }

        // 3. 공감(하트) 하기 (POST /api/public-messages/{id}/like)
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikeMessage(int id)
        {
            var message = await _context.PublicComfortMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            message.LikeCount++;
            await _context.SaveChangesAsync();

            return Ok(new { likeCount = message.LikeCount });
        }
    }
}
