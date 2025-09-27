// src/app/api/(users)/getUsersDataWithId/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import mongoose from 'mongoose'; // Import mongoose

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    );
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("Id");

    if (!userId) {
      return withCors(NextResponse.json(
        { success: false, message: "A valid user ID is required." },
        { status: 400 }
      ));
    }
    
    // ✅ FIX: Validate the ID format before querying
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return withCors(NextResponse.json({ success: false, message: "Invalid user ID format." }, { status: 400 }));
    }

    // ✅ FIX: Find user by their MongoDB _id instead of firebaseUid
    const user = await UserModel.findById(userId).select("-password -__v").lean();

    if (!user) {
      return withCors(NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "User fetched successfully.",
        data: user,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};