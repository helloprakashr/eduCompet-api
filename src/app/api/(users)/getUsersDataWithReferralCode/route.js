// src/app/api/(users)/getUsersDataWithReferralCode/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
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
        return NextResponse.json(
            { success: false, message: "Invalid API Auth Key" },
            { status: 401 }
        );
    }

    try {
        await connectdb();

        const { searchParams } = new URL(req.url);
        const referralCode = searchParams.get("referralCode");

        if (!referralCode) {
            return withCors(NextResponse.json(
                { success: false, message: "referralCode is required." },
                { status: 400 }
            ));
        }

        const user = await UserModel.findOne({ referralCode: referralCode }).select("_id").lean();

        if (!user) {
            return withCors(NextResponse.json(
                { success: false, message: "Referral code not found." },
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
        console.error("Error fetching user by referral code:", error);
        return withCors(NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: 500 }
        ));
    }
};