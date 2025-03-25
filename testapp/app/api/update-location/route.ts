import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { lat, lng } = await req.json();
        if (!lat || !lng) {
            return NextResponse.json({ success: false, error: "Thiếu dữ liệu" }, { status: 400 });
        }

        // Lấy IP từ header
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

        // Kiểm tra xem IP đã tồn tại trong DB chưa
        const checkQuery = "SELECT * FROM testmap WHERE ip = $1";
        const checkResult = await pool.query(checkQuery, [ip]);

        let result;

        if (checkResult.rows.length > 0) {
            // Nếu IP đã tồn tại, cập nhật lat & lng
            const updateQuery = "UPDATE testmap SET lat = $1, lng = $2 WHERE ip = $3 RETURNING *";
            result = await pool.query(updateQuery, [lat, lng, ip]);
        } else {
            // Nếu IP chưa tồn tại, thêm mới
            const insertQuery = "INSERT INTO testmap (lat, lng, ip,name) VALUES ($1, $2, $3, $4) RETURNING *";
            result = await pool.query(insertQuery, [lat, lng, ip, "test"]);
        }

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        console.error("🔥 Lỗi khi lưu vị trí vào PostgreSQL:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}