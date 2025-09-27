// src/app/api/(transaction)/getTransactionsBySubscriptionId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId"); // MongoDB ObjectId of the subscription

    if (!subscriptionId) {
      return withCors(NextResponse.json(
        { success: false, message: "subscriptionId query param is required" },
        { status: 400 }
      ));
    }

    const transactions = await TransactionModel.find({ subscriptionId })
      .populate("subscriptionId", "name subscriptionId")
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 }); // latest first

    if (!transactions || transactions.length === 0) {
      return withCors(NextResponse.json(
        { success: false, message: "No transactions found for this subscription" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Transactions fetched successfully",
        data: transactions,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching transactions by subscription:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
