import { RowDataPacket } from "mysql2";

export default interface Book extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  authorId: string;
  createdAt: Date;
  chapters: {
    title: string;
    content: string;
  }[];
  tags: string[];
}
