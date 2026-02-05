using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindWeatherServer.Migrations
{
    /// <inheritdoc />
    public partial class AddTagsColumn : Migration
    {
        /// <inheritdoc />
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "EmotionLogs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Tags", table: "EmotionLogs");
        }
    }
}
