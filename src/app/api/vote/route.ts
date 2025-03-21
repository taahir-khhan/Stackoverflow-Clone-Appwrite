import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request: NextRequest) {
  const { votedById, voteStatus, type, typeId } = await request.json();

  const response = await databases.listDocuments(db, voteCollection, [
    Query.equal("type", type),
    Query.equal("typeId", typeId),
    Query.equal("votedById", votedById),
  ]);

  // If some document is present. that means the user already voted this and clicking again, Now you remove the vote.
  if (response.documents.length > 0) {
    await databases.deleteDocument(
      db,
      voteCollection,
      response.documents[0].$id
    );

    // Here we just checking, which type of document is this, is it question or answer, Because in our application we are having upvote and downvot for both question and answer.
    const questionOrAnswer = await databases.getDocument(
      db,
      type === "question" ? questionCollection : answerCollection,
      typeId
    );

    const authorPrefs = await users.getPrefs<UserPrefs>(
      questionOrAnswer.authorId
    );

    // Decrease the reputation of the question/answer author
    await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
      reputation:
        response.documents[0].voteStatus === "upvoted"
          ? Number(authorPrefs.reputation) - 1
          : Number(authorPrefs.reputation) + 1,
    });
  }

  // It means previous vote doesn't exist or voteStatus changed
  if (response.documents[0]?.voteStatus !== voteStatus) {
    const doc = await databases.createDocument(
      db,
      voteCollection,
      ID.unique(),
      {
        type,
        typeId,
        voteStatus,
        votedById,
      }
    );

    // Increase / Decrease the reputation of the question / answer author accordingly
    const questionOrAnswer = await databases.getDocument(
      db,
      type === "question" ? questionCollection : answerCollection,
      typeId
    );

    const authorPrefs = await users.getPrefs<UserPrefs>(
      questionOrAnswer.authorId
    );

    // If vote was present
    if (response.documents[0]) {
      await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
        reputation:
          // that means previous vote was 'upvoted' and new value is 'downvoted' so we have to decrease the reputation
          response.documents[0].voteStatus === "upvoted"
            ? Number(authorPrefs.reputation) + 1
            : Number(authorPrefs.reputation) - 1,
      });
    } else {
      await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
        reputation:
          // that means prev vote was "upvoted" and new value is "downvoted" so we have to decrease the reputation
          voteStatus === "upvoted"
            ? Number(authorPrefs.reputation) + 1
            : Number(authorPrefs.reputation) - 1,
      });
    }
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

  return NextResponse.json(
    {
      data: {
        document: null,
        voteResult: (upvotes.total = downvotes.total),
      },
      message: "vote handled",
    },
    {
      status: 200,
    }
  );
}
