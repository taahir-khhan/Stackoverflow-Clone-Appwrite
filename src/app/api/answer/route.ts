import { answerCollection, db } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    // Taking these things from the user through the frontend
    const { questionId, authorId, answer } = await request.json();

    // creating a document in the appwrite database
    const response = await databases.createDocument(
      db,
      answerCollection,
      ID.unique(),
      {
        content: answer,
        authorId: authorId,
        questionId: questionId,
      }
    );

    // When any user post an answer, we will be increasing their reputation by 1
    const prefs = await users.getPrefs<UserPrefs>(authorId);
    await users.updatePrefs(authorId, {
      reputation: Number(prefs.reputation) + 1,
    });

    return NextResponse.json(response, {
      status: 201,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Error while creating answer",
      status: error?.status || error?.code || 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { answerId } = await request.json();

    const answer = await databases.getDocument(db, answerCollection, answerId);

    const response = await databases.deleteDocument(
      db,
      answerCollection,
      answerId
    );

    // decrease the reputation
    const prefs = await users.getPrefs<UserPrefs>(answer.authorId);
    await users.updatePrefs(answer.authorId, {
      reputation: Number(prefs.reputation) - 1,
    });

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Error deleting the answer",
      status: error?.status || error?.code || 500,
    });
  }
}
