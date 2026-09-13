export function up(pgm) {
  pgm.addColumn("rooms", {
    description: {
      type: "varchar(500)",
    },
  });
}

export function down(pgm) {
  pgm.dropColumn("rooms", "description");
}