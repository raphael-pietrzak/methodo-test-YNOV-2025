import { RowDataPacket } from "mysql2";

export default interface Chapter extends RowDataPacket {
  id: number;
  book_id: number;
  title: string;
  content: string;
  chapter_number: number;
  created_at: string;
}
