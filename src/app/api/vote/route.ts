import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest } from "next/server";
import { Query } from "node-appwrite";

export async function POST(request: NextRequest) {
  const { votedById, voteStatus, type, typeId } = await request.json();

  const response = await databases.listDocuments(db, voteCollection, [
    Query.equal("type", type),
    Query.equal("typeId", typeId),
    Query.equal("votedById", votedById),
  ]);

  if (response.documents.length > 0) {
    await databases.deleteDocument(
      db,
      voteCollection,
      response.documents[0].$id
    );

    // Decrease the reputation of the question/answer author
    const questionOrAnswer = await databases.getDocument(
      db,
      type === "question" ? questionCollection : answerCollection,
      typeId
    );

    const authorPrefs = await users.getPrefs<UserPrefs>(
      questionOrAnswer.authorId
    );

    await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
      reputation:
        response.documents[0].voteStatus === "upvoted"
          ? Number(authorPrefs.reputation) - 1
          : Number(authorPrefs.reputation) + 1,
    });
  }

  // It means previous vote doesn't exist or voteStatus changed
  if (response.documents[0]?.voteStatus !== voteStatus) {
    //
  }

  const [upvotes, downvotes] = await Promise.all([
    databases.listDocuments(db, voteCollection, [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.equal("voteStatus", "upvoted"),
      Query.equal("votedById", votedById),
      Query.limit(1),
    ]),
    databases.listDocuments(db, voteCollection, [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.equal("voteStatus", "downvoted"),
      Query.equal("votedById", votedById),
      Query.limit(1), // for optimization as we only need total
    ]),
  ]);
}
