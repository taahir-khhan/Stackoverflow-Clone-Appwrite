import { Permission } from "node-appwrite";
import { db, voteCollection } from "../name";
import { databases } from "./config";

export default async function createVoteCollection() {
  // Creating collection
  await databases.createCollection(db, voteCollection, voteCollection, [
    Permission.read("any"),
    Permission.read("users"),
    Permission.write("users"),
    Permission.update("users"),
    Permission.delete("users"),
  ]);
  console.log("Vote collection is created");

  // Creating attributes
  await Promise.all([
    databases.createEnumAttribute(
      db,
      voteCollection,
      "type",
      ["question", "answer"],
      true
    ),
    databases.createEnumAttribute(
      db,
      voteCollection,
      "voteStatus",
      ["upvoted", "downvoted"],
      true
    ),
    databases.createStringAttribute(db, voteCollection, "typeId", 50, true),
    databases.createStringAttribute(db, voteCollection, "voteById", 50, true),
  ]);
  console.log("Vote attributes are created");
}
