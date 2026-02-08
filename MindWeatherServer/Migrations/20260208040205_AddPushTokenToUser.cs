using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindWeatherServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPushTokenToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PushToken",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PushTokenUpdatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PushToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PushTokenUpdatedAt",
                table: "Users");
        }
    }
}
