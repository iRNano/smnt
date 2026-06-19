import { NextResponse } from "next/server";
import { getMapApiResponse } from "@/lib/mapApiService";

export async function GET() {
  try {
    const data = await getMapApiResponse();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Map API error:", err);
    return NextResponse.json(
      {
        error: "Failed to load map data",
        proposedMain: null,
        officialRoutes: [],
        userRoutes: [],
        routes: [],
        pois: [],
        sections: [],
      },
      { status: 500 }
    );
  }
}
