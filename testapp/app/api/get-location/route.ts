import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const query = "SELECT * FROM testmap ORDER BY id DESC"; // Lấy toàn bộ dữ liệu, sắp xếp mới nhất trước
        const result = await pool.query(query);

        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error("🔥 Lỗi khi lấy dữ liệu từ PostgreSQL:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}