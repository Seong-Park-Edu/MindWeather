using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MindWeatherServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicBoardEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReplyCount",
                table: "PublicComfortMessages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "PublicMessageLikes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicMessageLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicMessageLikes_PublicComfortMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "PublicComfortMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PublicMessageReplies",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicMessageReplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicMessageReplies_PublicComfortMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "PublicComfortMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyLetters_UserId_IsRead",
                table: "DailyLetters",
                columns: new[] { "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_ComfortMessages_ReceiverId",
                table: "ComfortMessages",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_ComfortMessages_SenderId",
                table: "ComfortMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_ComfortMessages_SentAt",
                table: "ComfortMessages",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_PublicMessageLikes_MessageId_UserId",
                table: "PublicMessageLikes",
                columns: new[] { "MessageId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicMessageReplies_MessageId",
                table: "PublicMessageReplies",
                column: "MessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PublicMessageLikes");

            migrationBuilder.DropTable(
                name: "PublicMessageReplies");

            migrationBuilder.DropIndex(
                name: "IX_DailyLetters_UserId_IsRead",
                table: "DailyLetters");

            migrationBuilder.DropIndex(
                name: "IX_ComfortMessages_ReceiverId",
                table: "ComfortMessages");

            migrationBuilder.DropIndex(
                name: "IX_ComfortMessages_SenderId",
                table: "ComfortMessages");

            migrationBuilder.DropIndex(
                name: "IX_ComfortMessages_SentAt",
                table: "ComfortMessages");

            migrationBuilder.DropColumn(
                name: "ReplyCount",
                table: "PublicComfortMessages");
        }
    }
}
