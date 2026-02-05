using Microsoft.AspNetCore.SignalR;
using MindWeatherServer.DTOs;

namespace MindWeatherServer.Hubs
{
    public class EmotionHub : Hub
    {
        // Clients can call this method, though primarily we'll use server-to-client broadcasting
        public async Task BroadcastEmotion(EmotionResponse emotion)
        {
            await Clients.All.SendAsync("ReceiveEmotion", emotion);
        }
    }
}
